const UsersModel = require('./../models/user');
const sha256 = require('sha256');
const api = require('./api');

const SLACK_TOKEN = 'biTlZ0Ica2fRNA4NFYLAWK33';
const GIT_TOKEN = 'lkjLKNLKKNKABUHIUHS767823'; // just a plain ol' made-up token
const TRELLO_TOKEN = 'lkjLKNLKKNKABUHIUHS767824'; // just another plain ol' made-up token
const EMAIL_TOKEN = '9078tyausgdhjkn89b38998iuyKHJGYU897'; // made-up token

/*
	POST	/api/{v}/users/auth

	POST	/api/{v}/users/add

	POST	/api/{v}/users/:id

	DELETE	/api/{v}/users/:id

	GET		/api/{v}/users
 */
exports.setup = (router) => {
	router.post('/users/auth', exports.authorizeUser);
	router.post('/users/auth-link', exports.authorizeUserWithLink);
	router.post('/users/add', exports.createUser);
	router.post('/users/:userId', exports.updateUser);
	router.delete('/users/:userId', exports.disableUser);
	router.get('/users/auth-links', exports.getUserLinks);
	router.get('/users/auth-link', exports.getCurrentUserAuthLink);
	router.get('/users', exports.getUsers);
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
	const passthrou = [
		/users\/auth\/?$/.test(req.url.toString()),
		/users\/auth-links\/?$/.test(req.url.toString()),
		/users\/auth-link\/?$/.test(req.url.toString()) && req.method === 'POST',
		req.method === 'OPTIONS'
	]

	const canPass = passthrou.reduce((prev, v) => v || prev, false);
	if (canPass) return next();

	// check url for token as querystring
	let token = req.query.authtoken;
	if (token) {
		console.log("authenticating from querystring %s", token);
		return doTokenAuth(token, req, res, next);
	}
	token = (req.headers.authorization || '').trim();
	// no token at all. reject request
	if (!token) return res.sendStatus(401);
	
	console.log("authenticating %s", token);

	if (token.toLowerCase().startsWith('basic:')) 
		return doTokenAuth(token, req, res, next);
	else if (token.toLowerCase().startsWith('slack:'))
		return doIntegrationAuth(token, 'slack', req, res, next);
	else if (token.toLowerCase().startsWith('git:'))
		return doIntegrationAuth(token, 'git', req, res, next);
	else if (token.toLowerCase().startsWith('trello:'))
		return doIntegrationAuth(token, 'trello', req, res, next);
	else if (token.toLowerCase().startsWith('email:'))
		return doIntegrationAuth(token, 'email', req, res, next);

	return res.sendStatus(401);
}

/**
 * Authorizes a user using a Basic auth token with
 * encoded user and password.
 * 
 * @param  {String}   token 
 * @param  {Objecto}   req   
 * @param  {Objecto}   res   
 * @param  {Function} next  
 */
function doTokenAuth(token, req, res, next) {
	const auth = token.replace(/Basic:/i, '');

	const [ encodedUsername, encodedPassword ] = auth.split(':');
	if (!encodedUsername || !encodedPassword) 
		return res.sendStatus(401);

	const username = decodeUserAuthValue(encodedUsername),
		  password = decodeUserAuthValue(encodedPassword);

	exports.authorizer(username, password)
		.then(user => {
			if (!user) return res.sendStatus(401);
			req.currentUser = user.toObject();
			next();
		})
		.catch((error) => res.sendStatus(401));
}

/**
 * Authorizes a user using one of the integration auth tokens
 * and one of the user's external account (slack, trello, git, ...)
 * 
 * @param  {String}   token 
 * @param  {String}   service 
 * @param  {Objecto}   req   
 * @param  {Objecto}   res   
 * @param  {Function} next  
 */
