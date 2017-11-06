const ProjectModel = require('./../models/project');
const InvoiceModel = require('./../models/invoice');
const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ObjectiveModel = require('./../models/objective');
const moment = require('moment');

/*
	GET 	/api/{v}/projects/billing

	GET 	/api/{v}/projects/:id/billing

	POST 	/api/{v}/projects/:id/invoices/add-invoice

	POST 	/api/{v}/projects/:id/invoices/:invoiceId

	DELETE 	/api/{v}/projects/:id/invoices/:invoiceId

	GET 	/api/{v}/projects/:id/invoices/:invoiceId/html
 */
exports.setup = (router) => {
	router.get('/projects/billing', exports.getProjectsBilling);
	router.get('/projects/:projectId/billing', exports.getBillingForProject);
	router.post('/projects/:projectId/invoices/add-invoice', exports.addInvoice);
	router.post('/projects/:projectId/invoices/:invoiceId', exports.updateInvoice);
	router.delete('/projects/:projectId/invoices/:invoiceId', exports.deleteInvoice);
	router.get('/projects/:projectId/invoices/:invoiceId/html', exports.renderInvoice);
}

exports.addInvoice = function(req, res) {
	const projectId = req.params.projectId;
	const invoice = Object.assign({}, req.body, { project: projectId });
	InvoiceModel.create(invoice)
		.then(result => { res.json(result) })
		.catch(e => { res.json({ error: e.message }) });
}

exports.updateInvoice = function(req, res) {
	const { projectId, invoiceId } = req.params;
	const invoice = req.body;
	InvoiceModel.update({ project: projectId, _id: invoiceId }, {$set: invoice})
		.then(result => { res.json(result) })
		.catch(e => { res.json({ error: e.message })})
}

exports.deleteInvoice = function(req, res) {
	const { invoiceId, projectId } = req.params;
	InvoiceModel.remove({ _id: invoiceId, project: projectId })
		.then(result => { res.json(result) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Renders the HTML for a Corp invoice that can be printed
 * or exported as PDF
 * 
 * @param  {Object} req
 * @param  {Object} res
 */
exports.renderInvoice = function(req, res) {
	const { projectId, invoiceId } = req.params;
	InvoiceModel.findById({ _id: invoiceId, project: projectId })
		.populate('project', 'name company_name')
		.then(invoice => {
			res.render('invoice', { invoice })
		})
		.catch(error => { res.render('error', { error }) })
}

/**
 * Returns all invoices and billing variables for all projects
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getProjectsBilling = function(req, res) {
	exports.getBilling()
		.then(projects => { res.json(projects) })
		.catch((e) => {
			console.error(e);
			res.json({ error: e.message })
		})
}

/**
 * Returns all invoices and billing variables for a given
 * project
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getBillingForProject = function(req, res) {
	exports.getBilling(req.params.projectId)
		.then(project => { res.json(project) })
		.catch((e) => {
			console.error(e);
			res.json({ error: e.message })
		})
}

/**
 * Returns the billing information for the given project, or 
 * all of them if id not present
 * 
 * @param  {String} projectId Optional filter
 * @return {Promise}           
 */
exports.getBilling = function(projectId) {
	const query = projectId ? { project: projectId } : {};
	return InvoiceModel.find(query)
		.populate('project', 'name _id')
		.lean()
		.then(invoices => exports.groupInvoicesByProject(invoices, projectId))
		.then(projects => exports.calculateBillingVariables(projects))
		.then(projects => projectId ? projects[0] : projects)
}

/**
 * Groups all invoices in the corresponding projects, returning
 * an array of projects with invoices inside under *invoices*
 * to the resolved promise.
 *
 * If projectId is indicated, returns only that project on the
 * resulting array
 * 
 * @param  {Array} invoices 
 * @param  {String} projectId Optional project filter to fetch just 1
 * @return {Promise}          
 */
exports.groupInvoicesByProject = function(invoices, projectId) {
	const query = projectId ? { _id: projectId } : {};
	return ProjectModel.find(query)
		.sort({ name: 1 })
		.lean()
		.then(projects => {
			// index projects by id and add empty invoices array inside
			const projectsById = {};
			projects.forEach(p => { 
				p.invoices = [];
				projectsById[p._id.toString()] = p;
			});
			// add invoices to each project
			invoices.forEach(i => {
				const pid = i.project._id.toString();
				projectsById[pid].invoices.push(i);
			})
			return projects;
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
 * 	- expenses amount this month
 * 	- expenses amount total
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
					billed_hours_month  	: exports.calculateThisMonthBillingHours(p),
					billed_amount_month 	: exports.calculateThisMonthBillingAmount(p),
					billed_hours_total  	: exports.calculateTotalBillingHours(p),
					billed_amount_total 	: exports.calculateTotalBillingAmount(p),
					expenses_amount_month 	: exports.calculateThisMonthExpenses(p),
					expenses_amount_total 	: exports.calculateTotalExpenses(p)
				})
			})
			return resolve(result);
		})
		.catch(error => reject(error));
	})
}

