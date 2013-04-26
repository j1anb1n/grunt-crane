var path = require('path');

exports.parseURL = function (url) {
    return {
        href: url,
        ext: path.extname(url),
    };
};
