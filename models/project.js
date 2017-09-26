var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	name 			: { type : String, required : true },
	hours_sold		: { type : Number, min : 0, required : true },
	hours_sold_unit : { type : String, enum : ['monthly', 'total'], lowercase : true, default : 'total' },
	hourly_rate		: { type : Number, required : true, min : 0 },

	created_ts		: { type : Date, default : Date.now }
});

module.exports = mongoose.model('Project', schema);