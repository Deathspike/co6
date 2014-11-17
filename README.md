# co6

A compact coroutine library for generators/promises.

## Quick Start

Requires `node` >= 0.11.3 with `harmony` (`--harmony` or `--harmony-generators`).

    npm install co6

Then:

    var co6 = require('co6');

## Disclaimer

Inspired by `co` and `Bluebird`.

* https://github.com/tj/co
* https://github.com/petkaantonov/bluebird

Thank you [Benjamin Gruenbaum](https://github.com/benjamingr), for your explanations on generators and promises.

## Control Flow

### spawn

The `spawn` function returns a promise which resolves when the generator/iterator has finished. Values yielded by the generator are inspected to enable continuations from other generators/iterators and promises. Effectively, this means that the generator/iterator can have an elegant control flow based on yielded continuations. Example:

    co6.spawn(function *() {
        console.log('Waiting ...');
        return yield delay(1000);
    }).then(function (timeInMilliseconds) {
        console.log('Finished! Waited ' + timeInMilliseconds + 'ms!');
    });

### coroutine

Unlike the `spawn` function which immediately runs a generator, the `coroutine` wraps a generator in a function that can be invoked to run the generator. Effectively this enables a generator to be exposed as a function which returns a promise, and therefore will seamlessly integrate with other promise-based control flow. Example:

    var wait = co6.coroutine(function *(timeInMilliseconds) {
    	console.log('Waiting ...');
    	return yield delay(timeInMilliseconds);
    });
    
    wait(1000).then(function (timeInMilliseconds) {
    	console.log('Finished! Waited ' + timeInMilliseconds + 'ms!');
    });

### main

The `main` function is similar to `spawn`, except for the fact that the returned promise comes with an attached exception handler. When an exception occurs in the generator, the exception is printed to *stdout*. This behaviour makes it particularly suitable as an entry point for a command line application, and is intended to be used for that purpose. Example:

    co6.main(function *() {
    	console.log('Waiting ...');
    	yield delay(1000);
    	throw new Error('Show me the exception stack trace!');
    });

## Promisification

### promisify

The `promisify` function encapsulates a continuation-passing style function (that is, a function with a callback parameter) which returns a promise. This means that a continuation-passing style function is, effectively, converted to a promise-based function. The `(error, result)` callback pattern is assumed, but `error` can be omitted (as is the case with `fs.exists`, for example). It is useful to enable the use of existing continuation-passing style functions with generators and promises. Example:

    var fs = require('fs');
    
    var readFile = co6.promisify(fs.readFile);
    
    co6.main(function *() {
    	console.log('Waiting for the file contents ...');
    	var contents = yield readFile('index.js', 'utf8');
    	console.log('Done! These are the file contents:');
    	console.log(contents);
    });

### promisifyAll

Like the `promisify` function, the `promisifyAll` function encapsulates continuation-passing style function. The main difference, however, is that `promisfyAll` operates on an existing object and adds a promise-based equivalent of each function. These are suffixed with `Async`. Effectively, this enables the use of continuation-passing style libraries with generators and promises. Example:

    var fs = require('fs');
    
    co6.promisifyAll(fs);
    
    co6.main(function *() {
    	console.log('Waiting for the file contents ...');
    	var contents = yield fs.readFileAsync('index.js', 'utf8');
    	console.log('Done! These are the file contents:');
    	console.log(contents);
    });

## Helpers

### parallel

~Coming soon~

### series

~Comin soon~

## Alternative Promises

`co6` uses `harmony` promises by default. This can be overriden with another implementation, like this:

    co6.Promise = require('bluebird');

The `bluebird` library is absolutely worthwhile, so check it out if you are interested in a different implementation.
