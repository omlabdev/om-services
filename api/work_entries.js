const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ActivityApi = require('./activity');
const BillingApi = require('./billing');
const ProjectModel = require('./../models/project');
const UserModel = require('./../models/user');
const InvoiceModel = require('./../models/invoice');
const ObjectiveModel = require('./../models/objective');
const { formatSecondsIntoTime } = require('../utils');
const moment = require('moment');
const { runAlarms } = require('./alarms');

/*
	GET 	/api/{v}/objectives/:id/work-entries

	GET 	/api/{v}/objectives/:id/work-entries/:id

	GET 	/api/{v}/projects/:id/work-entries

	GET 	/api/{v}/users/:id/work-entries

	POST 	/api/{v}/objectives/:id/work-entries/add

	DELETE	/api/{v}/objectives/:id/work-entries/:id

	GET 	/api/{v}/projects/:id/work-entries/export/detailed/html

	GET 	/api/{v}/projects/:id/work-entries/export/client/html

	GET		/api/{v}/sweden/export/html
 */
exports.setup = (router) => {
	router.get('/objectives/:objectiveId/work-entries', exports.getWorkEntriesForObjective);
	router.post('/objectives/:objectiveId/work-entries/add', exports.createWorkEntry);
	router.post('/clockify/work-entries/add', exports.createClockifyWorkEntry);
	router.delete('/objectives/:objectiveId/work-entries/:workEntryId', exports.deleteWorkEntry);
	router.get('/projects/:projectId/work-entries', exports.getWorkEntriesForProject);
	router.get('/projects/:projectId/work-entries/export/detailed/html', exports.exportWorkEntriesDetailedViewForProject);
	router.get('/projects/:projectId/work-entries/export/client/html', exports.exportWorkEntriesClientViewForProject);
	router.get('/users/:userId/work-entries', exports.getWorkEntriesForUser);
	router.get('/users/:userId/work-entries/export/html', exports.exportWorkEntriesForUser);
	router.get('/sweden/export/html', exports.exportSwedenReport);
}

exports.exportSwedenReport = async function(req, res) {
	const projects = await ProjectModel.find({
		name: {
			$in: [
				'Beauty Blender',
				'Fellow Barber',
				'Jamie Young',
				'Lashify',
				'Maison Ullens',
				'Sarah Flint',
				'Surratt',
				'Sugarpova',
			]
		}
	} )

	const hiddenUsers = await UserModel.find({
		username: 'ericachiruchi'
	});

	const filters = {
		...req.query,
		user: { $nin: hiddenUsers.map(({ _id }) => _id) }
	};

	const entriesByProject = await Promise.all(
		projects.map( project =>
			_getWorkEntriesForProject( project._id, filters )
				.then( entries => entries.map( e => ( {
					time: e.time,
					task: e.objective.related_task.title,
					created_ts: e.created_ts,
					project: project.name,
				} ) ) )
		)
	);

	const results = entriesByProject.reduce( (acc, entries) => [...acc, ...entries] , [])
		.sort((a, b) => a.created_ts - b.created_ts);

	res.render('work_entries_sweden', { results } );
}

exports.createClockifyWorkEntry = function(req, res) {
	const data = req.body;
	// Find the project
	ProjectModel.findOne({ name: data.project }, (err, project) => {
		if (err) {
			res.json({ status: 'error', err: err });
			return;
		}

		if (!project) {
			res.json({ status: 'error', err: 'No porject found' });
			return;
		}

		// Find the user
		UserModel.findOne({ email: data.user }, (err, user) => {
			if (err) {
				res.json({ status: 'error', err: err });
				return;
			}

			if (!user) {
				res.json({ status: 'error', err: 'No user found' });
				return;
			}

			// Find the objective
			const title = data.title ? data.title : `[clockify] ${project.name}`;
			TaskModel.findOne( { title: title }, (err, task) => {
				if (err) {
					res.json({ status: 'error', err: err });
					return;
				}

				// If there's no task => create a new task and then a new objective
				if (!task) {
					task = new TaskModel({
						title: title,
						project: project._id,
						created_by: req.currentUser._id.toString(),
						origin: 'clockify',
					});

					task.save((err) => {
						if (err) {
							res.json({ status: 'error', err: err });
							return;
						}

						const objective = new ObjectiveModel({
							level: 'month',
							related_task: task._id,
							owners: [user._id],
							created_by: req.currentUser._id.toString(),
						});

						objective.save((err) => {
							if (err) {
								res.json({ status: 'error', err: err });
								return;
							}
							newClockifyWorkEntry(objective._id, user._id, data.time);
						});
					});
				} else {
					ObjectiveModel.findOne({ related_task: task._id }, (err, objective) => {
						// If there's an objective, make sure the user is an owner for it
						if (objective.owners.indexOf(user._id) === -1) {
							objective.owners.push(user._id);
							objective.save((err) => {
								if (err) {
									res.json({ status: 'error', err: err });
									return;
								}
								newClockifyWorkEntry(objective._id, user._id, data.time);
							});
						} else {
							newClockifyWorkEntry(objective._id, user._id, data.time);
						}
					});
				}
			});
		});
	});

	// Create the new work entry with the time from Clockify
	function newClockifyWorkEntry(objective_id, user_id, time) {
		const workEntry = new WorkEntryModel({
			objective: objective_id,
			user: user_id,
			time: time,
		});
		workEntry.save((err) => {
			if (err) {
				res.json({ status: 'error', err: err });
				return;
			}

			res.json({ status: 'ok' });
		});
	}
};

