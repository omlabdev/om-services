var mongoose = require ('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	username 		: { type : String, lowercase : true, required : true, unique : true },
	password 		: { type : String, required : true },

	first_name		: { type : String, required : true },
	last_name		: { type : String, default : '' },

	email 			: { type : String, lowercase : true, required : true, unique : true },
	slack_account 	: { type : String, lowercase : true },
	trello_account	: { type : String, lowercase : true },
	
	enabled 		: { type : Boolean, default : true }
});

schema.virtual('full_name').get(() => 
	this.first_name + (this.last_name ? ` ${this.last_name}` : ''));

schema.set('toJSON', {
	// remove password from return docs
    transform: function(doc, ret, options) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', schema);