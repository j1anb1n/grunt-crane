var rsync = require('rsyncwrapper').rsync;
var path = require('path');

module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('deploy', function () {
        var files = [].slice.call(arguments);
        var done = this.async();
        var config = grunt.config('deploy');
        var buildDir = grunt.config('dest');

        var env = process.argv.filter(function (arg) {
            return arg.indexOf('--env') === 0;
        }).map(function (arg) {
            return arg.split('=')[1];
        })[0] || 'local';

        var servers = config[env];
        var len = servers.length;

        servers.forEach(function (server) {
            server.args = ["-vazR"];
            server.syncDest = true;

            if (files.length) {
                server.src = grunt.util._.uniq(files.map(function (file) {
                    return path.dirname(buildDir + file);
                })).join(' ');
            } else {
                server.src = buildDir;
            }

            try {
                rsync(server, function (error, stdout, stderr, cmd) {
                    grunt.log.writeln(cmd.grey);

                    if ( error ) {
                        grunt.log.writeln(error.toString().red);
                        grunt.log.error(server.host+' error'.red);
                    } else {
                        grunt.log.write(stdout);
                        grunt.log.ok(server.host+' done'.green);
                    }

                    len --;
                    if (!len) {
                        done(true);
                    }
                });
            } catch (ex) {
                grunt.log.writeln("\n"+ex.toString().red);
                done(false);
            }
        });
    });
};