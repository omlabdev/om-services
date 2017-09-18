
const UserModel = require('./../models/user');
const async = require('async');

exports.setupUsers = function(cb) {
	const users = [
		{
			username 	: 'username1',
			password	: 'password1',
			first_name	: 'first_name1',
			email		: 'email1@somecompany.com'
		},
		{
			username 	: 'username2',
			password	: 'password2',
			first_name	: 'first_name2',
			email		: 'email2@somecompany.com'
		}
	]
	const docs = []
	async.each(users, (u, done) => UserModel.create(u, (e, doc) => {
		docs.push(doc)
		done(e);
	}), (e) => {
		cb(e, docs);
	});
}

exports.dropUsers = function(cb) {
	UserModel.remove({}, cb);
}