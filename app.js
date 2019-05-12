/* SERVER */

var express = require( 'express' );
var app = express();

// Static handling sorts of stuff
app.use( express.static( 'public' ));

// Stupidest possible layout engine
// code research: https://expressjs.com/en/advanced/developing-template-engines.html
var fs = require( 'fs' );

app.engine( 'mt', function( path, opt, cb ){
	fs.readFile( path, function( err, content ){
		if ( err ) return cb( err );

		var factors = primeFactorize( opt.n );

		var render = content.toString()
			.replace( '#factors#', '<p>' + factors + '</p>' );

		return cb( null, render );
	});
});

app.set( 'views', './' );
app.set( 'view engine', 'mt' );

// Handling a GET
app.get( '/checkprime', function handleCheckprime( request, response ){
	response.render( 'index', { n: request.query.N });
});

var server = app.listen( 3011, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log( "http://%s:%s", host, port );
});

/* NUMBERS */

// Pollard's Rho: attracted me for being a little different
// than the ancient sieves. A big selling point was low space
// complexity.

// choice of stride is the subject of empirical observations
// that I have not performed. But, roughly: this works well
// with n = pq where p or q are not very close in value
function rhoStride( x, n ){
	// code research: https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
	function getRandomInt(min, max) {
	    min = Math.ceil(min);
	    max = Math.floor(max);
	    return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	return (( x * x ) + Math.ceil( Math.sqrt( getRandomInt( 1, x )))) % n;
}

// essentially, gcd( | a - b | % n )
function rhoFactor( a, b, n ){
	// difference of a and b
	let diff = Math.abs( a - b );

	// gcd
	var r;
	while( n != 0 ){
		r = diff % n;
		diff = n;
		n = r;
	}

	return diff;
}

// Basic ideas: Chinese Remainder Theorom and Birthday Paradox
// As we use 'fast' and 'slow' movement through mod-n 
// When we're lucky we find factors quickly
// When we're unlucky we can actually fail to factor ...
// Example: 961, with this setup
function rho( n ){
	let fast = 2, slow = 2, factor = 1;
	let strides = 2;

	while( factor === 1 ){
		let count = 1;
		while(( count <= strides )
			&& ( factor <= 1 )){

			// fast = g( x ), then g( g( x )) etc.
			fast = rhoStride( fast, n );

			// if factor > 1 here, it's a factor of n
			factor = rhoFactor( fast, slow, n );

			// co-prime, so increase cycle length
			count += 1;
		}

		// if we didn't find a factor, allow more strides
		strides *= 2;

		// also we'll jitter 'slow'
		slow = fast;
	}

	return factor;
}


function emitFactors( n ){
	let f = 0;
	let fs = [];

	while( n != 1 ){
		f = rho( n );

		// important with choice of g(x) here
		if( f % 2 === 0 ){
			f = 2;
			fs.push( f );

		// case: n is "prime"
		// in theory this is where to test for semi-primes,
		// bi-primes like 31^2 (961)
		} else if( f === n ){

				fs.push( f );

		// case: n is composite
		} else {
			fs.push( emitFactors( f ));
		}

		n = n / f;
	}

	return fs;
}

// pretty prints prime factors of n
function primeFactorize( n ){
	var fs = emitFactors( n );

	// in case I made a mistake ...
	function googlify( maybePrime ){
		query = "<a href=\"https://www.google.com/search?"
		query += "q=is+"
		query += maybePrime.toString();
		query += "+prime"
		query += "\">"
		query += maybePrime.toString();
		query += "</a>"
		return query;
	}

	var result = googlify( n ) + ": ";

	// if we only have one factor, we have a prime
	if ( fs.length === 1 ){
		result += "prime";

	// multiple factors
	} else {

		let curr = Number( fs[ 0 ]);

		while( fs.length > 0 ){
			let exponent = 1;
			let next = [];

			for( let j = 1; j < fs.length; ++j ){
				if( curr === Number( fs[ j ])){
					++exponent;
				} else {
					// keep it around for the next base factor
					next.push( Number( fs[ j ]));
				}
			}

			result += googlify( curr ) + "<sup>" + exponent + "</sup>";
			if( next.length > 0 ){
				result += " x ";
				curr = next[ 0 ];
			}

			fs = next;
		}
	}

	return result;
}
