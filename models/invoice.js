var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var schema = new Schema({
	project 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'Project', required: false },
	receiver 		  	: { type : String },
	description 	  	: { type : String, required : true },
	amount 				: { type : Number, required : true },
	billed_hours 		: { type : Number },
	invoicing_date     	: { type : Date, required : true },
	paid_date 			: { type : Date, default: null },
	number 				: { type : Number },
	direction			: { type : String, enum: ['in', 'out'], lowercase: true, required: true },
	attachment			: { type : String },

	created_by 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts 		  	: { type : Date, default : Date.now }
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