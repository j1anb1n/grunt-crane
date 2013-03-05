var REQUIRE_RE = /[^.]\s*require\s*\(\s*(["'])([^'"\s\)]+)\1\s*\)/g;

module.exports = function (grunt) {
    var minify  = grunt.config('minify');
    var from    = grunt.config('src');
    var to      = grunt.config('dest');

    grunt.registerTask('build-js', 'Transport js files', function () {
        var files = [].slice.call(arguments);

        files.forEach(builder);
    });

    function builder (id) {
        var content = grunt.file.read(from + id);
        var deps = [];
        REQUIRE_RE.lastIndex = 0;

        while((match = REQUIRE_RE.exec(content))) {
            deps.push(match[2]);
        }

        deps = JSON.stringify(deps);

        content = 'define("' + id + '", ' + deps + ', function (require, exports, module) {\n' + content + '\n})';

        if (minify) {
            content = grunt.helper('uglify', content);
        }

        grunt.file.write(to + id, content);
    }
};