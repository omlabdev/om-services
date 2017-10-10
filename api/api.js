 const conf = {

	endpoint 	: '/api',
	
	version 	: '1.0',

	auth_on		: false, // SET TO TRUE

	app_domain 	: process.env.NODE_ENV === 'production' 
					? 'https://om-frontend.herokuapp.com' 
					: 'http://localhost:3100'

}

module.exports = Object.assign(conf, { 

	root : `${conf.endpoint}/${conf.version}` 

});