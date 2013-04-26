module.exports = function () {
    function Builder(id) {
    }

    Builder.prototype.build = function () {
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