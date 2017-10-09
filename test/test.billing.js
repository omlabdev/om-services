const should = require('should');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { setup, tearDown } = require('./setup/setup.billing');
const ProjectsApi = require('./../api/projects');


describe('billing', function() {
	const sharedData = { };

	before(function(done) {
		// open testing db connection
		mongoose.connect('mongodb://localhost:27017/om_test', () => {
			// setup test users
			setupUsers((error, docs) => {
				sharedData.users = docs;
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
  	setup.bind(sharedData)()
  		.then(() => {
  			console.log('------------------------');
  			console.log(sharedData);
  			console.log('------------------------');
  		})
  		.then(() => done())
  		.catch(done);
  })

  afterEach(function(done) {
  	tearDown()
  		.then(() => done())
  		.catch(done);
  })

	/**
	 * Objective owners test
	 *
	 * The returned objectives should be the ones where the
	 * current user is one of the owners
	 */
	describe("#getWorkEntriesForProject", function() {

		it('should return every work entry linked to a project through objectives & tasks', function(done) {
			ProjectsApi.getWorkEntriesForProject(sharedData.projects[0]._id)
				.then(workEntries => {
					// assertions
					done();
				})
				.catch(done)
		})

	})

})
