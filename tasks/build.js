var fs = require('fs');
var promise = require('../util/promise');

module.exports = function ( grunt ) {
    var builders  = grunt.config.getRaw('builder');
    var src       = grunt.config('src');
    var dest      = grunt.config('dest');
    var compress  = grunt.config('compress');
    var taskToken = grunt.option('task') || 'temp';
    var db        = grunt.db;

    grunt.registerTask('build', function () {
        var files = [].slice.call( arguments );
        grunt.config('report', {
            token: taskToken
        });
        var report = grunt.config('report');

        /* 整理文件列表 */

        //如果没有提供文件列表则编译全部文件
        if (!files.length) {
            files = grunt.file
                .expand({filter: function (path) {
                    return grunt.file.isFile(path);
                }}, src + '**/*')
                .map(function (path) {
                    return path.replace(src, '');
                });
        } else {
            // 如果有文件夹，则取出该文件夹下的所有文件
            var dirs = files.filter(function (file) {
                return grunt.file.isDir(src + file);
            });

            files = grunt.util._.difference(files, dirs);

            files = files.concat(grunt.util._.flatten(dirs.map(function (dir) {
                return grunt.file
                    .expand({
                        filter: function (path) {
                            return grunt.file.isFile(path);
                        }
                    }, src + dir + '/**/*')
                    .map(function (path) {
                        return path.replace(src, '');
                    });
            })));
        }

        /* 初始化builders */
        builders = builders.map(function (builder) {
            return [builder[0], require('../' + builder[1])(grunt)];
        });

        /* 检查被影响到的额外文件 */
        var searchList = files;
        var allFiles = grunt.db.files;
        var allFilesKey = Object.keys(allFiles);

        while(searchList.length) {
            searchList = searchList.reduce(function (list, search) {
                if (files.indexOf(search) === -1) {
                    files.push(search);
                }

                allFilesKey
                    .filter(function (f) {
                        if (!allFiles[f].children) {
                            return false;
                        }

                        return allFiles[f].children.indexOf(search) !== -1 &&
                            files.indexOf(f) === -1 &&
                            list.indexOf(f) === -1;
                    })
                    .forEach(function (f) {
                        // push 至list内以供下次搜索
                        list.push(f);
                    });

                return list;
            }, []);
        }

        var defers = [];
        files.forEach(function (file) {
            var Builder, defer;
            for (var i = 0; i < builders.length; i++) {
                if (grunt.file.isMatch(builders[i][0], file)) {
                    Builder = builders[i][1];
                    break;
                }
            }

            if (!Builder) {
                return;
            }

            if (!grunt.db.files[file]) {
                grunt.db.files[file] = {};
            }

            var builder = new Builder(file);
            var defer = promise.Deferred();

            defer
                .fail(function (msg) {
                    grunt.log.error('BUILD FAIL: ['+file+']', msg);
                })
                .done(function () {
                    grunt.log.ok('BUILD PASS:[' + file + ']');
                });

            defers.push(defer);
            builder
                .ready(function () {
                    if (builder.isCmbFile && builder.isCmbFile(file)) {
                        grunt.db.files[file].children = builder.getChildren(file);
                    }

                    try {
                        builder.build();
                    } catch (ex) {
                        return defer.reject(ex.message);
                    }

                    // 取生成的文件时间戳为版本号
                    if (fs.existsSync(dest + file)) {
                        grunt.db.files[file].version = +fs.statSync(dest + file).mtime % grunt.config('cache-expire');
                    }

                    defer.resolve();
                })
                .fail(function (msg) {
                    defer.reject(msg);
                });
        });

        var done = this.async();

        // 整理日志

        report.files = files;

        promise.when(defers)
            .always(function () {
                done();
                grunt.db.save();
                grunt.log.write(JSON.stringify(report, null, 4));
            });
    });
};