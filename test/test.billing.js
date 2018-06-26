const should = require('should');
const { setupUsers, dropUsers } = require('./setup/setup.users');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const { setup, tearDown } = require('./setup/setup.billing');
const BillingApi = require('./../api/billing');
const moment = require('moment');
const InvoiceModel = require('./../models/invoice');


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

	describe("#getWorkEntriesForProject", function() {

		it('should return every work entry linked to a project through objectives & tasks', function(done) {
			BillingApi.getWorkEntriesForProject(sharedData.projects[0]._id)
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
			BillingApi.calculateTotalExecuted(sharedData.projects[0]._id)
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
			BillingApi.calculateThisMonthExecuted(sharedData.projects[1]._id)
				.then(total => {
					// assertions
					should.exist(total);
					total.should.equal(3600);
					done();
				})
				.catch(done)
		})

	})

	describe("#calculateExecutedSince", function() {

		it('should return total amount of work entries since a given date', function(done) {
			const since = moment.utc().add(-1, 'months').add(1, 'days').format('YYYY-MM-DD');
			BillingApi.calculateExecutedSince(sharedData.projects[1]._id, since)
				.then(total => {
					// assertions
					should.exist(total);
					total.should.equal(3600*2);
					done();
				})
				.catch(done)
		})

	})

	describe.only("#invoiceWorkEntries", function() {

		it('Should create an invoice with non-invoiced work entries', function(done) {
			const user = sharedData.users[0]._id;

			const invoice = {
				description: "Test",
				amount: 100,
				invoicing_date: moment().toDate(),
				direction: "in",
				created_by: user,
				billed_hours: 10,
				receiver: "Nicolas",
				work_entries: sharedData.workEntries.map(e => e._id)
			};

			BillingApi._addInvoice(invoice)
				.then(result => {
					should.exist(result);
					result.work_entries.length.should.equal(sharedData.workEntries.length);
					done();
				})
				.catch(done);
		})

		it('Should NOT create an invoice with already invoiced work entries', async function() {
			const user = sharedData.users[0]._id;

			const invoice1 = {
				description: "Test",
				amount: 100,
				invoicing_date: moment().toDate(),
				direction: "in",
				created_by: user,
				billed_hours: 10,
				receiver: "Nicolas",
				work_entries: sharedData.workEntries.map(e => e._id)
			};

			const invoice2 = {
				description: "Test",
				amount: 100,
				invoicing_date: moment().toDate(),
				direction: "in",
				created_by: user,
				billed_hours: 10,
				receiver: "Nicolas",
				work_entries: [sharedData.workEntries.map(e => e._id)[0]]
			}

			// create one
			return BillingApi._addInvoice(invoice1)
				.then(r => {
					// try to create another one with same entries
					return BillingApi._addInvoice(invoice2);
				})
				.then(result => { 
					should.fail();
				})
				.should.eventually.be.rejected;
			
		})

	})

})
