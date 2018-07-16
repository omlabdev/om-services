const ProjectModel = require('./../models/project');
const InvoiceModel = require('./../models/invoice');
const WorkEntryModel = require('./../models/work_entry');
const TaskModel = require('./../models/task');
const ObjectiveModel = require('./../models/objective');
const UserModel = require('./../models/user');
const { runAlarms } = require('./alarms');
const moment = require('moment');
const multer = require('multer');
const { sendMessageToUser } = require('../utils/slack');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/attachments')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
let upload = multer({ storage });

/*
	GET 	/api/{v}/billing/invoices

	GET 	/api/{v}/billing/projects

	GET 	/api/{v}/billing/projects/:id

	POST 	/api/{v}/billing/invoices/add-invoice

	POST 	/api/{v}/billing/invoices/:invoiceId

	DELETE 	/api/{v}/billing/invoices/:invoiceId

	GET 	/api/{v}/billing/invoices/:invoiceId/html
 */
exports.setup = (router) => {
	router.get('/billing/invoices/query', exports.getInvoicesWithQuery);
	router.get('/billing/invoices', exports.getInvoices);
	router.get('/billing/projects', exports.getProjectsBilling);
	router.get('/billing/projects/:projectId', exports.getBillingForProject);
	router.post('/billing/invoices/add-invoice', upload.any(), addInvoice);
	router.post('/billing/invoices/:invoiceId', upload.any(), exports.updateInvoice);
	router.delete('/billing/invoices/:invoiceId', exports.deleteInvoice);
	router.get('/billing/invoices/:invoiceId/html', exports.renderInvoice);
}

function addInvoice(req, res) {
	const invoice = req.body;
	exports._addInvoice(invoice, req.files)
		.then(doc => { res.json(doc); return doc; })
		.then(doc => { sendNotificationIfNeeded(doc); return doc; })
		.then(doc => runAlarms(doc, InvoiceModel))
		.catch(e => { res.json({ error: e.message }) });
}

exports._addInvoice = async function(invoice, files = []) {
	// check double invoicing if the invoice is to us
	if (invoice.direction === 'in') {
		const doubleInvoicing = await exports.checkDoubleInvoicing(invoice);
		if (doubleInvoicing.length > 0) {
			throw new Error('At least one work entry has already been invoiced.');
		}
	}

	invoice.attachment = files.length > 0 ? files[0].filename : null;
	return InvoiceModel.create(invoice);		
}

exports.updateInvoice = function(req, res) {
	const { invoiceId } = req.params;
	const invoice = req.body;
	invoice.attachment = req.files.length > 0 ? req.files[0].filename : null;

	// not using project id cause it may have changed
	InvoiceModel.findByIdAndUpdate(invoiceId, {$set: invoice}, {new: true})
		.then(doc => { res.json(doc); return doc; })
		.then(doc => runAlarms(doc, InvoiceModel))
		.catch(e => { console.error(e); res.json({ error: e.message })})
}

