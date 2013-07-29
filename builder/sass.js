var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

var rework = require('rework');
var promise = require('../util/promise');

var IMPORT_RE = /@import\s*([\s\S]*?);/g;

module.exports = function (grunt) {
    var src = grunt.config('src');
    var dest = grunt.config('dest');

    function Builder (id) {
        this.id = id;
        this.content = grunt.file.read(src + id);
        this.children = [];
    }

    Builder.prototype.build = function () {
        var self = this;
        var defer = promise.Deferred();
        var content = fs.readFileSync(src + this.id);
        var match = null;

        var child = spawn('sass', ['-C', src + this.id]);
        var output = '', errorMsg = '';
        child.stdout.on('data', function (chunk) {
            output += chunk;
        });
        child.stderr.on('data', function (chuck) {
            errorMsg += chuck;
        });

        child.on('exit', function (code) {
            if (code !== 0) {
                defer.reject(errorMsg);
                return;
            }
            var content = rework(output)
                    .use(rework.url(function (url) {
                        var p, v;
                        // 外部图片不做处理
                        if (/^https?:\/\//.test(url)) {
                            return url;
                        }

                        // 记录children

                        // ../xxx.jpg or ./xxx.jpg
                        if (url.substr(0, 1) === '.') { // ../xxx.jpg
                            p = path.normalize(path.dirname(self.id) + '/' + url);
                        }
                        // /xxx/xxx/xxx.jpg
                        else if (url.substr(0, 1) === '/') { // /xxx/xxx/xxx.jpg
                            p = url.substr(1);
                        }
                        // xxx.jpg
                        else {
                            p = path.dirname(self.id) + '/' + url;
                        }

                        self.children.push(p);

                        // 标记版本号

                        v = +require('fs').statSync(src + p).mtime % grunt.config('cacheExpire');

                        return url + '?v=' + v;
                    }))
                    .toString();
                grunt.file.write(dest + self.id, content);
                defer.resolve([self.id]);
        });

        while((match = IMPORT_RE.exec(content))) {
            self.children = self.children.concat(match[1].replace(/\n/g, '').split(',').map(function (url) {
                url = url.trim().replace(/('|")(.*)\1/, '$2');
                // ../xxx.jpg or ./xxx.jpg
                if (url.substr(0, 1) === '.') { // ../xxx.jpg
                    url = path.normalize(path.dirname(self.id) + '/' + url);
                }
                // /xxx/xxx/xxx.jpg
                else if (url.substr(0, 1) === '/') { // /xxx/xxx/xxx.jpg
                    url = url.substr(1);
                }
                // xxx.jpg
                else {
                    url = path.dirname(self.id) + '/' + url;
                }
                return url;
            }));
        }

        return defer.promise();
    };

    return Builder;
};