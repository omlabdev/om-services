const WorkEntryModel = require('./../models/work_entry');
const ActivityApi = require('./activity');
const BillingApi = require('./billing');
const ProjectModel = require('./../models/project');
const { formatSecondsIntoTime } = require('../utils');
const moment = require('moment');
const AlarmRunner = require('./alarms/AlarmRunner');

/*
	GET 	/api/{v}/objectives/:id/work-entries

	GET 	/api/{v}/projects/:id/work-entries

	POST 	/api/{v}/objectives/:id/work-entries/add

	DELETE	/api/{v}/objectives/:id/work-entries/:id

	GET 	/api/{v}/projects/:id/work-entries/export/html
 */
exports.setup = (router) => {
	router.get('/objectives/:objectiveId/work-entries', exports.getWorkEntries);
	router.post('/objectives/:objectiveId/work-entries/add', exports.createWorkEntry);
	router.delete('/objectives/:objectiveId/work-entries/:workEntryId', exports.deleteWorkEntry);
	router.get('/projects/:projectId/work-entries', exports.getWorkEntriesForProject);
	router.get('/projects/:projectId/work-entries/export/detailed/html', exports.exportWorkEntriesDetailedViewForProject);
	router.get('/projects/:projectId/work-entries/export/client/html', exports.exportWorkEntriesClientViewForProject);
}

exports.createWorkEntry = function(req, res) {
	const entryData = setCreateDefaults(req.body, req);
	const model = new WorkEntryModel(entryData);

	const createP = WorkEntryModel.create(model);
	const activityP = createP.then(doc => 
		createCreateActivity(doc, doc.user));

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.then(_ => { AlarmRunner.runScheduled() })
		.catch((e) => { res.json({ error: e.message }) });
}

function setCreateDefaults(entryData, req) {
	// set objective id
	entryData.objective = req.params.objectiveId;
	// set creator
	if (!entryData.user) {
		entryData.user = req.currentUser._id.toString();
	}
	return entryData;
}

exports.deleteWorkEntry = function(req, res) {
	const _id = req.params.workEntryId;
	const findP = WorkEntryModel.findById(_id);
	const deleteP = findP.then(() => WorkEntryModel.remove({ _id }));
	const activityP = findP.then(doc => 
		createDeleteActivity(doc, req.currentUser._id))
	Promise.all([findP, deleteP, activityP])
		.then(([doc, result, _]) => { res.json(result) })
		.catch((e) => { res.json({ error: e.message }) });
}

exports.getWorkEntries = function(req, res) {
	const objective = req.params.objectiveId;
	WorkEntryModel.find({ objective })
		.populate('user')
		.sort({ created_ts : -1 })
		.then((entries) => {
			res.json({ entries })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

function createCreateActivity(workEntry, userId) {
	const formattedTime = formatSecondsIntoTime(workEntry.time);
	return ActivityApi.createActivity({
		description: `%user.first_name% has registered ${formattedTime}hs for objective: %meta.objective.title%`,
		type: `workentry-created`,
		user: userId.toString(),
		meta: { objective : workEntry.objective }
	})
}

function createDeleteActivity(workEntry, userId) {
	const formattedTime = formatSecondsIntoTime(workEntry.time);
	return ActivityApi.createActivity({
		description: `%user.first_name% has deleted ${formattedTime}hs from objective: %meta.objective.title%`,
		type: `workentry-deleted`,
		user: userId.toString(),
		meta: { objective : workEntry.objective } 
	})
}

exports.getWorkEntriesForProject = function(req, res) {
	const { projectId } = req.params;

	_getWorkEntriesForProject(projectId, req.query)
		.then(we => { res.json({ entries: we }) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Renders a detailed HTML report of work entries for the specified
 * project applying the filters sent on the request by querystring.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.exportWorkEntriesDetailedViewForProject = function(req, res) {
	const { projectId } = req.params;

	const projectP = ProjectModel.findById(projectId);
	const weP = _getWorkEntriesForProject(projectId, req.query);

	Promise.all([projectP, weP])
		.then(([project, we]) => {
			res.render('work_entries_detailed', { entries: we, project: project })
		})
		.catch(e => { res.render('error', { error: e }) })
}

/**
 * Renders a top level HTML report of work entries for the specified
 * project applying the filters sent on the request by querystring.
 *
 * Also includes purchased hours left.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.exportWorkEntriesClientViewForProject = function(req, res) {
	const { projectId } = req.params;

	const projectP = BillingApi.getProjectsBillingWithVariables(projectId);
	const weP = _getWorkEntriesForProject(projectId, req.query);

	Promise.all([projectP, weP])
		.then(([project, we]) => {
			res.render('work_entries_client', { entries: we, project: project })
		})
		.catch(e => { res.render('error', { error: e }) })
}

/**
 * Fetches the work entries recorded for the given project id
 * after applying the given filters.
 *
 * Returns a Premise for a working entries array.
 * 
 * @param  {String} projectId 
 * @param  {Object} _filters  
 * @return {Premise}           
 */
function _getWorkEntriesForProject(projectId, _filters = {}) {
	let filters = Object.assign({}, _filters);

	// remove empty filters
	Object.keys(filters).forEach(f => {
		if (!filters[f]) delete filters[f];
	})

	// re-format created_ts filter from dateFrom and dateTo
	if (filters.dateFrom) {
		filters.created_ts = {
			$gte: moment.utc(filters.dateFrom).startOf('day').toDate()
		}
		delete(filters['dateFrom']);
	}
	if (filters.dateTo) {
		if (!filters.created_ts) filters.created_ts = {};
		filters.created_ts['$lte'] = moment.utc(filters.dateTo).endOf('day').toDate();
		delete(filters['dateTo']);
	}

	return BillingApi.getWorkEntriesForProject(projectId, filters, true);
}

