const async = require('async');
const moment = require('moment');
const ObjectiveModel = require('../../models/objective');
const TaskModel = require('../../models/task');
const WorkEntryModel = require('../../models/work_entry');
const ProjectModel = require('../../models/project');
const ObjectId = require('mongoose').Types.ObjectId;

const allIds = {
	projects: [new ObjectId(), new ObjectId()],
	tasks: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()],
	objectives: [new ObjectId(), new ObjectId(), new ObjectId(), new ObjectId()]
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
			return entries;
		})
}

exports.tearDown = function() {
	return WorkEntryModel.remove({})
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
			invoices: [{
				invoicing_date: moment().toDate(),
				amount: 55*80,
				billed_hours: 80,
				paid: true,
				description: 'Sample invoice 1.1',
				project: ids[0],
				created_by: user
			},{
				invoicing_date: moment().add(-1,'months').toDate(),
				amount: 55*5,
				billed_hours: 5,
				paid: false,
				description: 'Sample invoice 1.2',
				project: ids[0],
				created_by: user
			}]	
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
			project: allIds.projects[0],
			origin: 'web'
		},
		{
			_id: ids[2],
			title: 'Sample task 3',
			created_by: user,
			project: allIds.projects[0],
			origin: 'web'
		},
		{
			_id: ids[3],
			title: 'Sample task 4',
			created_by: user,
			project: allIds.projects[1],
			origin: 'web'
		}
	])
}

function setupObjectives() {
	const ids = allIds.objectives;
	const user = this.users[0]._id;
	return createObjectives([
		{
			_id: ids[0],
			related_task: allIds.tasks[0],
			created_by: user,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [user]
		},
		{
			_id: ids[1],
			related_task: allIds.tasks[1],
			created_by: user,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [user]
		},
		{
			_id: ids[2],
			related_task: allIds.tasks[2],
			created_by: user,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [user]
		},
		{
			_id: ids[3],
			related_task: allIds.tasks[3],
			created_by: user,
			objective_date: moment().toDate(),
			level: 'day',
			owners: [user]
		}
	])
}

function setupWorkEntries() {
	const user = this.users[0]._id;
	return createWorkEntries([
		{
			objective: allIds.objectives[0],
			time: 3600*10,
			user: user
		},
		{
			objective: allIds.objectives[0],
			time: 3600*2,
			user: user
		},
		{
			objective: allIds.objectives[0],
			time: 3600*3,
			user: user
		},
		{
			objective: allIds.objectives[1],
			time: 3600*12,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			objective: allIds.objectives[2],
			time: 3600,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			objective: allIds.objectives[2],
			time: 3600,
			user: user,
			created_ts: moment().add(-2, 'months').toDate()
		},
		{
			objective: allIds.objectives[3],
			time: 3600,
			user: user,
			created_ts: moment().toDate()
		},
		{
			objective: allIds.objectives[3],
			time: 3600,
			user: user,
			created_ts: moment().add(-1, 'months').toDate()
		},
		{
			objective: allIds.objectives[3],
			time: 3600,
			user: user,
			created_ts: moment().add(-1, 'months').add(2, 'days').toDate()
		}
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