const ProjectModel = require('./../models/project');
const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ObjectiveModel = require('./../models/objective');
const moment = require('moment');

/*
	POST	/api/{v}/projects/add

	POST	/api/{v}/projects/:id

	GET		/api/{v}/projects

	GET 	/api/{v}/projects/billing
 */
exports.setup = (router) => {
	router.get('/projects', exports.getProjects);
	router.get('/projects/billing', exports.getProjectsBilling);
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
	ProjectModel.find({active: true}, {invoices: 0}).sort({name: 1})
		.then((projects) => {
			res.json({ projects })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.getProjectsBilling = function(req, res) {
	ProjectModel.find({active: true}).sort({name: 1}).lean()
		.then(projects => exports.calculateBillingVariables(projects))
		.then(projects => { res.json(projects) })
		.catch((e) => {
			res.json({ error: e.message })
		})
}

/**
 * Here we calculate the following variables for each project
 * and resolve the promise with the variabled added to each
 * project object:
 * 
 * 	- amount billed this month
 * 	- amount billed total
 * 	- hours registered this month
 * 	- hours registered total
 * 	
 * @param  {Array} projects 
 * @return {Promise}
 */
exports.calculateBillingVariables = function(projects) {
	return new Promise((resolve, reject) => {
		// calculate hours executed for this month and total
		const promises = exports.calculateExecutedHoursForProjects(projects);
		// after calculating executed hours, we calculate 
		// billed hours, merge all that data into the projects
		// and resolve this function's promise
		Promise.all(promises).then(hours => {
			const result = projects.map((p, idx) => {
				return Object.assign({}, p, hours[idx], {
					billed_hours_month  : exports.calculateThisMonthBillingHours(p) / 3600,
					billed_amount_month : exports.calculateThisMonthBillingAmount(p) / 3600,
					billed_hours_total  : exports.calculateTotalBillingHours(p) / 3600,
					billed_amount_total : exports.calculateTotalBillingAmount(p) / 3600
				})
			})
			return resolve(result);
		})
	})
}

exports.calculateExecutedHoursForProjects = function(projects) {
	const promises = projects.map(p => {
		return Promise.all([
			exports.calculateThisMonthExecuted(p._id),
			exports.calculateTotalExecuted(p._id)
		]).then(([month, total]) => {
			return {
				executed_hours_month : month / 3600,
				executed_hours_total : total / 3600
			}
		})
	})
	return promises;
}

exports.calculateTotalExecuted = function(projectId) {
	return getWorkEntriesForProject(projectId)
		.then(workEntries => reduceWorkEntries(workEntries))
}

exports.calculateThisMonthExecuted = function(projectId) {
	return getWorkEntriesForProject(projectId, getFilterForMonth(new Date()))
		.then(workEntries => reduceWorkEntries(workEntries))
}

const reduceWorkEntries = function(workEntries) {
	return workEntries.map(we => we.time).reduce((total, t) => t+total, 0);
}

function getWorkEntriesForProject(projectId, filters = {}) {
	return getTasksForProject(projectId)
		.then(taskIds => getObjectivesForTasks(taskIds))
		.then(objectiveIds => getWorkEntriesForObjectives(objectiveIds, filters))
}

function getWorkEntriesForObjectives(objectiveIds, filters) {
	const query = Object.assign(filters, {objective: {$in: objectiveIds}});
	return WorkEntryModel.find(query)
		.lean();
}

function getObjectivesForTasks(taskIds) {
	return ObjectiveModel.find({related_task: {$in: taskIds}})
		.lean().then(docs => docs.map(d => d._id));
}

function getTasksForProject(projectId) {
	return TaskModel.find({project: projectId})
		.lean().then(docs => docs.map(d => d._id));
}

exports.calculateThisMonthBillingHours = function(project) {
	return exports.reduceInvoicesFieldWithCondition('billed_hours', 
		i => isThisMonth(i.invoicing_date), project.invoices);
}

exports.calculateThisMonthBillingAmount = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => isThisMonth(i.invoicing_date), project.invoices);
}

exports.calculateTotalBillingHours = function(project) {
	return exports.reduceInvoicesFieldWithCondition('billed_hours', 
		i => true, project.invoices);
}

exports.calculateTotalBillingAmount = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => true, project.invoices);
}

exports.reduceInvoicesFieldWithCondition = function(field, condition, invoices) {
	return sum(invoices.filter(condition).map(i => i[field]));
}

const isThisMonth = (date) => moment.utc(date).format('YYYY/MM') === moment.utc().format('YYYY/MM');

const sum = (numbers) => numbers.reduce((total, n) => n+total, 0);

const getFilterForMonth = (date) => {
	const fromDate = moment.utc(date).startOf('month').startOf('day').toDate();
	const toDate = moment.utc(date).endOf('month').endOf('day').toDate();
	return { created_ts: {$gte: fromDate, $lte: toDate} }
}
