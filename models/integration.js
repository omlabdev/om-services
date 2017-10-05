var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	name 		: { type : String, required : true },
	service		: { type : String, required : true, enum : ['trello', 'teamwork'], lowercase : true },
	mappings	: { type : Schema.Types.Mixed, default : {} },
	meta 		: { type : Schema.Types.Mixed, default : {} },
	auto_tags	: { type : [String], default : [] },
	created_by	: { type : Schema.Types.ObjectId, ref : 'User', required : true },
	created_ts	: { type : Date, default : Date.now }
},
{ 
	collection : 'integrations',
	minimize   : false
});

module.exports = mongoose.model('Integration', schema);
