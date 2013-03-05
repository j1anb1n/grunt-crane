module.exports = function (grunt) {
    var from    = grunt.config('src');
    var to      = grunt.config('dest');

    grunt.registerTask('copy', function () {
        var files = [].slice.call(arguments);

        files.forEach(function (file) {
            grunt.file.copy(from + file, to + file);
        });
    });
};
