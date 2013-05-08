var path = require('path');
var less = require('less');
var promise = require('../util/promise');

var Parser = less.Parser;

module.exports = function (grunt) {
    var minify   = grunt.config('compress');
    var rootpath = grunt.config('rootpath');
    var dest     = grunt.config('dest');
    var src      = grunt.config('src');

    function Builder (id) {
        var self = this;
        var defer = promise.Deferred();

        this.id = id;
        this.content = grunt.file.read(src + id);
        this.ready = defer.done;
        this.fail = defer.fail;

        var parser = new Parser({
            compress: minify,
            yuicompress: false,
            optimization: 1,
            silent: false,
            lint: false,
            color: true,
            strictImports: false,
            rootpath: rootpath,
            relativeUrls: true,
            strictMaths: true,
            paths: [src, path.dirname(path.resolve(src + id))]
        });

        parser.parse(this.content, function (err, tree) {
            if (err) {
                return defer.reject(err.message);
            }

            var imports = Object.keys(parser.imports.files)
                .map(function (file) {
                    return path.resolve(file).replace(path.resolve(src) + '/', '');
                });
            var children = [];

            // 图片也算是一种children
            children = children.concat(imports);

            self.getChildren = function () {
                return children;
            };

            self.build = function () {
                grunt.file.write(dest + id, tree.toCSS({
                    compress: minify
                }));

                return promise.Deferred().resolve([id]);
            };

            self.isCmbFile = function () {
                return !!children.length;
            };

            defer.resolve();
        });
    }

    return Builder;
};