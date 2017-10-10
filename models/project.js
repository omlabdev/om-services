var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var invoiceSchema = new Schema({
	description 	  	: { type : String, required : true },
	amount 				: { type : Number, required : true },
	billed_hours 		: { type : Number, required : true },
	invoicing_date     	: { type : Date, required : true },
	project 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'Project', require : true },
	paid 				: { type : Boolean, default : false },

	created_ts 		  	: { type : Date, default : Date.now },
	created_by 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true }
}, {
	_id: true,
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true
	}
});

var schema = new Schema({
	name 			: { type : String, required : true },
	hours_sold		: { type : Number, min : 0, required : true },
	hours_sold_unit : { type : String, enum : ['monthly', 'total'], lowercase : true, default : 'total' },
	hourly_rate		: { type : Number, required : true, min : 0 },
	active 			: { type : Boolean, default : true },
	invoices 		: { type : [invoiceSchema], default : [] },
	created_ts		: { type : Date, default : Date.now }
}, {
	minimize   : false
});

module.exports = mongoose.model('Project', schema);