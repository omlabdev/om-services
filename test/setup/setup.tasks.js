const async = require('async');
const TasksModel = require('../../models/task');
const ObjectivesModel = require('../../models/objective');
const ProjectsModel = require('../../models/project');
const utils = require('./setup.utils');

exports.setupTasks = function() {
	const user = this.users[0]._id;

	return ProjectsModel.create({ name: 'sample', hours_sold: 0, hourly_rate: 0 })
		.then((project) => {
			return createTasks([
		  	{
		  		title : 'task sample 1',
		  		project : project._id,
					created_by : user,
					origin : 'web'
				},
				{
		  		title : 'task sample 2',
		  		project : project._id,
					created_by : user,
					origin : 'web'
				},
				{ 
					title : 'task sample 3',
		  		project : project._id,
					created_by : user,
					origin : 'web'
				},
				{
					title : 'task sample 4',
		  		project : project._id,
					created_by : user,
					origin : 'web'
				}
		  ])
		})
}

exports.setupObjectives = function() {
	const user = this.users[0]._id;
	const tasks = this.tasks;
  return createObjectives([
  	{
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			related_task : tasks[0]._id,
			created_by : user
		},
		{
			level : 'day',
			no_task_title : 'testing objective 1',
			owners : [user],
			related_task : tasks[1]._id,
			created_by : user,
			deleted : true
		},
		{
			level : 'month',
			no_task_title : 'testing objective 1',
			owners : [user],
			related_task : tasks[2]._id,
			created_by : user,
			progress : 1,
			completed_by : user,
			completed_ts : Date.now()
		}
  ])
}

function createTasks(tasks) {
	return utils.createDocs(TasksModel, tasks);
}

function createObjectives(objectives) {
	return utils.createDocs(ObjectivesModel, objectives);
}