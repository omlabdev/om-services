const mongoose = require ('mongoose');
const Schema = mongoose.Schema;
const ActivityModel = require('./activity');

var schema = new Schema({
	title 			: { type : String, required : true },
	description 	: { type : String, default : '' },
	tags			: [String],

	// every task belongs to a projec. we might have ON projects for internal tasks
	project			: { type: Schema.Types.ObjectId, ref: 'Project', required : true },

	// an option array of URLs
	attachments 	: { type: [String], default: [] },

	created_ts 		: { type : Date, default : Date.now },
	created_by		: { type : Schema.Types.ObjectId, ref: 'User', required : true },
	origin			: { type : String, required : true, lowercase : true },	// teamwork, trello, slack, email, web, ...
	external_id		: { type : String, default : null },
	external_url	: { type : String, default : null },

	// when set to true, scratches any existing objective linked to it
	deleted			: { type : Boolean, default : false },
	deleted_ts		: { type : Date, default : null }
}, {
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
});

require('mongoose-count-and-find')(schema);

schema.post('save', (doc, next) => {
	const description = `%user.first_name% has created a new task: %meta.task.title%`,
			type = 'task-create',
			user = doc.created_by,
			meta = { task : doc._id };
	ActivityModel.create({ description, type, user, meta }, (err, res) => {
		next();
	});
})

module.exports = mongoose.model('Task', schema);