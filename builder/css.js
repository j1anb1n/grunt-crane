var path   = require('path');
var rework = require('rework');
var promise = require('../util/promise');

var HTTP_FILE_RE = /^(https?:\/\/.*?\/)/;
var CMB_CSS_RE = /\.cmb.css/;

module.exports = function (grunt) {
    var src  = grunt.config('src');
    var dest = grunt.config('dest');
    var minify = grunt.config('compress');
    var rootpaths = grunt.config('rootpaths');

    function Builder (id) {
        var self = this;
        var defer = promise.Deferred();

        this.id = id;
        this.content = grunt.file.read(src + id);
        this.children = [];
        this.ready = defer.done;
        this.fail = defer.fail;

        if (CMB_CSS_RE.test(this.id)) {
            var images = [];
            this.children = this.content.split(/\r?\n/).map(function (file) {
                if (file.indexOf('.') === 0) {
                    return path.normalize(path.dirname(id) + '/' + file);
                }
                return file;
            });
        } else {
            // 获取css中的图片，记录children
            rework(this.content)
                .use(rework.url(function (url) {
                    var match = url.match(HTTP_FILE_RE);
                    // 外部图片不计入children
                    if (match && rootpaths.indexOf(match[1]) === -1) {
                        return url;
                    }

                    // http://xxx.com/xxx/xxx/xxx.jpg
                    if (match) {
                        return self.children.push(url.replace(match[1], ''));
                    }
                    // ../xxx.jpg or ./xxx.jpg
                    else if (url.substr(0, 1) === '.') { // ../xxx.jpg
                        return self.children.push(path.normalize(path.dirname(self.id) + '/' + url));
                    }
                    // /xxx/xxx/xxx.jpg
                    else if (url.substr(0, 1) === '/') { // /xxx/xxx/xxx.jpg
                        return self.children.push(url.substr(1));
                    }
                    // xxx.jpg
                    else {
                        return self.children.push(path.dirname(self.id) + '/' + url);
                    }
                }));
        }

        this.children = grunt.util._.uniq(this.children);
        defer.resolve();
    }

    Builder.prototype.build = function() {
        var self = this;
        var defer = promise.Deferred();
        var content = '';
        var dirname = path.dirname(this.id) + '/';

        // 合并文件需要fix url
        if (CMB_CSS_RE.test(this.id)) {
            content = this.children
                .map(function (file) {
                    var c = grunt.file.read(src + file);
                    var dir = path.dirname(file) + '/';

                    if (dir.indexOf(dirname) !== 0) {
                        c = rework(c)
                                .use(rework.url(function (url) {
                                    if (url.indexOf('.') === 0) {
                                        url = path.relative(dirname, path.normalize(dir + url));
                                    }

                                    return url;
                                }))
                                .toString();
                    }
                    return c;
                })
                .join('\n');
        } else {
            content = this.content;
        }

        // 添加版本号
        content = rework(content)
            .use(rework.url(function (url) {
                var match = url.match(HTTP_FILE_RE);
                var filepath;
                if (match && rootpaths.indexOf(match[1]) === -1) {
                    return url;
                }

                // 获取文件的路径
                if (match) {
                    filepath = url.replace(match[1], '');
                } else {
                    filepath = path.normalize(path.dirname(self.id) + '/' + url);
                }

                return grunt.template.process(grunt.config.getRaw('versionTemplate'), {
                    data: {
                        version: +require('fs').statSync(src + filepath).mtime % grunt.config('cacheExpire'),
                        url: require('../util/url').parseURL(url)
                    }
                });
            }))
            .toString();

        grunt.file.write(dest + this.id, content);

        return defer.resolve([this.id]);
    };

    Builder.prototype.isCmbFile = function() {
        return true;
    };

    Builder.prototype.getChildren = function() {
        return this.children || [];
    };

    return Builder;
};