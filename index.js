'use strict';
module.exports.coroutine = coroutine;
module.exports.main = main;
module.exports.parallel = parallel;
module.exports.Promise = typeof Promise === 'undefined' ? undefined : Promise;
module.exports.promisify = promisify;
module.exports.promisifyAll = promisifyAll;
module.exports.series = series;
module.exports.spawn = spawn;

/**
 * Returns a function which accepts arguments and returns a promise.
 * @param {Generator} gen
 * @return {function(...[*]): Promise}
 * @see spawn
 */
function coroutine(gen) {
  return function() {
    return spawn(gen.apply(this, arguments));
  };
}

/**
 * Returns a promise with error handling. Intended to be used as main function.
 * @param {Generator} gen
 * @return {Promise}
 * @see spawn
 */
function main(gen) {
  return spawn(gen).then(function(result) {
    return result;
  }, function(err) {
    console.log(err.stack || err);
  });
}

/**
 * Returns a promise which resolves when the generator/iterator has finished.
 * @param {Generator|Iterator} it
 * @return {Promise}
 */
function spawn(it) {
  if (isGenerator(it)) it = it();
  return (module.exports.Promise).resolve().then(function next(value) {
    var state = it.next(value);
    var x = state.value;
    if (state.done) return (module.exports.Promise).resolve(x);
    if (isGenerator(x) || isIterator(x)) x = spawn(x);
    if (isYieldableArray(x)) x = parallel(x);
    return isPromise(x) ? x.then(next, it.throw.bind(it)) : next(x);
  });
}

// --

/**
 * Returns a function which encapsulates the function and returns a promise.
 * @param {function(...[*]): *} fn
 * @return {function(...[*]): Promise}
 */
function promisify(fn) {
  return function() {
    var that = this;
    var len = arguments.length;
    var args = new Array(len + 1);
    for (var i = 0; i < len; i++) args[i] = arguments[i];
    return new (module.exports.Promise)(function(resolve, reject) {
      args[len] = function(err, result) {
        if (isErrorAnachronism(err)) return resolve(err);
        if (err) return reject(err);
        resolve(result);
      };
      fn.apply(that, args);
    });
  };
}

/**
 * Returns the object with added promise-based function variants.
 * @param {Object} obj
 * @return {Object}
 * @see promisify
 */
function promisifyAll(obj) {
  for (var key in obj) {
    if (typeof obj[key] === 'function' && !/Async$/.test(key)) {
      obj[key + 'Async'] = promisify(obj[key]);
    }
  }
  return obj;
}

// --

/**
 * Returns a promise which resolves when each item is resolved in parallel.
 * @param {Array.<Generator|Iterator|Promise>} arr
 * @return {Promise}
 */
function parallel(arr) {
  var promise = (module.exports.Promise).resolve();
  arr.forEach(function(value) {
    var task = isPromise(value) ? value : spawn(value);
    promise = promise.then(function() {
      return task;
    });
  });
  return promise;
}

/**
 * Returns a promise which resolves when each item is resolved in series.
 * @param {Array.<Generator|Iterator|Promise>} arr
 * @return {Promise}
 */
function series(arr) {
  var promise = (module.exports.Promise).resolve();
  arr.forEach(function(value) {
    promise = promise.then(function() {
      return isPromise(value) ? value : spawn(value);
    });
  });
  return promise;
}

// --

/**
 * Determines if the value is an error anachronism.
 * @param {*} v
 * @return {boolean}
 */
function isErrorAnachronism(v) {
  return v !== null &&
    typeof v !== 'undefined' &&
    typeof v !== 'string' &&
    !(v instanceof Error);
}

/**
 * Determines if the value is a generator.
 * @param {*} v
 * @return {boolean}
 */
function isGenerator(v) {
  return v && v.constructor && v.constructor.name === 'GeneratorFunction';
}

/**
 * Determines if the value is an iterator.
 * @param {*} v
 * @return {boolean}
 */
function isIterator(v) {
  return v && typeof v.next === 'function' && typeof v.throw === 'function';
}

/**
 * Determines if the value is a promise.
 * @param {*} x
 * @return {boolean}
 */
function isPromise(x) {
  return x && typeof x.then === 'function';
}

/**
 * Determines if the value is a yieldable array.
 * @param {*} v
 * @return {boolean}
 */
function isYieldableArray(v) {
  return v && Array.isArray(v) && v.every(function(i) {
    return isGenerator(i) || isIterator(i) || isPromise(i);
  });
}
