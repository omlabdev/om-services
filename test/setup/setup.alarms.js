const async = require('async');
const moment = require('moment');
const ObjectiveModel = require('../../models/objective');
const TaskModel = require('../../models/task');
const WorkEntryModel = require('../../models/work_entry');
const ProjectModel = require('../../models/project');
const InvoiceModel = require('../../models/invoice');
const ObjectId = require('mongoose').Types.ObjectId;

const allIds = {
	projects: [new ObjectId(), new ObjectId()],
	tasks: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
	objectives: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
}

exports.setup = function() {
	return setupProjects.bind(this)()
		.then((projects) => {
			this.projects = projects; // this = sharedData
			return setupTasks.bind(this)()
		})
		.then((tasks) => {
			this.tasks = tasks;
			return setupObjectives.bind(this)()
		})
		.then((objectives) => {
			this.objectives = objectives;
			return setupWorkEntries.bind(this)()
		})
		.then((entries) => {
			this.workEntries = entries;
			return setupInvoices.bind(this)()
		})
		.then((invoices) => {
			this.invoices = invoices;
			return invoices
		})
}

exports.tearDown = function() {
	return WorkEntryModel.remove({})
		.then(() => InvoiceModel.remove({}))
		.then(() => ObjectiveModel.remove({}))
		.then(() => TaskModel.remove())
		.then(() => ProjectModel.remove())
}

function setupProjects() {
	const user = this.users[0]._id;
	const ids = allIds.projects;
	return createProjects([
		{
			_id: ids[0],
			name: 'Sample project 1',
			hours_sold: 100,
			hours_sold_unit: 'total',
			hourly_rate: 55,
			active: true,
			invoices: [],
		},
		{
			_id: ids[1],
			name: 'Sample project 2',
			hours_sold: 20,
			hours_sold_unit: 'monthly',
			hourly_rate: 55,
			active: true,
			invoices: []	
		}
	])
}

function setupTasks() {
	const ids = allIds.tasks;
	const user = this.users[0]._id;
	return createTasks([
		{
			_id: ids[0],
			title: 'Sample task 1',
			created_by: user,
			project: allIds.projects[0],
			origin: 'web'
		},
		{
			_id: ids[1],
			title: 'Sample task 2',
			created_by: user,
			project: allIds.projects[1],
			origin: 'web'
		},
		{
			_id: ids[2],
			title: 'Sample task 3',
			created_by: user,
			project: allIds.projects[1],
			origin: 'web'
		},
		{
			_id: ids[3],
			title: 'Sample task 4',
			created_by: user,
			project: allIds.projects[1],
			origin: 'web'
		},
		{
			_id: ids[4],
			title: 'Sample task 5',
			created_by: user,
			project: allIds.projects[0],
			origin: 'web'
		},
		{ 
			_id: ids[5],
			title: 'Sample task 6',
			created_by: user,
			project: allIds.projects[0],
			origin: 'web',
			deleted: 1, // deleted
		}
	])
}

function setupObjectives() {
	const ids = allIds.objectives;
	return createObjectives([
		{	
			// project 0
			_id: ids[0],
			related_task: allIds.tasks[0],
			created_by: this.users[0]._id,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [this.users[0]._id, this.users[1]._id],
			progress: 0,
		},
		{
			// project 1
			_id: ids[1],
			related_task: allIds.tasks[1],
			created_by: this.users[1]._id,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [this.users[0]._id, this.users[1]._id],
			progress: 1,
		},
		{
			// project 1
			_id: ids[2],
			related_task: allIds.tasks[2],
			created_by: this.users[1]._id,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [this.users[0]._id, this.users[1]._id],
			progress: 0.5,
		},
		{
			// project 1
			_id: ids[3],
			related_task: allIds.tasks[3],
			created_by: this.users[1]._id,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [this.users[0]._id, this.users[1]._id],
			progress: 1,
		}
	])
}

function setupWorkEntries() {
	return createWorkEntries([
		{	
			//project 0, user 0, today
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().toDate(),
		},
		{	
			//project 0, user 1, today
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().toDate(),
		},
		{	
			//project 0, user 0, last week
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().startOf('week').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 1, last week
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().startOf('week').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 0, last month
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().startOf('month').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 1, last month
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().startOf('month').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 0, last year
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().startOf('year').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 1, last year
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().startOf('year').add(-1, 'days').toDate(),
		},
		{	
			//project 0, user 0, years ago
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().add(-2, 'years').toDate(),
		},
		{	
			//project 0, user 1, years ago
			objective: allIds.objectives[0],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().add(-2, 'years').toDate(),
		},
		{	
			//project 1, user 0, today
			objective: allIds.objectives[1],
			time: 3600,
			user: this.users[0]._id,
			created_ts: moment().toDate(),
		},
		{	
			//project 1, user 1, today
			objective: allIds.objectives[1],
			time: 3600,
			user: this.users[1]._id,
			created_ts: moment().toDate(),
		},
	])
}

function setupInvoices() {
	return createInvoices([
		{
			project: allIds.projects[0],
			description: 'Invoice this month p0',
			amount: 10,
			billed_hours: 1,
			invoicing_date: moment().toDate(),
			direction: 'out',
			created_by: this.users[0]._id,
		},
		{
			project: allIds.projects[0],
			description: 'Invoice last month p0',
			amount: 10,
			billed_hours: 1,
			invoicing_date: moment().add(-1, 'months').toDate(),
			direction: 'out',
			created_by: this.users[0]._id,
		},
		{
			project: allIds.projects[1],
			description: 'Invoice this month p1',
			amount: 10,
			billed_hours: 1,
			invoicing_date: moment().toDate(),
			direction: 'out',
			created_by: this.users[0]._id,
		},
	])
}

function createProjects(items) {
	return createDocs(ProjectModel, items);
}

function createObjectives(items) {
	return createDocs(ObjectiveModel, items);
}

function createTasks(items) {
	return createDocs(TaskModel, items);
}
function createWorkEntries(items) {
	return createDocs(WorkEntryModel, items);
}

function createInvoices(items) {
	return createDocs(InvoiceModel, items);
}

function createDocs(model, items) {
	return new Promise((resolve, reject) => {
		let createdDocs = [];
	  	async.eachSeries(items, (o, d) => {
	  		model.create(o, (error, doc) => {
	  			if (error) return d(error);
	  			createdDocs.push(doc);
	  			d();
	  		})
	  	},(error) => {
	  		if (error) return reject(error);
	  		return resolve(createdDocs);
	  	})
  	})
}