var promise = require('../util/promise');

module.exports = function () {
    function Builder(id) {
    }

    Builder.prototype.build = function () {
        return promise.Deferred().resolve([]);
    };

    Builder.prototype.ready = function (cb) {
        cb();
        return this;
    };

    Builder.prototype.fail = function () {
        return this;
    };



    return Builder;
};