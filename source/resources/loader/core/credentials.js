'use strict';
let Base64 = require('js-base64').Base64;
let moment = require('moment');
let crypto = require('crypto');

let credentials = (function() {

    let credentials = function() {};

    credentials.prototype.getAuthSignature = function() {
        if (!process.env.TRANSCODE_ACCESS_KEY) {
            console.error('TRANSCODE_ACCESS_KEY environment variable is not defined.');
            process.exit(1);
        }

        if (!process.env.TRANSCODE_SECRET_ACCESS_KEY) {
            console.error('TRANSCODE_SECRET_ACCESS_KEY environment variable is not defined.');
            process.exit(1);
        }

        if (!process.env.TRANSCODE_ENDPOINT_HOST) {
            console.error('TRANSCODE_ENDPOINT_HOST environment variable is not defined.');
            process.exit(1);
        }

        // 'SJxiAV_R:f10e347df150638393502dfc8466d18b'
        let kDate = crypto.createHmac('sha256', "TRANSCODE4" + process.env.TRANSCODE_SECRET_ACCESS_KEY)
            .update(moment().utc().format('YYYYMMDD'));

        let kEndpoint = crypto.createHmac('sha256', kDate.digest('base64')).update(process.env.TRANSCODE_ENDPOINT_HOST);

        let kService = crypto.createHmac('sha256', kEndpoint.digest('base64')).update('serverless-video-transcode');

        let kSigning = crypto.createHmac('sha256', kService.digest('base64')).update("serverless-video-transcode4_request");

        let _signature = kSigning.digest('base64');

        let _apiKey = [process.env.TRANSCODE_ACCESS_KEY, _signature].join(':');
        let _authKey = Base64.encode(_apiKey);
        return _authKey;
    };

    return credentials;

})();

module.exports = credentials;
