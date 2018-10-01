const knox = require( 'knox-s3' );

var client = knox.createClient({
    key: process.env.S3_ACCESS_KEY, 
    secret: process.env.S3_SECRET,
    bucket: process.env.S3_BUCKET,
});

/**
 * Uploads the given file into an S3 bucket.
 * 
 * @param  {String} filepath 
 * @return {Promise}	Resolves to the url of the uploaded file          
 */
exports.put = function( filepath ) {

	console.log( `[s3] uploading file ${ filepath }` );
	const filename = filepath.substring( filepath.lastIndexOf( '/' ) + 1 );

	return new Promise( ( resolve, reject ) => {
		const req = client.putFile( filepath, filename, { 'x-amz-acl': 'public-read', style: 'path' }, ( error, res ) => {
			
			console.log( '[s3] upload response code: ', res.statusCode );

			if ( error ) return reject( error );
			else if ( res.statusCode !== 200 ) {
				return reject( new Error( `${ res.statusCode }: ${ res.statusMessage }` ) );
			}

			return resolve( client.https( filename ) );
		} );
	} )
	
}