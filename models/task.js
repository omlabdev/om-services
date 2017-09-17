var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	title 			: { type : String, required : true },
	description 	: { type : String, default : '' },
	tags			: [String],

	// every task belongs to a projec. we might have ON projects for internal tasks
	project			: { type: Schema.Types.ObjectId, ref: 'Project', required : true },

	created_ts 		: { type : Date, default : Date.now },
	created_by		: { type : Schema.Types.ObjectId, ref: 'User' },
	origin			: { type : String, required : true, lowercase : true },	// teamwork, trello, slack, email, web, ...
	external_id		: { type : String, default : null },

	// when set to true, scratches any existing objective linked to it
	deleted			: { type : Boolean, default : false },
	deleted_ts		: { type : Date, default : null }
});

require('mongoose-count-and-find')(schema);

module.exports = mongoose.model('Task', schema);