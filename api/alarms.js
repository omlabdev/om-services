const AlarmModel = require('./../models/alarm');
const moment = require('moment');
const AlarmRunner = require('./alarms/AlarmRunner');

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
