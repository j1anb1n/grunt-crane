module.exports = function (grunt) {
    var minify  = grunt.config('minify');
    var src    = grunt.config('src');
    var dest      = grunt.config('dest');

    grunt.registerTask('build-tpl', 'Compile Template.', function () {
        [].forEach.call(arguments, function (file) {
            var content = grunt.file.read(src + file);
            content = builder(content);
            grunt.file.write(dest + file, 'define("'+file+'", [], function () { return ' + content.toString() + '})');
        });
    });

    // Thanks to: http://ejohn.org/blog/javascript-micro-templating/
    function builder (str){
        var fn = new Function("obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};" +

            // Introduce the data as local variables using with(){}
            "with(obj){p.push('" +

            // Convert the template into pure JavaScript
            str
                .replace(/[\r\t\n]/g, " ")
                .split("<%").join("\t")
                .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                .replace(/\t=(.*?)%>/g, "',$1,'")
                .split("\t").join("');")
                .split("%>").join("p.push('")
                .split("\r").join("\\'") +
            "');}return p.join('');");

        return fn;
    };
};