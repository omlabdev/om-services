 const conf = {

	endpoint 	: '/api',
	
	version 	: '1.0',

	auth_on		: true

}

module.exports = Object.assign(conf, { 

	root : `${conf.endpoint}/${conf.version}` 

});