var Parser  = require('less').Parser;
var path    = require('path');

module.exports = function (grunt) {
    var minify  = grunt.option('compress') || false;
    var from    = grunt.config('src');
    var to      = grunt.config('dest');

    grunt.registerTask('build-less', 'Compile Less File.', function () {
        var files = [].slice.call(arguments);
        var done = this.async();
        var len = files.length;

        files.forEach(function (id) {
            var parser  = new Parser({
                compress: minify,
                yuicompress: false,
                optimization: 1,
                silent: false,
                lint: false,
                color: true,
                strictImports: false,
                rootpath: '',
                relativeUrls: true,
                strictMaths: true,
                paths: [from, path.dirname(path.resolve(from + id))]
            });

            parser.parse(grunt.file.read(from + id), function (err, tree) {
                if (err) {
                    grunt.log.error(err.message);
                    return done(false);
                }
                var imports = Object.keys(parser.imports.files)
                    .map(function (file) {
                        return path.resolve(file).replace(path.resolve(from) + '/', '');
                    });


                try {
                    grunt.file.write(to + id, tree.toCSS({
                        compress: minify
                    }));
                    grunt.log.ok('Build Success: '.green+id);
                } catch (ex) {
                    grunt.log.error(ex.message.red);
                }

                if (!--len) {
                    done(true);
                }
            });
        });
    });
};