var WorkEntryModel = require('./../models/work_entry');

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
	const entryData = req.body;
	entryData.objective = req.params.objectiveId;
	const model = new WorkEntryModel(entryData);
	WorkEntryModel.create(model)
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.deleteWorkEntry = function(req, res) {
	const _id = req.params.workEntryId;
	WorkEntryModel.remove({ _id })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.getWorkEntries = function(req, res) {
	const objective = req.params.objectiveId;
	WorkEntryModel.find({ objective })
		.then((entries) => {
			res.json({ entries })
		})
		.catch((error) => {
			res.json({ error })
		})
}
