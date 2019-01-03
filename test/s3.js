require( 'dotenv' ).config();

const should = require( 'should' );
const s3 = require( '../utils/s3' );
const path = require( 'path' );

describe ( 'billing', function() {

	it( 'should upload a file to s3', function() {

		this.timeout( 20000 );

		const filepath = path.join( __dirname, '../public/attachments/1510175554850-CFE101A1036785.pdf' );
		return s3.put( filepath )
			.then( url => {

				console.log( url );
				url.should.not.equal( null );

			} );

	} );
} );