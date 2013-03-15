var REQUIRE_RE = /[^.]\s*require\s*\(\s*(["'])([^'"\s\)]+)\1\s*\)/g;

module.exports = function (grunt) {
    var minify  = grunt.config('minify');
    var from    = grunt.config('src');
    var to      = grunt.config('dest');
    var mapFile = grunt.config('temp') + '/js_cmb_map.json';

    var map     = {
        "child": {},
        "parent": {}
    };

    try {
        map = grunt.file.readJSON(mapFile);
    } catch (ex) {
        grunt.file.write(mapFile, map);
    }

    grunt.registerTask('build-js', 'Transport js files', function () {
        var files = [].slice.call(arguments);

        files.forEach(builder);
    });

    function builder (id) {
        var content = '';
        if (isCmbFile(id)) {
            var content = buildCmbJS(id);
        } else {
            var content = buildJS(id);
        }

        grunt.file.write(to + id, content);

        if (map.child[id]) {
            map.child[id] = map.child[id]
                .filter(function (f) {
                    if (!grunt.file.exists(from + f)) {
                        delete map.parent[id];
                        return false;
                    }
                    return true;
                });
            grunt.task.run(['build-js:' + map.child[id].join(':')]);
        }
        grunt.file.write(mapFile, JSON.stringify(map, null, 4));
    }

    function buildJS(id) {
        var match = [];
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
        return content;
    }

    function buildCmbJS(id) {
        var content = grunt.file.read(from + id);

        var imports = content.split('\n');
        content = imports
            .filter(function (f) {
                return !!f.trim();
            })
            .map(function (f) {
                if (!grunt.file.exists(from + f)) {
                    throw new Error('File no exist:'+f);
                }
                return buildJS(f);
            })
            .join('\n');

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
            map.parent[id]
                .filter(function (child) {
                    return imports.indexOf(child) === -1;
                })
                .forEach(function (file) {
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
        return content;
    }

    function isCmbFile (id) {
        return (/cmb\.js$/).test(id);
    }
};