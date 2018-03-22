const ProjectModel = require('./../models/project');
const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ObjectiveModel = require('./../models/objective');
const moment = require('moment');
const WorkEntriesApi = require('./work_entries');

/*
	POST	/api/{v}/projects/add

	POST	/api/{v}/projects/:id

	GET		/api/{v}/projects

	GET 	/api/{v}/public/projects
 */
exports.setup = (router) => {
	// public APIs, return only public information
	router.get('/public/projects', exports.getProjectsPublic);

	router.get('/projects', exports.getProjects);
	router.post('/projects/add', exports.createProject);
	router.post('/projects/:projectId', exports.updateProject);
}

exports.createProject = function(req, res) {
	const projectData = req.body;
	const model = new ProjectModel(projectData);
	ProjectModel.create(model)
		.then(res.json.bind(res))
		.catch((e) => {
			res.json({ error: e.message })
		});
}

exports.updateProject = function(req, res) {
	const _id = req.params.projectId;
	ProjectModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch(e => {
			res.json({ error: e.message })
		})
}

exports.getProjects = function(req, res) {
	ProjectModel.find({}, {invoices: 0}).sort({name: 1})
		.then(projects => {
			res.json({ projects })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.getProjectsPublic = function(req, res) {
	const fields = {
		_id: 0, 
		name: 1, 
		description: 1, 
		active: 1,
		featured: 1,
		featured_image: 1,
		description: 1,
		description_es: 1,
		external_link: 1,
		type: 1,
	};
	ProjectModel.find({}, fields).sort({name: 1})
		.then(projects => { 
			res.json(projects) 
		})
		.catch(e => { 
			res.json({ error: e.message }) 
		})
}
