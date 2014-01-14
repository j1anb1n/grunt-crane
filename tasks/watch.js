var path = require('path');
var spawn = require('child_process').spawn;
var Gaze = require('gaze').Gaze;

module.exports = function(grunt) {
    grunt.registerTask('watch', function() {
        this.requiresConfig('watch');

        var src = grunt.config('src');

        this.async();

        var gaze = new Gaze(src + '/**/*');

        grunt.log.subhead('Watching...');

        gaze.on('all', function (event, filepath) {
            filepath = filepath.replace(path.resolve(src) + '/', '');
            grunt.log.writeln('%s: %s', event.toUpperCase(), filepath);

            if (event !== 'deleted') {
                build(filepath);
            }
        });

        function build(file) {
            var child = spawn('grunt', ['build:' + file]);
            var output = '', errorMsg = '';

            child.stdout.on('data', function (data) {
                output += data;
            });

            child.stderr.on('data', function (data) {
                errorMsg += data;
            });

            child.on('exit', function (code) {
                if (code !== 0) {
                    grunt.log.error(errorMsg || output);
                    return;
                }
                grunt.log.writelns(output);
            });
        }
    });
};
