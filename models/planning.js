const mongoose = require ( 'mongoose' );
const Schema = mongoose.Schema;

const objects = [ 'year_objective' ];

var schema = new Schema( {
	object_type 	: { type: String, enum: objects, lowercase: true, required: true },
	object_name 	: { type: String, lowercase: true, required: true },
	object_value	: { type: String, required: true },

	created_by 		: { type : Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts		: { type : Date, default : Date.now },
}, {
	minimize   : false,
	collection : 'planning',
} );

module.exports = mongoose.model( 'Planning', schema );