function doIntegrationAuth(token, service, req, res, next) {
	const serviceToPrefix = { slack: 'Slack', trello: 'Trello', git: 'Git', email: 'Email' };
	const serviceToToken = { slack: SLACK_TOKEN, trello: TRELLO_TOKEN, git: GIT_TOKEN, email: EMAIL_TOKEN };
	const serviceToUserField = { slack: 'slack_account', trello: 'trello_account', git: 'git_account', email: 'email' };

	const auth = token.replace(new RegExp(serviceToPrefix[service]+':', 'i'), '');
	const [ username, theToken ] = auth.split(':');

	if (!username || !theToken || theToken !== serviceToToken[service])
		return res.sendStatus(401);

	UsersModel.findOne({ [serviceToUserField[service]]: username.trim() })
		.then(user => {
			if (!user) return res.sendStatus(401);
			req.currentUser = user.toObject();
			next();
		})
		.catch((error) => res.sendStatus(401));
}

/**
 * Looks in the DB for a user with the given user and
 * password. Returns a mongo promise.
 * 
 * @param  {String} username 
 * @param  {String} password 
 */
exports.authorizer = function(username, password) {
	return UsersModel.findOne({ username, password })
		.then((user) => {
			if (!user) {
				throw new Error('invalid login');
			}
			return user;
		})
}

function decodeUserAuthValue(encodedValue) {
	return Buffer.from(encodedValue, 'base64').toString()
}

function encodeAuthValue(decodedValue) {
	return new Buffer(decodedValue).toString('base64');
}

exports.authorizeUser = function(req, res) {
	const { username, password } = req.body;
	exports.authorizer(username, password)
		.then(user => res.json({ user }))
		.catch(e => res.json({ error : e.message }));
}

exports.authorizeUserWithLink = function(req, res) {
	const { authToken } = req.body;
	const [ username, password ] = authToken.split(':').map(decodeUserAuthValue);
	exports.authorizer(username, password)
		.then(user => res.json({ user }))
		.catch(e => res.json({ error : e.message }))
}

exports.getUserLinks = function(req, res) {
	UsersModel.find()
		.then(docs => {
			const links = [];
			docs.forEach(doc => {
				const username = doc.username;
				const password = doc.password;
				links.push([username, getAuthLinkForUsernameAndPassword(doc._id, username, password)]);
			})
			return links;
		})
		.then(links => links.map(l => `<a href='${l[1]}' target='_blank'>${l[0]}</a>  ${l[1]}`))
		.then(links => links.join('<br/><br/>'))
		.then(links => {
			res.set('Content-Type', 'text/html');
			res.send(new Buffer(links));
		})
		.catch(e => res.json({ error: e.message }))
}

exports.getCurrentUserAuthLink = function(req, res) {
	UsersModel.findOne({ username : req.currentUser.username })
		.then(doc => {
			res.json({ link : getAuthLinkForUsernameAndPassword(doc._id, doc.username, doc.password) });
		})
}

function getAuthLinkForUsernameAndPassword(id, username, password) {
	const encodedUsername = encodeAuthValue(username);
	const encodedPassword = encodeAuthValue(password);
	const link = `${api.app_domain}/#/login/${id.toString()}/${encodedUsername}:${encodedPassword}`;
	return link;
}

exports.createUser = function(req, res) {
	const userData = req.body;
	
	userData.password = sha256(userData.password); // encode pwd

	const model = new UsersModel(userData);
	UsersModel.create(model)
		.then(res.json.bind(res))
		.catch((e) => {
			res.json({ error: e.message })
		});
}

exports.updateUser = function(req, res) {
	const _id = req.params.userId;
	UsersModel.update({ _id }, { $set : req.body })
		.then(res.json.bind(res))
		.catch((e) => {
			res.json({ error: e.message })
		})
}

exports.disableUser = function(req, res) {
	req.body = { enabled : false };
	exports.updateUser(req, res);
}

exports.getUsers = function(req, res) {
	UsersModel.find()
		.then((users) => {
			res.json({ users })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}
