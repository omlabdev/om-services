 const conf = {

	endpoint 	: '/api',
	
	version 	: process.env.API_VERSION,

	auth_on		: process.env.AUTH_REQUIRED === 'true',

	app_domain 	: process.env.OM_FRONTEND_URL

}

module.exports = Object.assign(conf, { 

	root : `${conf.endpoint}/${conf.version}` 

});