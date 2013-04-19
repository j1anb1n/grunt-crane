module.exports = function (grunt) {
    var builders  = grunt.config.getRaw('builder');
    var src       = grunt.config('src');
    var compress  = grunt.config('compress');
    var taskToken = grunt.option('task') || 'temp';
    var db        = grunt.db;

    grunt.registerTask('build', function () {
        var files = [].slice.call(arguments);

        if (!files.length) {
            files = grunt.file
                .expand({filter: function (path) {
                    return grunt.file.isFile(path);
                }}, src + '**/*')
                .map(function (path) {
                    return path.replace(src, '');
                });
        } else {
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

        var additionalFiles = [];
        files.forEach(function (file) {
            additionalFiles = additionalFiles.concat(
                Object.keys(db.files)
                    .filter(function (f) {
                        return db.files[f].indexOf(file) !== -1;
                    })
            );
        });

        db.tasks[taskToken] = {
            submitFiles: files,
            additionalFiles: additionalFiles,
            files: files.concat(additionalFiles)
        };

        files = db.tasks[taskToken].files;

        files.forEach(function (file) {
            var stack = [];
            for (var i = 0; i < builders.length; i++) {
                if (grunt.file.isMatch(builders[i][0], file)) {
                    stack = builders[i].slice(1);
                    break;
                }
            }
            if (stack.length) {
                grunt.task
                    .run(
                        stack
                            .map(function (task) {
                                return grunt.template
                                    .process(task,
                                        {
                                            data: {
                                                file: file,
                                                compress: compress
                                            }
                                        }
                                    )
                                    .trim();
                            })
                            .filter(function (task) {
                                return !!task;
                            })
                    );
            }
        });
    });
};