exports.createWorkEntry = function(req, res) {
	const entryData = setCreateDefaults(req.body, req);
	const model = new WorkEntryModel(entryData);

	const createP = WorkEntryModel.create(model);
	const activityP = createP.then(doc =>
		createCreateActivity(doc, doc.user));

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc); return doc; })
		.then(doc => runAlarms(doc, WorkEntryModel))
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

exports.getWorkEntriesForObjective = function(req, res) {
	const objective = req.params.objectiveId;
	WorkEntryModel.find({ objective })
		.populate('user')
		.sort({ created_ts : -1 })
		.then((entries) => { res.json({ entries }) })
		.catch((e) => { res.json({ error: e.message }) })
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

exports.getWorkEntriesForUser = function(req, res) {
	const { userId } = req.params;
	_getWorkEntriesForUser(userId, req.query)
		.then(_populateBilled(userId))
		.then(we => { res.json({ entries: we }) })
		.catch(e => { res.json({ error: e.message }) })
}

function _populateBilled(byUserId) {
	return async workEntries => {
		const query = { direction: 'in' };
		if (byUserId) query.created_by = byUserId;

		const invoices = await InvoiceModel.find(query);
		return workEntries.map(we => {
			for (var i = 0; i < invoices.length; i++) {
				// check if the work entry is in this invoice.
				// we need to cast all _ids to string for the includes to work
				const we_ids = invoices[i].work_entries.map(_id => _id.toString());
				if (we_ids.includes(we.id)) {
					// cast to object to add new props
					return Object.assign(we.toObject(), { billed: true, paid: !!invoices[i].paid_date });
				}
			}
			// cast to object to add new props
			return Object.assign(we.toObject(), { billed: false, paid: false });
		})
	}
}

/**
 * Fetches all the work entries registered by the given
 * user applying the given filters.
 *
 * If another userId is passed as part of the filters, the
 * userId passed as first parameter will override the one
 * inside the filters.
 *
 * Returns a promise for the array of work entries.
 *
 * @param  {String} userId
 * @param  {Object} _filters
 * @return {Promise}
 */
function _getWorkEntriesForUser(userId, _filters) {
	// force userId as filter
	const filters = Object.assign(_filters, { user: userId });

	// if project is filtered, remove for the we filter and
	// filter locally later through objective.related_task.project
	let projectId = filters.project;
	if (projectId) {
		delete filters.project;
	}

	const query = _formatFilters(filters);

	return WorkEntryModel.find(query)
		.sort({ created_ts: -1 })
		.populate('user objective')
		.then(we => TaskModel.populate(we, { // populate deeper level
			path: 'objective.related_task',
			select: 'title project',
			model: 'Task'
		}))
		.then(we => ProjectModel.populate(we, { // populate deeper deeper level
			path: 'objective.related_task.project',
			select: 'name',
			model: 'Project'
		}))
		.then(we => we.filter(filterByProject(projectId)))
}

function filterByProject(projectId = null) {
	return function(we) {
		if (!projectId) return true;
		return we.objective.related_task
			&& we.objective.related_task.project.id === projectId;
	}
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
 * Renders a detailed HTML report of work entries for the specified
 * user applying the filters sent on the request by querystring.
 *
 * @param  {Object} req
 * @param  {Object} res
 */
exports.exportWorkEntriesForUser = function(req, res) {
	const { userId } = req.params;

	const userP = UserModel.findById(userId);
	const weP = _getWorkEntriesForUser(userId, req.query);

	Promise.all([userP, weP])
		.then(([user, we]) => {
			res.render('work_entries_user', { entries: we, user: user })
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
 * Optimized way to fetch the work entries recorded for the
 * given project id after applying the given filters.
 *
 * Starts with the project and walks down to the tasks, then
 * objectives and then work entries.
 *
 * Returns a Premise for a working entries array.
 *
 * @param  {String} projectId
 * @param  {Object} _filters
 * @return {Premise}
 */
function _getWorkEntriesForProject(projectId, _filters = {}) {
	let filters = _formatFilters(_filters);
	return BillingApi.getWorkEntriesForProject(projectId, filters, true);
}

/**
 * Receives an object with filters sent over the request
 * and re-formats them to make them Mongo-compatible.
 *
 * @param  {Object} _filters
 * @return {Object}
 */
function _formatFilters(_filters) {
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

	return filters;
}
