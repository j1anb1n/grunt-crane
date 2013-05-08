var promise = require('../util/promise');

module.exports = function (grunt) {
    var src   = grunt.config('src');
    var dest  = grunt.config('dest');

    function Builder(id) {
        this.id = id;
    }

    Builder.prototype.build = function () {
        var defer = promise.Deferred();
        var config = grunt.file.readJSON(src + this.id);
        var cacheExpire = grunt.config(['cacheExpire']);

        config.cacheExpire = cacheExpire;
        config.rootpaths = grunt.config(['rootpaths']);
        config.combine = {};
        config.version = {};

        var files = grunt.db.files;
        var lastTimestamp = Date.now() - cacheExpire;

        Object.keys(files).filter(noConfig).forEach(function (name) {
            var file = files[name];

            if (file.timestamp && file.timestamp > lastTimestamp) {
                config.version[name] = file.timestamp % cacheExpire;
            }

            if (file.children && file.children.length && file.children.filter(noImg).length) {
                config.combine[name] = file.children;
            }
        });

        grunt.file.write(dest + this.id, JSON.stringify(config, null, 4));

        var versionTemplate = require('../util/template')(grunt.config.getRaw(['versionTemplate'])).toString();

        grunt.file.write(dest + 'config.js', 'G.config(' + JSON.stringify(config) + ');G.config({versionTemplate:' + versionTemplate + '});');
        defer.resolve([this.id, 'config.js']);
        return defer.promise();
    };

    Builder.prototype.ready = function (cb) {
        cb();
        return this;
    };

    Builder.prototype.fail = function () {
        return this;
    };


    return Builder;
};

function noImg (file) {
    return !(/(jpg|png|jpeg|gif)$/.test(file));
}

function noConfig(file) {
    return file !== 'config.json';
}