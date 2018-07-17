const should = require('should');
const ObjectivesApi = require('../api/objectives');
const ObjectiveModel = require('../models/objective');
const WorkEntryModel = require('../models/work_entry');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const async = require('async');
const moment = require('moment');
const { setupObjectivesForDifferentOwners } = require('./setup/setup.objectives');
const { setupWorkEntries } = require('./setup/setup.work_entries');
const timezone = moment().format('Z');


describe('objectives', function() {

	const sharedData = { };
	const today = moment.utc().format('YYYY-MM-DD').split('-');
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

  assertTitles = function(titles, docs) {
  	const objectiveTitles = docs.map(o => o.title);
  	titles.forEach(t => objectiveTitles.should.matchAny(t));
  }

  beforeEach(function(done) {
  	setupObjectivesForDifferentOwners.bind(sharedData)()
  		.then(objectives => { sharedData.objectives = objectives })
  		.then(() => done())
  		.catch(done)
  })

  afterEach(function(done) {
  	ObjectiveModel.remove({}, done);
  })

	/**
	 * Objective owners test
	 *
	 * The returned objectives should be the ones where the
	 * current user is one of the owners
	 */
	describe("#_getObjectives", function() {

		it('should return only objectives where current user is owner', function(done) {
			ObjectivesApi._getObjectives(...today, true, owner, timezone)
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(2);
					assertTitles([/.*1/, /.*3/], objectivesByLevel.day);
					done();
				})
				.catch(done)
		})

		it('should return objectives for everyone when owner is undefined', function(done) {
			ObjectivesApi._getObjectives(...today, true, undefined, timezone)
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(5);
					objectivesByLevel.should.have.property('month');
					objectivesByLevel.month.should.have.lengthOf(1);
					done();
				})
				.catch(done) 
		})

	})

	describe('#getSummary', function() {

		it('should return summary for user skipping deleted and scratched', function(done) {
			ObjectivesApi._getObjectives(...today, true, undefined, timezone)
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					return objectivesByLevel;
				})
				.then(objectivesByLevel => objectivesByLevel.day)
				.then(objectives => {
					// assertions
					should.exist(objectives);

					const summary = ObjectivesApi.getSummary(objectives, owner);
					should.exist(summary);
					summary.should.have.property('user');
					summary.should.have.property('everyone');
					summary.user.count.should.be.equal(2);
					summary.everyone.count.should.be.equal(4);
					summary.user.completed.should.be.equal(1);
					summary.everyone.completed.should.be.equal(2);
					done();
				})
				.catch(done) 
		})

	})

	describe('#delete', function() {

		it('Should delete work entries when deleting an objective', function(done) {
			const userId = sharedData.users[0]._id;
			const objectiveId = sharedData.objectives[0]._id;
			
			// setup work entries for objectives
			setupWorkEntries.bind(sharedData)()
				.then(we => { sharedData.work_entries = we })
				.then(_ => ObjectivesApi._deleteObjective(objectiveId, userId))
				.then(([doc, _, __]) => {
					// assertions
					doc._id.toString().should.equal(objectiveId.toString());

					// check if work entries were deleted
					const deletedIds = sharedData.work_entries.slice(0, 3).map(w => w._id);
					return WorkEntryModel.find({ _id: { $in: deletedIds } })
				})
				.then(docs => {
					docs.length.should.equal(0);
					done();
				})
				.catch(done);
		})

	})

})
