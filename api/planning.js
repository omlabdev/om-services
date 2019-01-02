const PlanningModel = require( './../models/planning' );

/*
	GET		/api/{v}/admin/planning/:name
 */
exports.setup = ( router ) => {
	router.get( '/planning/:name', exports.getObject );
};

exports.getObject = function( req, res ) {
	const { name } = req.params;
	PlanningModel.findOne( { object_name: name } ).populate( 'created_by' )
		.then( object => {
			if ( !object ) return res.json( { error: `Object ${ name } not found` } );
			res.json( { object } );
		} )
		.catch( e => {
			res.json( { error: e.message } );
		} );
};