exports.deleteInvoice = function(req, res) {
	const { invoiceId } = req.params;
	InvoiceModel.remove({ _id: invoiceId })
		.then(result => { res.json(result) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Queries invoices with the given filter by querystring
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getInvoicesWithQuery = function(req, res) {
	const query = req.query;
	exports.getInvoicesWithFilter(query)
		.then(invoices => { res.json({ invoices }) })
		.catch(e => { res.json({ error: e.message }) })
}

/**
 * Queries invoices with the given filter object
 * 
 * @param  {Object} filter 
 * @return {Promise}
 */
exports.getInvoicesWithFilter = function(filter) {
	return InvoiceModel.find(filter)
		.sort({ invoicing_date: -1 })
		.populate('project', 'name _id')
		.populate('created_by', 'name _id')
		.lean()
}

/**
 * Renders the HTML for a Corp invoice that can be printed
 * or exported as PDF
 * 
 * @param  {Object} req
 * @param  {Object} res
 */
exports.renderInvoice = function(req, res) {
	const { invoiceId } = req.params;
	InvoiceModel.findById({ _id: invoiceId })
		.populate('project', 'name company_name')
		.populate('created_by', 'name _id')
		.then(invoice => {
			res.render('invoice', { invoice })
		})
		.catch(error => { res.render('error', { error }) })
}

/**
 * Returns all existing invoices
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getInvoices = function(req, res) {
	InvoiceModel.find({})
		.populate('project', 'name')
		.populate('created_by', 'name _id')
		.sort({ invoicing_date: -1 })
		.then(invoices => invoices.map(i => i.toObject())) // .toObject to have virtuals
		.then(invoices => { res.json(invoices) })
		.catch(e => { 
			console.error(e);
			res.json({ error: e.message })
		})
}

/**
 * Returns the project information with billing variables 
 * calculated for a all projects
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getProjectsBilling = function(req, res) {
	exports.getProjectsBillingWithVariables()
		.then(projects => { res.json(projects) })
		.catch(e => {
			console.error(e);
			res.json({ error: e.message })
		})
}

/**
 * Returns the project information with billing variables
 * calculated for a single project
 * 
 * @param  {Object} req 
 * @param  {Object} res 
 */
exports.getBillingForProject = function(req, res) {
	exports.getProjectsBillingWithVariables(req.params.projectId)
		.then(project => { res.json(project) })
		.catch((e) => {
			console.error(e);
			res.json({ error: e.message })
		})
}

/**
 * Calculates and returns the billing variables for every
 * project.
 *
 * If filter is present, calculates and returns only that
 * single project
 * 
 * @param  {String} projectId Optional filter
 * @return {Promise}           
 */
exports.getProjectsBillingWithVariables = function(projectId) {
	const query = projectId ? { project: projectId } : { project: {$ne: null} };
	return InvoiceModel.find(query)
		.populate('project', 'name _id')
		.populate('created_by', 'name _id')
		.then(invoices => invoices.map(i => i.toObject())) // .toObject() to have virtuals
		.then(invoices => exports.groupInvoicesByProject(invoices, projectId))
		.then(projects => exports.calculateBillingVariables(projects))
		.then(projects => projectId ? projects[0] : projects)
}

/**
 * Returns an array of invoices that matches the given 
 * query filter.
 * 
 * @param  {Object} filter 
 * @return {Promise}        
 */
exports.queryInvoices= function(filter = {}) {
	return InvoiceModel.find(filter).populate('project', 'name _id').lean()
}

/**
 * If the invoice contains work entries, checks that none of 
 * the work entries are already registered on another invoice.
 * 
 * @param  {Object} invoice 
 * @return {Promise}         Resolves with an array of duplicated entries
 */
exports.checkDoubleInvoicing = function(invoice) {
	const entries = invoice.work_entries;
	const query = {
		work_entries: { $elemMatch: { $in: invoice.work_entries } }
	}
	return InvoiceModel.find(query)
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
					paid_hours_total  		: exports.calculateTotalPaidHours(p),
					paid_amount_total 		: exports.calculateTotalPaidAmount(p),
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
 * Calculates the amount of hours executed for all given projects
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

exports.calculateExecutedSince = function(projectId, sinceDate) {
	return exports.getWorkEntriesForProject(projectId, getFilterSinceDate(sinceDate))
		.then(workEntries => reduceWorkEntries(workEntries))
}

exports.calculateExecutedWithFilters = function(projectId, filters) {
	return exports.getWorkEntriesForProject(projectId, filters)
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

exports.calculateTotalPaidHours = function(project) {
	return exports.reduceInvoicesFieldWithCondition('billed_hours', 
		i => i.direction === 'out' && i.paid, project.invoices);
}

exports.calculateTotalPaidAmount = function(project) {
	return exports.reduceInvoicesFieldWithCondition('amount', 
		i => i.direction === 'out' && i.paid, project.invoices);
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

const getFilterSinceDate = (date) => {
	return { created_ts: {$gte: moment.utc(date).toDate()} }
}

/**
 * Sends a slack notification for the given invoice if necessary.
 * It only sends a notification if the creator is a freelancer.
 * The notification is sent to all users that are marked as 
 * invoice notification receivers.
 * 
 * @param  {Object} _invoice 
 */
async function sendNotificationIfNeeded(_invoice) {
	const invoiceLink = `http://localhost:3100/#/invoice/${_invoice._id}`;
	try {
		const invoice = await InvoiceModel.findById(_invoice._id).populate('created_by');
		// if is not a freelancer, don't notify
		if (!invoice.created_by.is_freelancer) return;
		// notify whoever is the receiver of new invoice notifications
		const users = await UserModel.find({ notify_invoices: true, slack_account: {$exists: true, $ne: ''} });
		users.forEach(u => {
			const message = { 
				text: `Hey @${u.slack_account}, a new invoice has been added by ${invoice.created_by.first_name}.`,
				attachments: JSON.stringify([
					{
						title : 'View invoice',
						text : `Click <${invoiceLink}|here> to open the invoice.`,
					},
				])
			};
			sendMessageToUser(u.slack_account,  message)
				.catch(e => console.error(e))
		});
	}
	catch (e) {
		console.error("Invoice notification error:");
		console.error(e);
	}
}