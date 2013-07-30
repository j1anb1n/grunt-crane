var STATUS = exports.STATUS = {
    PENDING: 'pending',
    DONE   : 'done',
    FAIL   : 'fail'
};

var Deferred = exports.Deferred = function () {
    var PENDING = STATUS.PENDING;
    var DONE    = STATUS.DONE;
    var FAIL    = STATUS.FAIL;

    var state = PENDING;
    var callbacks = {
            'done'  : [],
            'fail'  : [],
            'always': []
        };

    var args = [];
    var thisArg = {};

    var pub = {
        done: function (cb) {
            if (state === DONE) {
                setTimeout(function () {
                    cb.apply(thisArg, args);
                }, 0);
            }

            if (state === PENDING) {
                callbacks.done.push(cb);
            }
            return pub;
        },
        fail: function (cb) {
            if (state === FAIL) {
                setTimeout(function () {
                    cb.apply(thisArg, args);
                }, 0);
            }

            if (state === PENDING) {
                callbacks.fail.push(cb);
            }
            return pub;
        },
        always: function (cb) {
            if (state !== PENDING) {
                setTimeout(function () {
                    cb.apply(thisArg, args);
                }, 0);
                return;
            }

            callbacks.always.push(cb);
            return pub;
        },
        resolve: function () {
            if (state !== PENDING) {
                return pub;
            }

            args  = [].slice.call(arguments);
            state = DONE;
            dispatch(callbacks.done);
            return pub;
        },
        reject: function () {
            if (state !== PENDING) {
                return pub;
            }

            args  = [].slice.call(arguments);
            state = FAIL;
            dispatch(callbacks.fail);
            return pub;
        },
        state: function () {
            return state;
        },
        promise: function () {
            var ret = {};
            Object.keys(pub).forEach(function (k) {
                if (k === 'resolve' || k === 'reject') {
                    return;
                }
                ret[k] = pub[k];
            });
            return ret;
        }
    };

    function dispatch(cbs) {
        /*jshint loopfunc:true*/
        var cb;
        while( (cb = cbs.shift()) || (cb = callbacks.always.shift()) ) {
            setTimeout( (function ( fn ) {
                return function () {
                    fn.apply( {}, args );
                };
            })( cb ), 0 );
        }
    }

    return pub;
};

exports.when = function ( defers ){
    if ( !Array.isArray( defers) ) {
        defers = [].slice.call(arguments);
    }
    var ret     = Deferred();
    var len     = defers.length;
    var isAllFinished = false;
    var count   = 0, allCount = 0;
    var results = [];

    var dispatchAllFinished = (function () {
        var queue = [];
        return function (cb) {
            if (cb) {
                queue.push(cb);
            }

            if (isAllFinished) {
                while ((cb = queue.shift())) {
                    setTimeout((function (fn) {
                        return function () {
                            fn.apply({}, results);
                        };
                    })(cb), 0);
                }
            }
        };
    })();

    if (!len) {
        return ret.resolve().promise();
    }

    defers.forEach(function (defer, i) {
        defer
            .fail(function () {
                ret.reject.apply(ret, arguments);
                results[i] = [].slice.call(arguments);
            })
            .done(function () {
                if (++count === len) {
                    ret.resolve.apply(ret, arguments);
                }
                results[i] = [].slice.call(arguments);
            })
            .always(function () {
                allCount++;
                if (allCount === len) {
                    isAllFinished = true;
                    dispatchAllFinished();
                }
            });
    });

    ret.all = {
        finish: function (cb) {
            dispatchAllFinished(cb);
        }
    };

    return ret.promise();
};