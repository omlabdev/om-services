const async = require('async');
const TasksModel = require('../../models/task');
const ObjectivesModel = require('../../models/objective');
const ProjectsModel = require('../../models/project');

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
	return new Promise((resolve, reject) => {
		const taskDocs = [];
  	async.each(tasks, (o, done) => TasksModel.create(o, (e, d) => {
  		if (e) return done(e);
  		taskDocs.push(d);
  		done();
  	}), (error) => {
  		if (error) return reject(error);
  		return resolve(taskDocs);
  	})
  })
}

function createObjectives(objectives) {
	return new Promise((resolve, reject) => {
  	async.each(objectives, (o, d) => ObjectivesModel.create(o, d), (error) => {
  		if (error) return reject(error);
  		return resolve();
  	})
  })
}