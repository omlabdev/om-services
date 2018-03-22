var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	name 			: { type : String, required : true },
	company_name 	: { type : String, defaut : '' },
	hours_sold		: { type : Number, min : 0, required : true },
	hours_sold_unit : { type : String, enum : ['monthly', 'total'], lowercase : true, default : 'total' },
	hourly_rate		: { type : Number, required : true, min : 0 },
	active 			: { type : Boolean, default : true },
	created_ts		: { type : Date, default : Date.now },

	// this fields are used by external integrations, like a
	// website
	featured		: { type : Boolean, default: true },
	description		: { type : String, default: '' },
	description_es	: { type : String, default: '' }, // description in spanish
	featured_image	: { type : String },
	external_link	: { type : String },
	type			: { type : String, default: 'web' },
}, {
	minimize   : false
});

module.exports = mongoose.model('Project', schema);