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
					should.exist(workEntries);
					workEntries.should.have.lengthOf(6);
					done();
				})
				.catch(done)
		})

	})

	describe("#calculateTotalExecuted", function() {

		it('should return the total amount for all work entries', function(done) {
			ProjectsApi.calculateTotalExecuted(sharedData.projects[0]._id)
				.then(total => {
					// assertions
					should.exist(total);
					total.should.equal(3600*10 + 3600*2 + 3600*3 + 3600*12 + 3600 + 3600);
					done();
				})
				.catch(done)
		})

	})

	describe("#calculateThisMonthExecuted", function() {

		it('should return total amount for this month\'s work entries', function(done) {
			ProjectsApi.calculateThisMonthExecuted(sharedData.projects[1]._id)
				.then(total => {
					// assertions
					should.exist(total);
					total.should.equal(3600);
					done();
				})
				.catch(done)
		})

	})

})
