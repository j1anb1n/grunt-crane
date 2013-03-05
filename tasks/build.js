module.exports = function (grunt) {
    var builders = grunt.config.getRaw('builder');
    var src = grunt.config('src');
    var compress = grunt.config('compress');
    grunt.registerTask('build', 'The Builder', function () {
        var files = [].slice.call(arguments);
        var tasks = {};

        if (!files.length) {
            files = grunt.file.expand({filter: function (path) {
                return grunt.file.isFile(path);
            }}, src + '**/*').map(function (path) {
                return path.replace(src, '');
            });
        } else {
            var dirs = files.filter(function (file) {
                return grunt.file.isDir(src + file);
            });

            files = grunt.util._.difference(files, dirs);

            files = files.concat(grunt.util._.flatten(dirs.map(function (dir) {
                return grunt.file.expand({
                    filter: function (path) {
                        return grunt.file.isFile(path);
                    }
                }, src + dir + '/**/*').map(function (path) {
                    return path.replace(src, '');
                })
            })));
        }

        files.forEach(function (file) {
            var stack = [];
            for (var i = 0; i < builders.length; i++) {
                if (grunt.file.isMatch(builders[i][0], file)) {
                    stack = builders[i].slice(1);
                    break;
                }
            }
            if (stack.length) {
                grunt.task.run(stack.map(function (task) {
                    return grunt.template.process(task, {data: {
                        file: file,
                        compress: compress
                    }}).trim();
                }).filter(function (task) {
                    return !!task;
                }));
            }
        });
    });
};