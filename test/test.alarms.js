const should = require('should');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { setup, tearDown } = require('./setup/setup.alarms');
const AlarmsApi = require('./../api/alarms');
const moment = require('moment');


describe('alarms', function() {
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

	describe("#_evalAlarm: hours executed", function() {

		it('should run the alarm when executed hours for all users & all projects & all time exceed X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '>',
				condition_value: 5,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(12);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for all users & all projects & all time are equal to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '==',
				condition_value: 12,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(12);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for 1 user & all projects & all time are less than X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '<',
				condition_value: 10,
				date_filter: '',
				project_filter: '',
				user_filter: sharedData.users[0],
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(6);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for all users & 1 project & all time are less than X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '<',
				condition_value: 10,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for all users & all project & this week are gte to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '>=',
				condition_value: 4,
				date_filter: 'this_week',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				// summary.currentValue.should.be.equal(4); // see @whyiscommented
				summary.currentValue.should.be.aboveOrEqual(4);
				summary.currentValue.should.be.belowOrEqual(6);
				summary.currentValue.should.not.be.equal(5);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for all users & all project & this month are lte to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '<=',
				condition_value: 6,
				date_filter: 'this_month',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				// summary.currentValue.should.be.equal(6); // see @whyiscommented
				summary.currentValue.should.be.aboveOrEqual(4);
				summary.currentValue.should.be.belowOrEqual(6);
				summary.currentValue.should.not.be.equal(5);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when executed hours for all users & all project & this year are gt X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '>',
				condition_value: 3,
				date_filter: 'this_year',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				// summary.currentValue.should.be.equal(8); // see @whyiscommented
				summary.currentValue.should.be.aboveOrEqual(4);
				summary.currentValue.should.be.belowOrEqual(8);
				summary.currentValue.should.not.be.equal(5);
				summary.currentValue.should.not.be.equal(7);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should not run the alarm when condition is not met (1)', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '>',
				condition_value: 8,
				date_filter: 'this_year',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.below(9);
				summary.run.should.be.equal(false);
				done();
			})
			.catch(done);
		})

		it('should not run the alarm when condition is not met (2)', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_executed',
				condition_op: '<',
				condition_value: 12,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(12);
				summary.run.should.be.equal(false);
				done();
			})
			.catch(done);
		})

	})

	describe("#_evalAlarm: hours billed", function() {

		it('should run the alarm when billed hours for all projects & all time exceed X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_billed',
				condition_op: '>',
				condition_value: 2,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(3);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when billed hours for 1 project & all time is equal to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_billed',
				condition_op: '==',
				condition_value: 1,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when billed hours for all project this month is equal to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_billed',
				condition_op: '==',
				condition_value: 2,
				date_filter: 'this_month',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when billed hours for 1 project this month is equal to X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'hours_billed',
				condition_op: '==',
				condition_value: 1,
				date_filter: 'this_month',
				project_filter: sharedData.projects[0],
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})
	})

	describe("#_evalAlarm: objectives quantity", function() {

		it('should run the alarm when the number of objectives for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'objectives_quantity',
				condition_op: '==',
				condition_value: 4,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(4);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of completed objectives for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'objectives_quantity',
				condition_op: '==',
				condition_value: 2,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: 'completed',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of objectives for a projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'objectives_quantity',
				condition_op: '==',
				condition_value: 1,
				date_filter: '',
				project_filter: sharedData.projects[0],
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of active objectives for a projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'objectives_quantity',
				condition_op: '==',
				condition_value: 1,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: 'active',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

	})

	describe("#_evalAlarm: tasks quantity", function() {

		it('should run the alarm when the number of tasks for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 5,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(5);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of tasks for a project equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 2,
				date_filter: '',
				project_filter: sharedData.projects[0],
				user_filter: '',
				state_filter: '',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of unassigned tasks for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 1,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: 'unassigned',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of unassigned tasks for a projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 0,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: 'unassigned',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(0);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of active tasks for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 2,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: 'active',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of active tasks for a projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 1,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: 'active',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(1);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of completed tasks for all projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 2,
				date_filter: '',
				project_filter: '',
				user_filter: '',
				state_filter: 'completed',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

		it('should run the alarm when the number of completed tasks for a projects equals X', function(done) {
			const alarm = {
				name: 'test alarm',
				measure: 'tasks_quantity',
				condition_op: '==',
				condition_value: 2,
				date_filter: '',
				project_filter: sharedData.projects[1],
				user_filter: '',
				state_filter: 'completed',
			}
			
			AlarmsApi._evalAlarm(alarm, true).then(summary => {
				summary.currentValue.should.be.equal(2);
				summary.run.should.be.equal(true);
				done();
			})
			.catch(done);
		})

	})

})

// @whyiscommented
// 
// If we're testing at the start of the month, it 
// can happen that the date startOf('month').add(-1, 'days')
// belongs to the present week (i.e, if today is Fri March 1st, then
// Thu Feb 28th is last month but same week).
// 
// Same happens for this month and this year with the 'this_week' data. 
// Could be part of this month/year or last month/year.
// 
// For this reason, given the test data, both current values 4 and 6 can
// be correct at different times (6 at the start of the month when the
// last month entries belong to the present week, and 4 after day 7 of the month).
// 
// For simplicity I'm just commenting this check.
// 