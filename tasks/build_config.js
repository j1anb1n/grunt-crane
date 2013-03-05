var fs = require('fs');

module.exports = function (grunt) {
    var expire  = grunt.config('cache-expire');
    var from    = grunt.config('src');
    var to      = grunt.config('dest');

    grunt.registerTask('build-config', 'Update config', function () {
        var config  = grunt.file.readJSON(from + 'config.js');
        var now     = Date.now();

        config.versions = config.versions || {};

        Object.keys(config.versions).forEach(function (file) {
            if (now - config.versions[file] > expire) {
                delete config.versions[file];
            }
        });

        var files = [].slice.call(arguments);

        files.forEach(function (file) {
            var mtime = fs.statSync(from + file).mtime;
            config.versions[file] = +mtime/1000 % expire;
        });

        grunt.file.write(to + 'config.js', 'G.config(' + JSON.stringify(config) + ');');
    });
};