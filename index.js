module.exports = {
    builder: {
        'javascript': require('./builder/javascript'),
        'css': require('./builder/css'),
        'copy': require('./builder/copy'),
        'config': require('./builder/config'),
        'sass': require('./builder/sass'),
        'nothing': require('./builder/nothing'),
        'template': require('./builder/template'),
        'less': require('./builder/less')
    },
    util: {
        promise: require('./util/promise')
    }
};