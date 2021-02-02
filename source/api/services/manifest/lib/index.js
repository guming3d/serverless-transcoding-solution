/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let AWS = require('aws-sdk');

let manifest = require('./manifest.js');

module.exports.respond = function(event, cb) {

    let _authCheckPayload = {
        authcheck: ['admin', 'member'],
        authorizationToken: event.authorizationToken
    };

    let _response = '';

    // invoke serverless-video-transcode-admin-service function to verify if user has
    // proper role for requested action
    let params = {
        FunctionName: 'serverless-video-transcode-admin-service',
        InvocationType: 'RequestResponse',
        LogType: 'None',
        Payload: JSON.stringify(_authCheckPayload)
    };
    let lambda = new AWS.Lambda();
    lambda.invoke(params, function(err, data) {
        if (err) {
            console.log(err);
            return cb(err, null);
        }

        let _ticket = JSON.parse(data.Payload);
        console.log('Authorization check result: ' + _ticket.auth_status);
        if (_ticket.auth_status === 'authorized') {

            let _manifest = new manifest();

            if (event.operation === 'import') {
                _manifest.import(event, cb);
            } else if (event.operation === 'generate') {
                _manifest.generate(event, cb);
            } else {
                return cb('Invalid operation request to manifest service.', null);
            }

        } else {
            return cb({
                error: {
                    message: 'User is not authorized to perform the requested action.'
                }
            }, null);
        }

    });

}
