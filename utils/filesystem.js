const multer = require( 'multer' );
const path = require( 'path' );

const storage = multer.diskStorage( {
	destination: function ( req, file, cb ) {
  	const tmp = process.env.TEMP_FOLDER || 'tmp';
  	const dir = tmp.charAt( 0 ) === '/' ? tmp : path.join( __dirname, '..', process.env.TEMP_FOLDER );
		cb( null, dir );
	},
	filename: function ( req, file, cb ) {
		cb( null, `${ Date.now() }-${ file.originalname }` );
	}
} );

module.exports = multer( { storage } );