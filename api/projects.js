var ProjectModel = require('./../models/project');

/*
	POST	/api/{v}/projects/add

	POST	/api/{v}/projects/:id

	GET		/api/{v}/projects
 */
exports.setup = (router) => {
	router.post('/projects/add', exports.createProject);
	router.post('/projects/:projectId', exports.updateProject);
	router.get('/projects', exports.getProjects);
}

exports.createProject = function(req, res) {
	const projectData = req.body;
	const model = new ProjectModel(projectData);
	ProjectModel.create(model)
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.updateProject = function(req, res) {
	const _id = req.params.projectId;
	ProjectModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		})
}

exports.getProjects = function(req, res) {
	ProjectModel.find()
		.then((projects) => {
			res.json({ projects })
		})
		.catch((error) => {
			res.json({ error })
		})
}
