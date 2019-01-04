var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;
var moment = require( 'moment' );

var schema = new Schema( {
	description 	  	: { type : String, required : true },
	amount 				: { type : Number, required : true },
	invoicing_date     	: { type : Date, required : true }, // the date the service was excecuted
	invoice_date     	: { type : Date, default : Date.now }, // the date that appears in the invoice
	paid_date 			: { type : Date, default: null },
	number 				: { type : Number },
	direction			: { type : String, enum: [ 'in', 'out' ], lowercase: true, required: true },
	attachment			: { type : String },

	created_by 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts 		  	: { type : Date, default : Date.now },

	billed_hours 		: { type : Number },
	
	// fields used for *out* invoices (to clients) or *in* (expense)
	project 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'Project', required: false },

	// fields used by *in* invoices (from providers to us or expenses)
	receiver 		  	: { type : String },
	work_entries 		: [ { type : mongoose.Schema.Types.ObjectId, ref : 'WorkEntry', required: false } ],

	// paypal integration metadata
	paypal_invoice_id	: { type : String, default: null },
	
}, {
	_id: true,
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
} );

schema.virtual( 'paid' ).get( function() {
	return !!this.paid_date && moment( this.paid_date ) < moment();
} );

module.exports = mongoose.model( 'Invoice', schema );