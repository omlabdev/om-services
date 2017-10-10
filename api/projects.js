const ProjectModel = require('./../models/project');
const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ObjectiveModel = require('./../models/objective');
const moment = require('moment');

// pdf export of invoice
const fs = require('fs');
const pugpdf = require('pug-pdf');

/*
	POST	/api/{v}/projects/add

	POST	/api/{v}/projects/:id

	GET		/api/{v}/projects
 */
exports.setup = (router) => {
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
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.getProjects = function(req, res) {
	ProjectModel.find({}, {invoices: 0}).sort({name: 1})
		.then((projects) => {
			res.json({ projects })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}
