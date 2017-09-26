const should = require('should');
const ObjectivesApi = require('../api/objectives');
const ObjectiveModel = require('../models/objective');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const async = require('async');
const moment = require('moment');
const { 
	setupObjectivesForToday,
	setupObjectivesForThisMonth,
	setupObjectivesForThisYear,
	setupObjectivesForYesterday,
	setupObjectivesForYesterdayWithCompletedToday,
	setupObjectivesForYesterdayWithScratchedToday,
	setupObjectivesForLastMonth,
	setupObjectivesForLastYear,
	setupObjectivesForTomorrow,
	setupObjectivesForLastMonthWithCompletedThisMonth,
	setupObjectivesForLastMonthWithScratchedThisMonth,
	setupObjectivesForLastYearWithCompletedThisYear,
	setupObjectivesForLastYearWithScratchedThisYear
} = require('./setup/setup.objectives');


describe('objectives migration', function() {

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

	/**
	 * Today objective tests.
	 *
	 * Today objectives should be all objectives that:
	 * 	- Were created today, even if completed or scratched, or
	 * 	- Were created before and are not completed nor scratched, or
	 * 	- Were created before and were completed today, or,
	 * 	- Were created before and were scratched today
	 */
	describe("today objectives", function() {

	  afterEach(function(done) {
	  	ObjectiveModel.remove({}, done);
	  })

		it('should return an objective created for today even if completed or scratched, but no deleted', function(done) {
			setupObjectivesForToday.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(3);
					assertTitles([/.*1/, /.*3/, /.*4/], objectivesByLevel.day);

					done();
				})
				.catch(done) 
		})

		it('should return an objective created for yesterday when not completed or scratched', function(done) {
			setupObjectivesForYesterday.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for yesterday when completed today', function(done) {
			setupObjectivesForYesterdayWithCompletedToday.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for yesterday when scratched today', function(done) {
			setupObjectivesForYesterdayWithCompletedToday.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('day');
					objectivesByLevel.day.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should only return objectives created today of before, but not after', function(done) {
			setupObjectivesForTomorrow.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.day.should.have.lengthOf(0);
					done();
				})
				.catch(done)
		})

	})

	/**
	 * This month objective tests.
	 *
	 * This month objectives should be all objectives that:
	 * 	- Were created this month, even if completed or scratched, or
	 * 	- Were created on a previous month and are not completed nor scratched, or
	 * 	- Were created on a previous month and were completed this month, or,
	 * 	- Were created on a previous month and were scratched this month
	 */
	describe("this months objectives", function() {

	  afterEach(function(done) {
	  	ObjectiveModel.remove({}, done);
	  })

		it('should return an objective created for this month even when completed or scratched', function(done) {
			setupObjectivesForThisMonth.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(function(objectivesByLevel) {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('month');
					objectivesByLevel.month.should.have.a.lengthOf(4);
					assertTitles([/.*1/, /.*2/, /.*3/, /.*4/], objectivesByLevel.month);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last month when not completed or scratched', function(done) {
			setupObjectivesForLastMonth.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('month');
					objectivesByLevel.month.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last month when completed this month', function(done) {
			setupObjectivesForLastMonthWithCompletedThisMonth.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('month');
					objectivesByLevel.month.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last month when scratched this month', function(done) {
			setupObjectivesForLastMonthWithScratchedThisMonth.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(objectivesByLevel => {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('month');
					objectivesByLevel.month.should.have.lengthOf(1);
					done();
				})
				.catch(done)
		})

	})

	/**
	 * This year objective tests.
	 *
	 * This year objectives should be all objectives that:
	 * 	- Were created this year, even if completed or scratched, or
	 * 	- Were created on a previous year and are not completed nor scratched, or
	 * 	- Were created on a previous year and were completed this year, or,
	 * 	- Were created on a previous year and were scratched this year
	 */
	describe("this years objectives", function() {

	  afterEach(function(done) {
	  	ObjectiveModel.remove({}, done);
	  })

		it('should return an objective created for this year when not completed nor scratched', function(done) {
			setupObjectivesForThisYear.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(function(objectivesByLevel) {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('year');
					objectivesByLevel.year.should.have.a.lengthOf(4);
					assertTitles([/.*1/, /.*2/, /.*3/, /.*4/], objectivesByLevel.year);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last year when not completed nor scratched', function(done) {
			setupObjectivesForLastYear.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(function(objectivesByLevel) {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('year');
					objectivesByLevel.year.should.have.a.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last year when completed this year', function(done) {
			setupObjectivesForLastYearWithCompletedThisYear.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(function(objectivesByLevel) {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('year');
					objectivesByLevel.year.should.have.a.lengthOf(1);
					done();
				})
				.catch(done)
		})

		it('should return an objective created for last year when scratched this year', function(done) {
			setupObjectivesForLastYearWithScratchedThisYear.bind(sharedData)()
				.then(() => ObjectivesApi._getObjectives(...today, true, owner))
				.then(function(objectivesByLevel) {
					// assertions
					should.exist(objectivesByLevel);
					objectivesByLevel.should.have.property('year');
					objectivesByLevel.year.should.have.a.lengthOf(1);
					done();
				})
				.catch(done)
		})

	})

})
