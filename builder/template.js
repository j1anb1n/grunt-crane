var promise = require('../util/promise');

module.exports = function (grunt) {
    var src = grunt.config('src');
    var dest = grunt.config('dest');

    function Builder(id) {
        this.id = id;
        this.content = grunt.file.read(src + id);
    }

    Builder.prototype.build = function () {
        var fn = new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +

            // Introduce the data as local variables using with(){}
            "with(obj){p.push('" +

            // Convert the template into pure JavaScript
            this.content
                .replace(/[\r\t\n]/g, " ")
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%>/g, "',$1,'")
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'") +
            "');}return p.join('');");

        grunt.file.write(dest + this.id, 'define("'+this.id+'", [], function () { return ' + fn.toString() + '})');

        return promise.Deferred().resolve([this.id]);
    };

    return Builder;
};