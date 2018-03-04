const AlarmModel = require('./../models/alarm');
const BillingApi = require('./billing');
const moment = require('moment');
const ProjectModel = require('../models/project');
const IntegrationModel = require('../models/integration');
const ObjectiveModel = require('../models/objective');
const TaskModel = require('../models/task');
const { sendMessage } = require('../utils/slack');

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
	_eval().then(summary => res.json(summary)).catch(e => {
		console.error(e);
		res.json({ error: e.message });
	});
}

/**
 * Evalues each alarm and gets the summary back.
 * Returns a promise that resolvs with all the summaries.
 * 
 * @return {Promise}
 */
async function _eval() {
	const alarms = await AlarmModel
		.find({ enabled: true })
		.populate('project_filter user_filter');
	return Promise.all(alarms.map(exports._evalAlarm));
}

/**
 * Evalues an alarm.
 * If the condition is met, the alarm goes off and the notifications 
 * are sent.
 *
 * Returns a promise that resolves to a summary with the alarm 
 * information.
 * 
 * @param  {Object} alarm 
 * @param {Boolean} mute If mute = True, skip sounding
 * @return {Promise}       
 */
exports._evalAlarm = async function(alarm, mute=false) {
	const { name } = alarm;

	// calculate current value for the measure
	const alarmValue = await ({
		'hours_executed': _evalHoursExecutedAlarm,
		'hours_billed': _evalHoursBilledAlarm,
		'objectives_quantity': _evalObjectivesQtyAlarm,
		'tasks_quantity': _evalTasksQtyAlarm,
	}[alarm.measure](alarm));

	const runs = ({
		'>': (a,b) => a > b,
		'>=': (a,b) => a >= b,
		'==': (a,b) => a === b,
		'<=': (a,b) => a <= b,
		'<': (a,b) => a < b,
	}[alarm.condition_op](alarmValue, alarm.condition_value));

	// sound the alarm
	if (!mute && runs) await soundAlarm(alarm, alarmValue);

	return { name, run: runs, alarm, currentValue: alarmValue };
}

/**
 * Evaluates the "hours executed" alarm and returns a Promise
 * that resolves to the executed hours.
 * 
 * @param  {Object} alarm 
 * @return {Promise}       Result value of the evaluation
 */
async function _evalHoursExecutedAlarm(alarm) {
	// build optional filters
	let filters = {};
	if (alarm.user_filter) filters.user = alarm.user_filter._id;
	if (alarm.date_filter) {
		const since = dateFromRelativeDate(alarm.date_filter);
		filters.created_ts = { $gte: since };
	}

	// Hours executed are fetched by project.
	// If no project is filtered, do for all of them.
	// Otherwise just the one selected for this alarm.
	const projectsIds = alarm.project_filter 
		? [alarm.project_filter._id]
		: [ (await ProjectModel.find().lean()).map(p => p._id) ]

	// calculate for each project and transform secs to hours
	const promises = projectsIds.map(pid => BillingApi.calculateExecutedWithFilters(pid, filters));
	const hoursPerProject = (await Promise.all( promises )).map(secs => secs/3600);
	const hours = hoursPerProject.reduce((t, h) => t+h, 0);

	return hours;
}

/**
 * Evaluates the "hours billed" alarm and returns a Promise
 * that resolves to the billed hours.
 * 
 * @param  {Object} alarm 
 * @return {Promise}       Result value of the evaluation
 */
async function _evalHoursBilledAlarm(alarm) {
	// build optional filters
	let filters = {};
	if (alarm.date_filter) {
		const since = dateFromRelativeDate(alarm.date_filter);
		filters.invoicing_date = { $gte: since };
	}
	if (alarm.project_filter) {
		filters.project = alarm.project_filter._id;
	}

	const invoices = await BillingApi.getInvoicesWithFilter(filters);
	const hours = invoices.map(i => i.billed_hours).reduce((t, h) => t+h, 0);
	return hours;
}

/**
 * Evaluates the "number of objectives" alarm and returns a Promise
 * that resolves to the number of objectives.
 * 
 * @param  {Object} alarm 
 * @return {Promise}       Result value of the evaluation
 */
async function _evalObjectivesQtyAlarm(alarm) {
	let filters = { deleted: false };
	// build optional filters
	if (alarm.state_filter) {
		if (alarm.state_filter === 'completed') filters.progress = 1;
		else if (alarm.state_filter === 'active') filters.progress = { $lt: 1 };
	}
	if (alarm.user_filter) {
		filters.owners = alarm.user_filter._id;
	}
	if (alarm.project_filter) {
		// get id of tasks for the filtered project and filters objectives
		// for those tasks
		const tasks = await TaskModel.find({ project: alarm.project_filter._id, deleted: false }).lean();
		const ids = tasks.map(t => t._id);
		filters.related_task = { $in: ids };
	}

	return ObjectiveModel.count(filters);
}

