const mongoose = require ( 'mongoose' );
const Schema = mongoose.Schema;

const measures = [ 'hours_executed', 'hours_billed', 'objectives_quantity', 'tasks_quantity' ];

const schema = new Schema( {
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
} );

module.exports = mongoose.model( 'Alarm', schema );
