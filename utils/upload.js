const S3 = require( './s3' );
const upload = require( './filesystem' );

/**
 * Uploads the files stored by multer to an S3 bucket
 * and adds the S3 urls into the file objects.
 * 
 * @param  {Object}   req  
 * @param  {Object}   res  
 * @param  {Function} next 
 */
module.exports = ( req, res, next ) => {
	// upload to filesystem temporarily
	upload.any()( req, res, () => {
		// if a file has been uploaded, push it to S3
		if ( req.files.length > 0 ) {
			Promise.all( req.files.map( f => S3.put( f.path ) ) )
				.then( urls => req.files.map( 
					( f, idx ) => Object.assign( f, { s3_url : urls[ idx ] } ) ) 
				)
				.then( () => next() )
				.catch( e => res.json( { error: 'Error uploading files to S3: ' + e.message } ) );
		}
		else next();
	} );

};