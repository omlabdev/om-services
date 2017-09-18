const mongoose = require ('mongoose');
const ActivityModel = require('./activity');

// define schemas
require('./user');
require('./task');

const Schema = mongoose.Schema;

const schema = new Schema({
	objective_date 	: { type : Date, required : true, default : Date.now },
	level 			: { type : String, required : true, enum : ['day', 'month', 'year'], lowercase : true },

	related_task 	: { type: Schema.Types.ObjectId, ref: 'Task' },
	// when the objective is not related to a task:
	no_task_title 	: { type : String }, 

	owners 			: { 
		type 	 : [{ type: Schema.Types.ObjectId, ref: 'User' }], 
		validate : [function(v) { return v.length > 0 }, 'Objective must have at least one owner'] 
	},

	progress		: { type : Number, min : 0, max : 1, required : true, default : 0 }, // 0 to 1. 1 means completed
	completed_by 	: { type : Schema.Types.ObjectId, ref: 'User', default: null },
	completed_ts 	: { type : Date, default : null },
	scratched 		: { type : Boolean, default : false },
	scratched_ts	: { type : Date, default : null },
	scratched_by	: { type : Schema.Types.ObjectId, ref: 'User', default: null },

	created_by		: { type : Schema.Types.ObjectId, ref: 'User', required : true },
	created_ts 		: { type : Date, default : Date.now },

	deleted 		: { type : Boolean, default: false },
	deleted_by		: { type : Schema.Types.ObjectId, ref: 'User', default: null },
	deleted_ts 		: { type : Date, default : null }
},{
    toObject: {
      virtuals: true
    },
    toJSON: {
      virtuals: true
    }
});


schema.virtual('title').get(function() {
	return this.related_task ? this.related_task.title : this.no_task_title ;
});

schema.post('save', (doc, next) => {
	const description = `%user.first_name% has created a new objective: %meta.objective.title%`,
			type = 'objective-create',
			user = doc.created_by,
			meta = { objective : doc._id };
	ActivityModel.create({ description, type, user, meta }, next);
})

module.exports = mongoose.model('Objective', schema);
