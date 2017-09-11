var mongoose = require ('mongoose');

var Schema = mongoose.Schema;

var schema = new Schema({
	objective_date 	: { type : Date, required : true, default : Date.now },
	level 			: { type : String, required : true, enum : ['day', 'month', 'year'], lowercase : true },

	related_task 	: { type: Schema.Types.ObjectId, ref: 'Task' },
	no_task_title 	: { type : String, required : () => !this.related_task }, // when the objective is not related to a task

	owners 			: { 
		type : [{ type: Schema.Types.ObjectId, ref: 'User' }], 
		validate : [(v) => v.length > 0, 'Objective must have at least one owner'] 
	},

	progress		: { type : Number, min : 0, max : 1, required : true, default : 0 }, // 0 to 1. 1 means completed
	completed_by 	: { type: Schema.Types.ObjectId, ref: 'User' },
	completed_ts 	: { type : Date, default : null },
	scratched 		: { type : Boolean, default : false },
	scratched_ts	: { type : Date, default : null },

	created_by		: { type : Schema.Types.ObjectId, ref: 'User', required : true },
	created_ts 		: { type : Date, default : Date.now }
});

module.exports = mongoose.model('Objective', schema);