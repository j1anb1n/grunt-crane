var promise = require('../util/promise');

module.exports = function (grunt) {
    var src   = grunt.config('src');
    var dest  = grunt.config('dest');

    function Builder(id) {
        this.id = id;
    }

    Builder.prototype.build = function () {
        var defer = promise.Deferred();
        grunt.file.copy(src + this.id, dest + this.id);

        defer.resolve([this.id]);
        return defer.promise();
    };

    return Builder;
};