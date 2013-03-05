module.exports = function (grunt) {
    var minify  = grunt.config('minify');
    var from    = grunt.config('src');
    var to      = grunt.config('dest');

    grunt.registerTask('build-css', 'Compile css.', function () {
        [].forEach.call(arguments, builder);
    });

    function builder (id) {
        var content = grunt.file.read(from + id);
        if (minify) {
            content = require('sqwish').minify(content);
        }

        grunt.file.write(to+id, content);
    }
};