var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var schema = new Schema({
	description 	  	: { type : String, required : true },
	amount 				: { type : Number, required : true },
	invoicing_date     	: { type : Date, required : true },
	paid_date 			: { type : Date, default: null },
	number 				: { type : Number },
	direction			: { type : String, enum: ['in', 'out'], lowercase: true, required: true },
	attachment			: { type : String },

	created_by 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts 		  	: { type : Date, default : Date.now },

	// fields used for *out* invoices (to clients)
	project 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'Project', required: false },
	receiver 		  	: { type : String },
	billed_hours 		: { type : Number },

	// fields used bt *in* invoices (from providers to us)
	work_entries 		: [{ type : mongoose.Schema.Types.ObjectId, ref : 'WorkEntry', required: false }],
	
}, {
	_id: true,
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
});

schema.virtual('paid').get(function() {
	return !!this.paid_date && moment(this.paid_date) < moment();
});

module.exports = mongoose.model('Invoice', schema);