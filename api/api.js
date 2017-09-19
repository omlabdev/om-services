 const conf = {

	endpoint 	: '/api',
	
	version 	: '1.0',

	auth_on		: true,

	app_domain 	: process.env.NODE_ENV === 'production' 
					? 'https://om-frontend.herokuapp.com' 
					: 'http://localhost:3100'

}

module.exports = Object.assign(conf, { 

	root : `${conf.endpoint}/${conf.version}` 

});