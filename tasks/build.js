var fs = require('fs');
var promise = require('../util/promise');

module.exports = function ( grunt ) {
    var src       = grunt.config('src');
    var dest      = grunt.config('dest');
    var taskToken = grunt.option('token') || Date.now();

    try {
        grunt.db = grunt.file.readJSON('db.json');
    } catch (ex) {
        grunt.db = {
            files: {}
        };
    }

    grunt.db.save = function () {
        grunt.file.write('db.json', JSON.stringify(grunt.db, null, 4));
    };

    grunt.db.save();

    var builders  = grunt.config.getRaw('builder').map(function (builder) {
        return [builder[0], require('../' + builder[1])(grunt)];
    });

    grunt.registerTask('build', function () {
        var files = [].slice.call( arguments );
        var report = {
            token: taskToken
        };

        /* 整理文件列表 */

        // 如果没有提供文件列表则编译全部文件
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

        report.input = [].concat(files);

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

        report.files = files;

        /* 开始编译 */
        report.build = {};
        report.fail  = {};

        // 将config.json移到到每次编译的末尾
        files = grunt.util._.without(files, 'config.json');
        files.push('config.json');

        var defers = files.map(function (file) {
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

            builder
                .ready(function () {
                    if (builder.isCmbFile && builder.isCmbFile(file)) {
                        grunt.db.files[file].children = builder.getChildren(file);
                    }
                    builder.build()
                        .done(function (fileList) {
                            fileList.forEach(function (file) {
                                if (!fs.existsSync(dest + file)) {
                                    return;
                                }

                                var timestamp = +fs.statSync(dest + file).mtime;

                                grunt.db.files[file] = grunt.db.files[file] || {};

                                grunt.db.files[file].timestamp = timestamp;
                                report.build[file] = {'timestamp' : timestamp};
                            });

                            defer.resolve();
                        })
                        .fail(function (msg) {
                            report.fail[file] = msg;
                            defer.reject(msg);
                        });
                })
                .fail(function (msg) {
                    defer.reject(msg);
                });

            return defer;
        });

        var done = this.async();

        promise.when(defers)
            .fail(function () {
                done(false);
            })
            .done(function () {
                grunt.config('report', report);
                done(true);
            })
            .always(function () {
                grunt.db.save();

                grunt.file.write('reports/' + report.token, JSON.stringify(report, null, 4));
            });
    });
};