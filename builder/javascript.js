var promise = require('../util/promise');

module.exports = function (grunt) {
    var src  = grunt.config('src');
    var dest = grunt.config('dest');
    var minify = grunt.config('compress');

    function Builder (id) {
        var defer = promise.Deferred();
        this.id = id;
        this.content = grunt.file.read(src + this.id);

        if (this.isCmbFile()) {
            this.children = this.content.split(/\r?\n/).filter(function (file) {
                return !!file;
            });
        }
        this.ready = defer.done;
        this.fail = defer.fail;

        defer.resolve();
    }

    Builder.prototype.getChildren = function () {
        return this.children || [];
    };

    Builder.prototype.isCmbFile = function () {
        return (/cmb\.js$/).test(this.id);
    };

    Builder.prototype.build = function () {
        var defer = promise.Deferred();
        var content = '';

        try {
            if (this.isCmbFile()) {
                content = this.getChildren()
                    .map(function (file) {
                        return builder(file, grunt.file.read(src + file), minify);
                    })
                    .join('\n');
            } else {
                content = builder(this.id, this.content, minify);
            }

            grunt.file.write(dest + this.id, content);
        } catch (ex) {
            return defer.reject(ex.message);
        }

        return defer.resolve([this.id]);
    };

    return Builder;
};

var REQUIRE_RE = /[^.]\s*require\s*\(\s*(["'])([^'"\s\)]+)\1\s*\)/g;

function builder (id, content, minify) {
    var match = [];
    var deps = [];
    REQUIRE_RE.lastIndex = 0;

    while((match = REQUIRE_RE.exec(content))) {
        deps.push(match[2]);
    }

    deps = JSON.stringify(deps);

    content = 'define("' + id + '", ' + deps + ', function (require, exports, module) {\n' + content + '\n})';

    if (minify) {
        return require('uglify').minify(content);
    }

    return content;
}