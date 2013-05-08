var spawn = require('child_process').spawn;

module.exports = function (args, cb, options) {
    var process = spawn('rsync',args, options);
    var stdoutBuffer = '';
    var stderrBuffer = '';

    process.stdout.on('data', function (data) {
        stdoutBuffer += data;
    });

    process.stderr.on('data', function (data) {
        stderrBuffer += data;
    });

    process.on('exit', function (code) {
        var msg = '';
        var err = null;
        if (code !== 0) {
            err = new Error(stderrBuffer);
            msg = stderrBuffer.toString();
        }

        msg = stderrBuffer.toString();

        cb(err, msg);
    });
};