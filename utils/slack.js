const superagent = require('superagent');
const IntegrationModel = require('../models/integration');

/**
 * Sends a message to the given user id (as a private
 * message).
 * 
 * @param  {String}   userId  The slack user id
 * @param  {Object}   message Extends the basic message
 * @param  {String}   token Slack token to use
 * @return {Promise}
 */
exports.sendMessage = function(channel, message, token) {
	const body = Object.assign({
		token : token,
		channel : channel,
		as_user : false,
		icon_emoji : 'chart_with_upwards_trend',
		username : 'OM'
	}, message);
	
	return superagent
		.post(`https://slack.com/api/chat.postMessage?token=${token}`)
		.type('form')
		.send(body)
}

/**
 * Returns the default channel to use for slack messages
 * 
 * @return {String} 
 */
exports.getDefaultChannel = function() {
	return process.env.NODE_ENV === 'production' ? '#om' : '#om-test';
}

/**
 * Returns the token to use with Slack
 * 
 * @return {Promise} Resolves with the token (String)
 */
exports.getToken = function() {
	return IntegrationModel.findOne({ service: 'slack' }).then(i => i.meta.token);
}

/**
 * Returns the token to use with Slack
 * 
 * @return {Promise} Resolves with the token (String)
 */
exports.getBotToken = function() {
	return IntegrationModel.findOne({ service: 'slack' }).then(i => i.meta.bot_token);
}

/**
 * Sends a message to the given user id (as a private
 * message).
 * 
 * @param  {String}   userId  The slack user id
 * @param  {Object}   message Extends the basic message
 * @return {Promise}
 */
exports.sendMessageToUser = async function(username, message) {
	const token = await exports.getBotToken();

	const userId = await exports.getUserIdFromUsername(username, token);
	if (!userId) throw new Error("UserID not found");

	const channelId = await exports.getChannelIdForUserId(userId, token);
	if (!channelId) throw new Error("ChannelID not found");

	const body = Object.assign({
		token : token,
		channel : channelId,
		link_names: true, 
		// as_user : true 
	}, message);

	console.log(body);

	return superagent
		.post(`https://slack.com/api/chat.postMessage?token=${token}`)
		.type('form')
		.send(body)
}

/**
 * Fetches the Slack's user id for the given username
 * 
 * @param  {String}   username 
 * @param  {String}   _token 
 * @return  {Promise} 
 */
exports.getUserIdFromUsername = async function(username, _token) {
	const token = _token || (await exports.getBotToken());
	return superagent
		.get(`https://slack.com/api/users.list?token=${token}`)
		.then(response => response.body.members)
		.then(members => members.find(m => m.name === username))
		.then(member => member.id)
}

/**
 * Fetches the channel Id of the private conversation with
 * the given user id in Slack.
 * 
 * @param  {String}   userId 
 * @param  {String}   _token 
 * @return  {Promise}
 */
exports.getChannelIdForUserId = async function(userId, _token) {
	const token = _token || (await exports.getBotToken())
	return superagent
		.get(`https://slack.com/api/im.list?token=${token}`)
		.then(response => response.body.ims)
		.then(channels => channels.find(im => im.user === userId))
		.then(channel => channel.id)
}