/**
 * Calculates the amount of hours executed for all given project
 * this month and total.
 * 
 * @param  {Array} projects 
 * @return {Promise}          An object with executed_hours_month 
 *                               and executed_hours_total
 */
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
	return exports.getWorkEntriesForProject(projectId)
		.then(workEntries => reduceWorkEntries(workEntries))
}

exports.calculateThisMonthExecuted = function(projectId) {
	return exports.getWorkEntriesForProject(projectId, getFilterForMonth(new Date()))
		.then(workEntries => reduceWorkEntries(workEntries))
}

const reduceWorkEntries = function(workEntries) {
	return workEntries.map(we => we.time).reduce((total, t) => t+total, 0);
}

exports.getWorkEntriesForProject = function(projectId, filters = {}, populate = false) {
	return getTasksForProject(projectId)
		.then(tasks => tasks.map(d => d._id))
		.then(taskIds => getObjectivesForTasks(taskIds))
		.then(objectives => objectives.map(d => d._id))
		.then(objectiveIds => getWorkEntriesForObjectives(objectiveIds, filters, populate))
}

function getWorkEntriesForObjectives(objectiveIds, filters, populate = false) {
	const query = Object.assign({}, filters, {objective: {$in: objectiveIds}});
	let find = WorkEntryModel.find(query).sort({ created_ts : -1 })
	if (populate) {
		find = find
			.populate('user objective')
			.then(doc => TaskModel.populate(doc, {path: 'objective.related_task'}));
	}
	return find;
}

function getObjectivesForTasks(taskIds) {
	return ObjectiveModel.find({related_task: {$in: taskIds}}).lean();
}

function getTasksForProject(projectId) {
	return TaskModel.find({project: projectId}).lean();
}

exports.calculateThisMonthBillingHours = function(project) {
	return exports.reduceInvoicesFieldWithCondition('billed_hours', 
		i => isThisMonth(i.invoicing_date) && i.direction === 'out', project.invoices);
}

exports.calculateThisMonthBillingAmount = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => isThisMonth(i.invoicing_date) && i.direction === 'out', project.invoices);
}

exports.calculateTotalBillingHours = function(project) {
	return exports.reduceInvoicesFieldWithCondition('billed_hours', 
		i => i.direction === 'out', project.invoices);
}

exports.calculateTotalBillingAmount = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => i.direction === 'out', project.invoices);
}

exports.calculateThisMonthExpenses = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => isThisMonth(i.invoicing_date) && i.direction === 'in', project.invoices);
}

exports.calculateTotalExpenses = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => i.direction === 'in', project.invoices);
}

exports.reduceInvoicesFieldWithCondition = function(field, condition, invoices) {
	return sum(invoices.filter(condition).map(i => i[field]));
}

const isThisMonth = (date) => moment.utc(date).format('YYYY/MM') === moment.utc().format('YYYY/MM');

const sum = (numbers) => numbers.reduce((total, n) => n+total, 0);

const getFilterForMonth = (date) => {
	const fromDate = moment.utc(date).startOf('month').toDate();
	const toDate = moment.utc(date).endOf('month').toDate();
	return { created_ts: {$gte: fromDate, $lte: toDate} }
}