/**
 * Evaluates the "number of tasks" alarm and returns a Promise
 * that resolves to the number of tasks.
 * 
 * @param  {Object} alarm 
 * @return {Promise}       Result value of the evaluation
 */
async function _evalTasksQtyAlarm(alarm) {
	let filters = { deleted: false };
	// build optional filters
	if (alarm.project_filter) {
		filters.project = alarm.project_filter._id;
	}

	const getTasksRelatedToObjectives = async function(objFilters) {
		const objectivesWithTask = await ObjectiveModel.find(objFilters).lean();
		return objectivesWithTask.map(o => o.related_task);
	}

	if (alarm.state_filter) {
		if (alarm.state_filter === 'unassigned') {
			const objectivesFilters = { deleted: false, related_task: {$ne: null} };
			const ids = await getTasksRelatedToObjectives(objectivesFilters);
			filters._id = { $nin: ids };
		}
		else if (alarm.state_filter === 'active') {
			const objectivesFilters = { deleted: false, related_task: {$ne: null}, progress: { $lt: 1 } };
			const ids = await getTasksRelatedToObjectives(objectivesFilters);
			filters._id = { $in: ids };
		}
		else if (alarm.state_filter === 'completed') {
			const objectivesFilters = { deleted: false, related_task: {$ne: null}, progress: 1 };
			const ids = await getTasksRelatedToObjectives(objectivesFilters);
			filters._id = { $in: ids };
		}
	}
	
	return TaskModel.count(filters);
}

/**
 * Returns the date object represented by the relative date filter of
 * the alarm.
 * 
 * @param  {String} relative 
 * @return {Moment}          
 */
function dateFromRelativeDate(relative) {
	switch (relative) {
		case 'this_week': return moment().startOf('week');
		case 'this_month': return moment().startOf('month');
		case 'last_2_months': return moment().startOf('month').add(-1, 'months');
		case 'this_year': return moment().startOf('year');
		default: return moment().startOf('year').add(-99, 'year');
	}
}

/**
 * Returns a readable description of the alarm configuration that
 * describes when the alarm is set off.
 * 
 * @param  {Object} alarm 
 * @return {String}       
 */
function getAlarmDescription(alarm) {
	const measure = alarm.measure.replace(/_/g, ' ');

	let filters = '';
	if (alarm.state_filter) {
		filters += ` in state "${alarm.state_filter}"`;
	}
	if (alarm.user_filter) {
		const label = 'objectives_quantity tasks_quantity'.indexOf(alarm.measure) >= 0 ? 'owned by' : 'by';
		filters += ` ${label} ${alarm.user_filter.full_name}`;
	}
	if (alarm.project_filter) {
		filters += ` on project ${alarm.project_filter.name}`;
	}
	if (alarm.date_filter) {
		filters += ` since ${dateFromRelativeDate(alarm.date_filter).format('ll')}`;
	}
	
	return `Fires when the ${measure}${filters} is ${alarm.condition_op} ${alarm.condition_value}`;
}

/**
 * Sends the notifications for the given alarm.
 * 
 * @param  {Object} alarm        
 * @param  {Number} currentValue 
 */
function soundAlarm(alarm, currentValue) {
	const message = `:rotating_light: *ALARM*  \`${alarm.name}\` has gone off.`;
	sendSlackMessage({ 
		text: message,
		attachments: JSON.stringify([
			{
				title: "Alarm definition",
				text: `_${getAlarmDescription(alarm)}_`,
				color: '#BE3502',
			},
			{
				text: `Current value is *_${currentValue}_*`,
				color: '#E9F655',
			}
		])
	})
	console.log('[[[ ALARM ]]] Alarm %s has sounded with value %d! (%s %d)', 
		alarm.name, currentValue, alarm.condition_op, alarm.condition_value);
}

/**
 * Send the activity description with the given id to
 * slack default channel (#om).
 * 
 * Returns a promise with the result of sending the
 * message to slack
 *
 * @param {String} message
 * @return {Promise}            
 */
async function sendSlackMessage(message) {
	const channel = process.env.NODE_ENV === 'production' ? '#om' : '#om-test';
	
	// fetch integration to get slack token
	const integration = await IntegrationModel.findOne({ service: 'slack' });
	if (!integration) return;

	const token = integration.meta.token;
	return await sendMessage(channel, message, token);
}
