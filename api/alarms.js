const AlarmModel = require('./../models/alarm');
const moment = require('moment');
const AlarmRunner = require('./alarms/AlarmRunner');

const ObjectId = require('mongoose').Types.ObjectId;
const InvoiceModel = require('../models/invoice');
const ObjectiveModel = require('../models/objective');
const TaskModel = require('../models/task');
const WorkEntryModel = require('../models/work_entry');

/*
	GET		/api/{v}/admin/alarms

	POST 	/api/{v}/admin/alarms/add

	POST 	/api/{v}/admin/alarms/:alarmId

	DELETE 	/api/{v}/admin/alarms/:alarmId

	POST 	/api/{v}/admin/alarms/eval
 */
exports.setup = (router) => {
	router.post('/admin/alarms/eval', exports.eval);
	router.post('/admin/alarms/add', exports.createAlarm);
	router.post('/admin/alarms/:alarmId', exports.updateAlarm);
	router.delete('/admin/alarms/:alarmId', exports.deleteAlarm);
	router.get('/admin/alarms', exports.getAlarms);
}

exports.getAlarms = function(req, res) {
	AlarmModel.find().populate('created_by').sort({ created_ts : -1 })
		.then((alarms) => {
			res.json({ alarms })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.updateAlarm = function(req, res) {
	const _id = req.params.alarmId;
	const alarmData = nullEmpties(req.body);
	AlarmModel.findByIdAndUpdate(_id, {$set: alarmData})
		.then(doc => { res.json(doc) })
		.catch((e) => { res.json({ error: e.message }) })
}

exports.deleteAlarm = function(req, res) {
	const _id = req.params.alarmId;
	AlarmModel.remove({ _id })
		.then(result => { res.json(result) })
		.catch((e) => { res.json({ error: e.message }) });
}

exports.createAlarm = function(req, res) {
	const alarmData = nullEmpties(setCreateDefaults(req.body, req));
	const model = new AlarmModel(alarmData);

	AlarmModel.create(model)
		.then(doc => AlarmModel.populate(doc, {path: 'created_by'}))
		.then(doc => { res.json(doc) })
		.catch((e) => { res.json({ error: e.message }) });
}

function setCreateDefaults(alarmData, req) {
	alarmData.created_by = req.currentUser;
	return alarmData;
}

function nullEmpties(alarmData) {
	if (!alarmData.user_filter) alarmData.user_filter = null;
	if (!alarmData.project_filter) alarmData.project_filter = null;
	return alarmData;
}

/**
 * Runs the alarms. Evaluates which alarms should go off now.
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.eval = function(req, res) {
	AlarmRunner.runNow().then(summary => res.json(summary)).catch(e => {
		console.error(e);
		res.json({ error: e.message });
	});
}

/*************************
 *
 * Alarm Connector
 * Code below runs specific alarms so that only the ones related to the
 * event are fired
 *
 *************************/

/**
 * Schedules the alarm runner with filters for the given doc and model
 * @param  {Object} doc   
 * @param  {Model} model Mongoose Model
 * @return {Promise}       
 */
exports.runAlarms = async function(doc, model) {
	let filters = await getAlarmFiltersForModel(doc, model);
	return AlarmRunner.runScheduled(filters);
}

/**
 * Returns the filters to be used by the alarm runner for the given
 * doc and model.
 * @param  {Object} doc   
 * @param  {Model} model Mongoose Model
 * @return {Object}      
 */
async function getAlarmFiltersForModel(doc, model) {
	switch (model) {

		case InvoiceModel: {
			// check ObjectIds to support populated & non-populated fields
			const projectId = !doc.project ? null : (ObjectId.isValid(doc.project) ? doc.project : doc.project._id);
			// build alarm filters
			const filters = { measure: 'hours_billed' };
			if (projectId) {
				filters['$or'] = [ { project_filter: projectId }, { project_filter: null } ]
			}
			return filters;
		}

		case ObjectiveModel: {
			// check ObjectIds to support populated & non-populated fields
			const ownersIds = doc.owners.map(o => ObjectId.isValid(o) ? o : o._id);
			let projectId = null;
			if (doc.related_task) {
				if (ObjectId.isValid(doc.related_task)) {
					projectId = (await TaskModel.findById(task)).project;
				} else if (ObjectId.isValid(doc.related_task.project)) {
					projectId = doc.related_task.project;
				} else {
					projectId = doc.related_task.project._id;
				}
			}
			// build alarm filters
			const filters = { 
				measure: 'objectives_quantity', 
				$and: [ { $or: [ { user_filter: null }, { user_filter: { $in: ownersIds } } ] } ],
			};
			if (doc.progress === 1) {
				filters['$and'].push({ $or: [ { state_filter: 'completed' }, { state_filter: '' } ] });
			} else {
				filters['$and'].push({ $or: [ { state_filter: 'active' }, { state_filter: '' } ] });
			}
			if (projectId) {
				filters['$and'].push({ $or: [ { project_filter: projectId }, { project_filter: null } ] });
			}
			return filters; // add tasks_quantity for assigned tasks!!
		}

		case TaskModel: {
			// check ObjectIds to support populated & non-populated fields
			const projectId = ObjectId.isValid(doc.project) ? doc.project : doc.project._id;
			// build alarm filters
			const filters = { 
				measure: 'tasks_quantity',
				$and: [
					{ $or: [ { project_filter: projectId }, { project_filter: null } ] },
					{ $or: [ { state_filter: "" }, { state_filter: "unassigned" } ] }
				]
			};
			return filters;
		}

		case WorkEntryModel: {
			// check ObjectIds to support populated & non-populated fields
			const userId = ObjectId.isValid(doc.user) ? doc.user : doc.user._id;
			// get related objective + task
			const objectiveId = ObjectId.isValid(doc.objective) ? doc.objective : doc.objective._id;
			const objective = await ObjectiveModel.findById(objectiveId).populate('related_task', 'project');
			// build alarm filters
			const filters = {
				measure: 'hours_executed',
				$and: [
					{ $or: [ { user_filter: userId }, { user_filter: null } ] },
				]
			}
			if (objective.related_task) {
				filters['$and'].push({ $or: [ { project_filter: objective.related_task.project }, { project_filter: null } ] });
			}
			return filters;
		}

		default: return {};
	}
}