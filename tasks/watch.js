var mtimes = {};
module.exports = function(grunt) {
    var fs = require('fs');

    grunt.registerTask('watch', function() {
        this.requiresConfig('watch');

        var watch = grunt.config.getRaw('watch');
        var src = grunt.config('src');
        var nameArgs = this.nameArgs;

        var files = {};
        var timer = null;
        var done = this.async();

        grunt.log.write('Waiting...');

        getFiles().forEach(watchFile);

        timer = setInterval(function () {
            grunt.util._.difference(getFiles(), Object.keys(files))
                .forEach(function (file) {
                    console.log(file, 'add'.blue);
                    watchFile(file);
                });
        }, 200);

        function getFiles () {
            return grunt.file.expand({
                filter: function (file) {
                    return grunt.file.isFile(file);
                }
            }, src + '**/*');
        }

        function watchFile (file) {
            if (!files[file]) {
                files[file] = fs.watch(file, function (e) {
                    if (!fs.existsSync(file)) {
                        files[file].close();
                        console.log(file, 'removed'.red);
                        delete files[file];
                        delete mtimes[file];
                    } else {
                        var mtime = +fs.statSync(file).mtime;
                        if (mtimes[file] === mtime) {
                            return;
                        }
                        mtimes[file] = mtime;
                        clearInterval(timer);

                        Object.keys(files).forEach(function (file) {
                            files[file].close();
                        });

                        var taskList = watch.tasks.map(function (task) {
                            return grunt.template.process(task, {
                                data: grunt.util._.merge({file: file.replace(src, '')}, grunt.config())
                            });
                        })

                        grunt.task.run(taskList);

                        grunt.task.run(nameArgs);
                        done();
                    }
                });
            }
        }
    });
};
