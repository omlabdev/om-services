var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	description 	: { type : String, required : true },
	user			: { type : Schema.Types.ObjectId, ref : 'User', required : true },
	type 			: { type : String, required : true },
	meta 			: { type : Schema.Types.Mixed },
	created_ts		: { type : Date, default : Date.now }
},
{ collection : 'activity' });

require('mongoose-count-and-find')(schema);

module.exports = mongoose.model('Activity', schema);