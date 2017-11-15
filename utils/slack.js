const superagent = require('superagent');

/**
 * Sends a message to the given user id (as a private
 * message).
 * 
 * @param  {String}   userId  The slack user id
 * @param  {Object}   message Extends the basic message
 * @param  {Function} cb      (error, response)
 */
exports.sendMessage = function(channel, message, token, cb) {
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