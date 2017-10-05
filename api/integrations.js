var IntegrationModel = require('./../models/integration');

/*
	GET		/api/{v}/admin/integrations

	POST 	/api/{v}/admin/integrations/add

	POST 	/api/{v}/admin/integrations/:integrationId
 */
exports.setup = (router) => {
	router.post('/admin/integrations/add', exports.createIntegration);
	router.post('/admin/integrations/:integrationId', exports.updateIntegration);
	router.get('/admin/integrations', exports.getIntegrations);
}

exports.getIntegrations = function(req, res) {
	IntegrationModel.find().sort({ created_ts : -1 })
		.then((integrations) => {
			res.json({ integrations })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.updateIntegration = function(req, res) {
	const _id = req.params.integrationId;
	IntegrationModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.createIntegration = function(req, res) {
	const integrationData = req.body;
	integrationData.created_by = req.currentUser;
	const model = new IntegrationModel(integrationData);
	IntegrationModel.create(model)
		.then(doc => IntegrationModel.populate(doc, {path: 'created_by'}))
		.then(integration => { res.json(integration) })
		.catch((e) => {
			res.json({ error: e.message })
		});
}