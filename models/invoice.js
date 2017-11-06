var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	project 		  	: { type : mongoose.Schema.Types.ObjectId, ref : 'Project', require : true },
	description 	  	: { type : String, required : true },
	amount 				: { type : Number, required : true },
	billed_hours 		: { type : Number },
	invoicing_date     	: { type : Date, required : true },
	paid 				: { type : Boolean, default : false },
	number 				: { type : Number },
	direction			: { type : String, enum: ['in', 'out'], lowercase: true, require: true },

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

module.exports = mongoose.model('Invoice', schema);