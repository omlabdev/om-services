var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	name 			: { type : String, required : true },
	hours_sold		: { type : Number, min : 1, required : true },
	hours_sold_unit : { type : String, enum : ['monthly', 'total'], lowercase : true },
	hourly_rate		: { type : Number, required : true, min : 1 },

	created_ts		: { type : Date, default : Date.now }
});

module.exports = mongoose.model('Project', schema);