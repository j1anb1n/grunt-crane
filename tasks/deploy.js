var rsync = require('../util/rsync');
var promise = require('../util/promise');

module.exports = function (grunt) {
    var config = grunt.config('deploy');
    var reportDir = 'reports/';

    grunt.registerTask('deploy', function (report) {
        var done = this.async();

        if (report) {
            try {
                report = grunt.file.readJSON(reportDir + report);
            } catch (ex) {
                return grunt.log.error('report file not found');
            }
        } else {
            report = grunt.config('report');
        }

        if (!report) {
            grunt.log.error('report not found');
            return;
        }

        var files = Object.keys(report.build);

        var env = grunt.option('env') || 'local';

        var servers = config[env];

        var defers = servers.map(function (args) {
            var defer = promise.Deferred();

            if (!files.length) {
                grunt.log.ok('no file');
                return;
            }

            args = files.concat(args);

            var cmd = 'rsync ' + args.join(' ');
            try {
                rsync(args, function (error, msg) {
                    if ( error ) {
                        grunt.log.writeln(msg.red);
                        grunt.log.error(cmd.red);
                        defer.reject();
                    } else {
                        grunt.log.writeln(msg.green);
                        grunt.log.ok(cmd.green);
                        defer.resolve();
                    }
                }, {cwd: grunt.config(['dest'])});
            } catch (ex) {
                grunt.log.writeln('\n'+ex.toString().red);
                defer.reject();
            }

            return defer.promise();
        });

        promise.when(defers)
            .done(function () {
                done(true);
            })
            .fail(function () {
                done(false);
            });
    });
};