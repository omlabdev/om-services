const IntegrationModel = require('./../models/integration');
const ActivityModel = require('./../models/activity');
const ActivityApi = require('./activity');
const ObjectId = require('mongoose').Types.ObjectId;

/*
	GET		/api/{v}/admin/integrations

	POST 	/api/{v}/admin/integrations/add

	POST 	/api/{v}/admin/integrations/:integrationId

	DELETE 	/api/{v}/admin/integrations/:integrationId
 */
exports.setup = (router) => {
	router.post('/admin/integrations/add', exports.createIntegration);
	router.post('/admin/integrations/:integrationId', exports.updateIntegration);
	router.delete('/admin/integrations/:integrationId', exports.deleteIntegration);
	router.get('/admin/integrations', exports.getIntegrations);
}

exports.getIntegrations = function(req, res) {
	IntegrationModel.find().populate('created_by').sort({ created_ts : -1 })
		.then((integrations) => {
			res.json({ integrations })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.updateIntegration = function(req, res) {
	const _id = req.params.integrationId;
	
	const updateP = IntegrationModel.findByIdAndUpdate(_id, {$set: req.body});
	const activityP = updateP.then(doc => 
		createActivity(doc, req.currentUser._id, 'updated'));
	
	Promise.all([updateP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch((e) => { res.json({ error: e.message }) })
}

exports.deleteIntegration = function(req, res) {
	const _id = req.params.integrationId;
	
	const findP = IntegrationModel.findById(_id);
	const deleteP = findP
		.then(() => deleteRelatedActivity(ObjectId(_id)))
		.then(() => IntegrationModel.remove({ _id }));

	const activityP = findP.then(doc => 
		createDeleteActivity(doc, req.currentUser._id));

	Promise.all([findP, deleteP, activityP])
		.then(([doc, result, _]) => { res.json(result) })
		.catch((e) => { res.json({ error: e.message }) });
}

function deleteRelatedActivity(integrationId) {
	const query = { meta : { $exists: true }, 'meta.integration' : integrationId };
	return ActivityModel.remove(query);
}

exports.createIntegration = function(req, res) {
	const integrationData = setCreateDefaults(req.body, req);
	const model = new IntegrationModel(integrationData);

	const createP = IntegrationModel.create(model)
		.then(doc => IntegrationModel.populate(doc, {path: 'created_by'}))
	const activityP = createP.then(doc => 
		createActivity(doc, doc.created_by._id, 'created'))

	Promise.all([createP, activityP])
		.then(([doc, _]) => { res.json(doc) })
		.catch((e) => { res.json({ error: e.message }) });
}

function setCreateDefaults(integrationData, req) {
	integrationData.created_by = req.currentUser;
	return integrationData;
}

function createActivity(integration, userId, event) {
	const action = `has ${event} an integration`;
	return ActivityApi.createActivity({
		description: `%user.first_name% ${action} with ${integration.service}: %meta.integration.name%`,
		type: `integration-${event}`,
		user: userId.toString(),
		meta: { integration : integration._id } 
	})
}

function createDeleteActivity(integration, userId) {
	return ActivityApi.createActivity({
		description: `%user.first_name% has deleted an integration with ${integration.service}: ${integration.name}`,
		type: `integration-deleted`,
		user: userId.toString()
	})
}
