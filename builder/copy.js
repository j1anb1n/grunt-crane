module.exports = function (grunt) {
    var src   = grunt.config('src');
    var dest  = grunt.config('dest');

    function Builder(id) {
        this.id = id;
    }

    Builder.prototype.build = function () {
        grunt.file.copy(src + this.id, dest + this.id);
    };

    Builder.prototype.ready = function (cb) {
        cb();
        return this;
    };

    Builder.prototype.fail = function () {
        return this;
    }


    return Builder;
};