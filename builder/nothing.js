var promise = require('../util/promise');

module.exports = function () {
    function Builder(id) {
    }

    Builder.prototype.build = function () {
        return promise.Deferred().resolve([]);
    };

    return Builder;
};