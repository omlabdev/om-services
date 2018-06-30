var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var measures = ['hours_executed', 'hours_billed', 'objectives_quantity', 'tasks_quantity'];

var schema = new Schema({
	name 			: { type : String, required : true },
	measure 		: { type : String, required : true, enum : measures, lowercase : true },

	user_filter 	: { type : Schema.Types.ObjectId, ref : 'User' },
	project_filter 	: { type : Schema.Types.ObjectId, ref : 'Project' },
	date_filter 	: { type : String, default : 'ever' },
	state_filter 	: { type : String },
	condition_op 	: { type : String, required : true, default : '>' },
	condition_value : { type : Number, required : true, default : 0 },

	created_by 		: { type : Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts		: { type : Date, default : Date.now },
	enabled 		: { type : Boolean, required : true, default : true },
},
{ 
	collection : 'alarms',
	minimize   : false
});

module.exports = mongoose.model('Alarm', schema);
