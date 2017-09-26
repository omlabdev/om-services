const should = require('should');
const TasksApi = require('../api/tasks');
const TasksModel = require('../models/task');
const ObjectivesModel = require('../models/objective');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const async = require('async');
const { setupTasks, setupObjectives } = require('./setup/setup.tasks');


describe('tasks', function() {

	const sharedData = { };
	let owner;

	before(function(done) {
		// open testing db connection
		mongoose.connect('mongodb://localhost:27017/om_test', () => {
			// setup test users
			setupUsers((error, docs) => {
				sharedData.users = docs;
				owner = docs[0]._id.toString();
				done(error);
			});
		});
  });

  after(function(done) {
  	// remove test users
  	dropUsers(() => {
  		// close testing db connection
	  	mongoose.disconnect(done);
  	});
  });

  beforeEach(function(done) {
  	setupTasks.bind(sharedData)() // setup tasks
  		.then((docs) => {
  			sharedData.tasks = docs; // save in sharedData
  			setupObjectives.bind(sharedData)() // setup objectives referencing tasks
  				.then(() => done()) // done
  				.catch(done);
  		})
  		.catch(done)
  })

  afterEach(function(done) {
  	ObjectivesModel.remove({}, (err) => { // remove objectives
  		if (err) return done(err);
  		TasksModel.remove({}, done); // remove tasks
  	})
  })

	/**
	 * Objective owners test
	 *
	 * The returned objectives should be the ones where the
	 * current user is one of the owners
	 */
	describe("#getTasksReferencedByObjectives", function() {

		it('should return tasks that are related to an active objective (not deleted)', function(done) {
			TasksApi.getTasksReferencedByObjectives()
				.then(ids => {
					const stringIds = ids.map(id => id.toString());
					// assertions
					stringIds.should.have.lengthOf(2); // tasks that are linked to an active objective
					stringIds.should.containEql(sharedData.tasks[0]._id.toString());
					stringIds.should.containEql(sharedData.tasks[2]._id.toString());
					done();
				})
				.catch(done);
		})

	})

	describe("#_getTasksPage", function() {

		it('should return tasks that are not related to any objective', function(done) {
			TasksApi._getTasksPage()
				.then(tasksPage => {
					const { tasks } = tasksPage;
					const stringIds = tasks.map(t => t.id);
					// assertions
					tasks.should.have.lengthOf(2);
					stringIds.should.containEql(sharedData.tasks[1]._id.toString());
					stringIds.should.containEql(sharedData.tasks[3]._id.toString());
					done();
				})
				.catch(done);
		})

	})

})
