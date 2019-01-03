const should = require( 'should' );
const paypal = require( '../api/paypal/paypal' );

describe.only( 'paypal', function() {

	it ( 'should create an invoice and resolve', async function() {
		
		this.timeout( 20000 );

		const data = {
			amount: 1 * 1,
			billed_hours: 1,
			invoicing_date: new Date(),
			project: {
				name: 'TLL',
				company_name: 'Work In Progress, LLC',
				company_email: 'nicolasalliaume@gmail.com',
			}
		};

		const invoice = await paypal.createInvoice( data );

		invoice.should.not.equal( null );	
	} );

	it ( 'should send a newly created invoice', async function() {
		
		this.timeout( 20000 );

		const data = {
			amount: 1 * 1,
			billed_hours: 1,
			invoicing_date: new Date(),
			project: {
				name: 'TLL',
				company_name: 'Work In Progress, LLC',
				company_email: 'nicolasalliaume@gmail.com',
			}
		};

		const invoice = await paypal.createInvoice( data );
		invoice.should.not.equal( null );

		await paypal.sendInvoice( invoice );

	} );

} );