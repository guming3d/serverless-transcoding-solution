/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let https = require('https');

/**
 * Helper function to interact with dynamodb for Serverless Video Transcode cfn custom resource.
 *
 * @class metricsHelper
 */
let metricsHelper = (function() {

    /**
     * @class metricsHelper
     * @constructor
     */
    let metricsHelper = function() {};

    /**
     * Sends opt-in, anonymous metric.
     * @param {json} metric - metric to send to opt-in, anonymous collection.
     * @param {sendAnonymousMetric~requestCallback} cb - The callback that handles the response.
     */
    metricsHelper.prototype.sendAnonymousMetric = function(metric, cb) {

        let _options = {
            hostname: 'metrics.awssolutionsbuilder.com',
            port: 443,
            path: '/generic',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        let request = https.request(_options, function(response) {
            // data is streamed in chunks from the server
            // so we have to handle the "data" event
            let buffer;
            let data;

            response.on('data', function(chunk) {
                buffer += chunk;
            });

            response.on('end', function(err) {
                data = buffer;
                cb(null, data);
            });
        });

        if (metric) {
            request.write(JSON.stringify(metric));
        }

        request.end();

        request.on('error', (e) => {
            console.error(e);
            cb(['Error occurred when sending metric request.', JSON.stringify(metric)].join(' '), null);
        });
    };

    return metricsHelper;

})();

module.exports = metricsHelper;
