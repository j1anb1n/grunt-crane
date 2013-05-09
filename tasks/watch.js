var mtimes = {};

module.exports = function(grunt) {
    var fs = require('fs');
    grunt.registerTask('watch', function() {
        this.requiresConfig('watch');

        var src = grunt.config('src');

        var files = {};
        var timer = null;
        var done = this.async();

        grunt.log.subhead('Waiting...');

        getFiles().forEach(watchFile);

        timer = setInterval(function () {
            grunt.util._.difference(getFiles(), Object.keys(files))
                .forEach(function (file) {
                    grunt.log.writeln('ADD: '.blue + file);
                    onChange(file);
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
                files[file] = fs.watch(file, function () {
                    onChange(file);
                });
            }
        }
        function onChange (file) {
            if (!fs.existsSync(file)) {
                files[file].close();
                grunt.log.writeln('REMOVE '.red + file);
                delete files[file];
                delete mtimes[file];
                return;
            }

            var mtime = +fs.statSync(file).mtime;

            if (mtimes[file] === mtime) {
                return;
            }

            clearInterval(timer);

            Object.keys(files).forEach(function (file) {
                files[file].close();
            });

            grunt.task.run(['build:' + file.replace(src, ''), 'deploy', 'watch']);

            done();
        }
    });
};
