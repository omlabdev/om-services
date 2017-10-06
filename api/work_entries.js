const WorkEntryModel = require('./../models/work_entry');
const ActivityApi = require('./activity');
const { formatSecondsIntoTime } = require('../utils');

/*
	GET 	/api/{v}/objectives/:id/work-entries

	POST 	/api/{v}/objectives/:id/work-entries/add

	DELETE	/api/{v}/objectives/:id/work-entries/:id
 */
exports.setup = (router) => {
	router.get('/objectives/:objectiveId/work-entries', exports.getWorkEntries);
	router.post('/objectives/:objectiveId/work-entries/add', exports.createWorkEntry);
	router.delete('/objectives/:objectiveId/work-entries/:workEntryId', exports.deleteWorkEntry);
}

exports.createWorkEntry = function(req, res) {
	const entryData = setCreateDefaults(req.body, req);
	const model = new WorkEntryModel(entryData);

	const createP = WorkEntryModel.create(model);
	const activityP = createP.then(doc => 
		createCreateActivity(doc, doc.user));

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc) })
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
