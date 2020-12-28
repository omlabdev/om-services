const paypal = require( 'paypal-rest-sdk' );
const moment = require( 'moment-timezone' );

const ENV = process.env.PAYPAL_ENV;
const ACCOUNT = process.env[ `PAYPAL_${ ENV.toUpperCase() }_ACCOUNT` ];
const CLIENT_ID = process.env[ `PAYPAL_${ ENV.toUpperCase() }_CLIENT_ID` ];
const CLIENT_SECRET = process.env[ `PAYPAL_${ ENV.toUpperCase() }_CLIENT_SECRET` ];

paypal.configure( {
	mode: ENV, // Sandbox or live
	client_id: CLIENT_ID,
	client_secret: CLIENT_SECRET,
} );


function createInvoice( invoiceData ) {
	const invoiceModel = getInvoiceTemplateWithData( invoiceData );
	return new Promise( ( resolve, reject ) => {
		paypal.invoice.create( invoiceModel, ( error, invoice ) => {
		    if ( error ) {
		    	console.error( JSON.stringify( error ) );
		    	return reject( error );
		    }
		    resolve( invoice );
		} );
	} );
	    
}

function getInvoiceTemplateWithData( invoiceData ) {
	const { 
		amount, 
		description,
		invoicing_date, 
		billed_hours, 
		number, 
		project: { 
			name, 
			company_name, 
			company_email 
		} 
	} = invoiceData;

	if ( !company_email || !company_name ) {
		throw new Error( 'Company information is missing' );
	}

	return {
		'number': number || undefined,
		'cc_info': [ { email: 'rafael@on-lab.com' } ],
		'merchant_info': {
	        'email': ACCOUNT,
	        'first_name': 'Rafael',
	        'last_name': 'Perruccio',
	        'business_name': 'ON Lab Inc.',
	        'phone': {
	            'country_code': '001',
	            'national_number': '5128616598',
	        },
	        'address': {
	            'line1': '6718 NW 72nd. Ave. Suite No. 23897',
	            'city': 'Miami',
	            'state': 'FL',
	            'postal_code': '33195-3002',
	            'country_code': 'US'
	        }
	    },
	    'billing_info': [ {
	        'email': company_email,
	    } ],
	    'items': [ {
	        'name': `${ name } - ${ description }`,
	        'quantity': billed_hours,
	        'unit_price': {
	            'currency': 'USD',
	            'value': parseFloat( ( amount / billed_hours ).toFixed( 2 ) ),
	        }
	    } ],
	    'allow_tip': false,
	    'logo_url': 'https://s3-us-west-2.amazonaws.com/onlab-om-files/logo.png',
	    // 'template_id': 'TEMP-4U904317UP3707524',
	    'payment_term': {
	        'term_type': 'NET_15'
	    },
	    'invoice_date': `${ moment( invoicing_date ).format( 'YYYY-MM-DD' ) } EST`,
	    'tax_inclusive': true,
	    'total_amount': {
	        'currency': 'USD',
	        'value': String( amount ),
	    }
	};
}

function sendInvoice( invoice ) {
	return null;

	return new Promise( ( resolve, reject ) => {
		paypal.invoice.send( invoice.id, ( error, rv ) => {
			if ( error ) {
				console.error( JSON.stringify( error ) );
				return reject( error );
			}
        	resolve( rv );
		} );
	} );

}

module.exports = { createInvoice, sendInvoice };
