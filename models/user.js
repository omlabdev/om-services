var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	username 		: { type : String, lowercase : true, required : true, unique : true },
	password 		: { type : String, required : true },

	first_name		: { type : String, required : true },
	last_name		: { type : String, default : '' },
	profile_image	: { type : String, default : 'https://m2leisure.com/wp-content/uploads/mystery-man-360x275.png' },

	email 			: { type : String, lowercase : true, required : true, unique : true },
	slack_account 	: { type : String, lowercase : true },
	trello_account	: { type : String, lowercase : true },
	git_user		: { type : String, lowercase : true },
	
	enabled 		: { type : Boolean, default : true }
},{
	toObject: {
		virtuals: true
	},
	toJSON: {
		virtuals: true,
		transform: function(doc, ret, options) {
			// remove password from return docs
			delete ret.password;
			return ret;
		}
	}
});

schema.virtual('full_name').get(function() {
	return this.first_name + (this.last_name ? ` ${this.last_name}` : '');
});

module.exports = mongoose.model('User', schema);