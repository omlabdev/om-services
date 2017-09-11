var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	objective 	: { type : Schema.Types.ObjectId, ref : 'Objective', required : true },
	time 		: { type : Number, required : true, min : 1 },	// seconds
	user		: { type : Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts 	: { type : Date, default : Date.now }
}, 
{ collection : 'work_entries' });

module.exports = mongoose.model('WorkEntry', schema);