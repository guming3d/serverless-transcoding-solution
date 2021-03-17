'use strict';

let token = (function() {

    if (!process.env.TRANSCODE_ENDPOINT_HOST) {
        console.error('TRANSCODE_ENDPOINT_HOST environment variable is not defined.');
        process.exit(1);
    }
    if (!process.env.TRANSCODE_TOKEN) {
        console.error('TRANSCODE_TOKEN environment variable is not defined.');
        process.exit(1);
    }
    return process.env.TRANSCODE_TOKEN;

})();

module.exports = token;
