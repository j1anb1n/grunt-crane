var Parser = require('less').Parser;
var path = require('path');

module.exports = function (grunt) {
    var minify  = grunt.config('minify');
    var from    = grunt.config('src');
    var to      = grunt.config('dest');
    var mapFile = grunt.config('temp') + '/less_cmb_map.json';
    var map     = {
        "child": {},
        "parent": {}
    };

    try {
        map = grunt.file.readJSON(mapFile);
    } catch (ex) {
        grunt.file.write(mapFile, map);
    }

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
                var imports = Object.keys(parser.imports.files).map(function (file) {
                    return path.resolve(file).replace(path.resolve(from) + '/', '');
                });
                imports.forEach(function (file) {
                    var child = map.child[file];
                    if (child && Array.isArray(child) && child.indexOf(id) === -1) {
                        child.push(id);
                    } else {
                        map.child[file] = [id];
                    }
                });

                // if an `@import` was deleted, then it should be removed from the map
                if (map.parent[id]) {
                    map.parent[id].filter(function (child) {
                        return imports.indexOf(child) === -1;
                    }).forEach(function (file) {
                        var child = map.child[file];
                        if (child && Array.isArray(child) && child.indexOf(id) !== -1) {
                            child.splice(child.indexOf(id), 1);
                            if (!child.length) {
                                delete map.child[file];
                            }
                        }
                    });
                }
                if (imports.length) {
                    map.parent[id] = imports;
                } else {
                    delete map.parent[id];
                }

                grunt.file.write(mapFile, JSON.stringify(map, null, 4));

                if (map.child[id] && map.child[id].length) {
                    grunt.task.run(map.child[id].map(function (file) { return 'build-less:' + file; }));
                }

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