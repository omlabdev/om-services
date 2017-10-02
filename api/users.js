const UsersModel = require('./../models/user');
const sha = require('sha');
const api = require('./api');

const SLACK_TOKEN = 'biTlZ0Ica2fRNA4NFYLAWK33';

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
	if (/users\/auth(-link(s)?)?\/?$/.test(req.url.toString()) || req.method === 'OPTIONS') {
		return next();
	}

	const token = (req.headers.authorization || '').trim();
	if (!token) return res.sendStatus(401);

	if (token.toLowerCase().startsWith('basic:')) 
		return doTokenAuth(token, req, res, next);
	else if (token.toLowerCase().startsWith('slack:'))
		return doSlackAuth(token, req, res, next);

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
 * Authorizes a user using a Slack auth token with
 * slack user and slack app token
 * 
 * @param  {String}   token 
 * @param  {Objecto}   req   
 * @param  {Objecto}   res   
 * @param  {Function} next  
 */
function doSlackAuth(token, req, res, next) {
	const auth = token.replace(/Slack:/i, '');
	const [ slackUsername, slackToken ] = auth.split(':');

	if (!slackUsername || !slackToken || slackToken !== SLACK_TOKEN)
		return res.sendStatus(401);

	UsersModel.findOne({ slack_account: slackUsername.trim() })
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
				const encodedUsername = encodeAuthValue(username);
				const encodedPassword = encodeAuthValue(password);
				const id = doc._id.toString();
				const link = `${api.app_domain}/#/login/${id}/${encodedUsername}:${encodedPassword}`;
				links.push([username, link]);
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

exports.createUser = function(req, res) {
	const userData = req.body;
	
	const sha256 = sha.createHash('sha256');
	userData.password = sha256.update(userData.password, 'utf8').digest('hex');

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
	UsersModel.find({ enabled : true })
		.then((users) => {
			res.json({ users })
		})
		.catch((e) => {
			res.json({ error: e.message })
		})
}
