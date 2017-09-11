const UsersModel = require('./../models/user');
const sha = require('sha');

/*
	POST	/api/{v}/users/auth

	POST	/api/{v}/users/add

	POST	/api/{v}/users/:id

	DELETE	/api/{v}/users/:id

	GET		/api/{v}/users
 */
exports.setup = (router) => {
	router.post('/users/auth', exports.authorizeUser);
	router.post('/users/add', exports.createUser);
	router.post('/users/:userId', exports.updateUser);
	router.delete('/users/:userId', exports.disableUser);
	router.get('/users', exports.getUsers);
}

exports.authorizer = function(username, password) {
	return new Promise((resolve, reject) => {
		UsersModel.findOne({ username, password })
			.then((user) => {
				if (!user) return reject({ error : new Error('invalid login') });
				resolve({ user })
			})
			.catch((error) => { reject({ error }) })
	})
}

/**
 * Verifies that the user exists and the auth information
 * is correct.
 *
 * Auth is done using the Authorization header.
 * The correct format is:
 *
 * 	Authorization:  Basic: <base64 user>:<base64 password>
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 */
exports.authMiddleware = function(req, res, next) {
	if (req.url.endsWith('/auth')) return next();

	const token = (req.headers.authorization || '')
					.replace('Basic:', '').replace(/^\s+|\s+$/g, '');

	const [ encodedUsername, encodedPassword ] = token.split(':');
	if (!encodedUsername || !encodedPassword) res.sendStatus(401);

	const username = Buffer.from(encodedUsername, 'base64').toString(),
		password = Buffer.from(encodedPassword, 'base64').toString();

	exports.authorizer(username, password)
		.then(() => { next() })
		.catch((error) => res.sendStatus(401));
}

exports.authorizeUser = function(req, res) {
	const { username, password } = req.body;
	exports.authorizer(username, password)
		.then(res.json.bind(res))
		.catch(res.json.bind(res));
}

exports.createUser = function(req, res) {
	const userData = req.body;
	
	const sha256 = sha.createHash('sha256');
	userData.password = sha256.update(userData.password, 'utf8').digest('hex');

	const model = new UsersModel(userData);
	UsersModel.create(model)
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		});
}

exports.updateUser = function(req, res) {
	const _id = req.params.userId;
	UsersModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((error) => {
			res.json({ error })
		})
}

exports.disableUser = function(req, res) {
	req.body = { enabled : false };
	exports.updateUser(req, res);
}

exports.getUsers = function(req, res) {
	UsersModel.find({ enabled : true })
		.then((users) => {
			res.json({ users })
		})
		.catch((error) => {
			res.json({ error })
		})
}
