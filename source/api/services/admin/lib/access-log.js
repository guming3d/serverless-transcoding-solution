/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let AWS = require('aws-sdk');
let _ = require('underscore');
let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials

const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};

/**
 * AccessLog receives a set of informaiton related to an access event in the microservice.
 * AccessLog will wrap the access event information in an appropriate event message and invoke
 * the Serverless Video Transcode logging microservice for delivery to the Serverless Video Transcode audit log in Amazon
 * CloudWatch logs.
 *
 * @class AccessLog
 */
let AccessLog = (function() {

    /**
     * @class AccessLog
     * @constructor
     */
    let AccessLog = function() {};

    /**
     * Builds access log event message and invokes logging microservice to record the
     * access event to the Serverless Video Transcode audit log.
     * @param {string} eventid - Request id of the event.
     * @param {string} servicename - Name of the microservice executing the request.
     * @param {string} userid - Username of the authenticate user send the request.
     * @param {string} operation - Description of the action executed by the request.
     * @param {string} result - Result of the executed action [fail/succeed].
     * @param {logEvent~requestCallback} cb - The callback that handles the response.
     */
    AccessLog.prototype.logEvent = function(eventid, servicename, userid, operation, result, cb) {

        getAuditLoggingConfigInfo(function(err, loggingEnabled) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            // if logging is enabled, log event
            if (loggingEnabled) {
                // build access event message
                let _signature = [servicename, ':', eventid].join('');
                let _message = [_signature, userid, operation, '[', result, ']'].join(' ');

                let _payload = {
                    message: _message
                };

                // async event invocation to lambda [serverless-video-transcode-logging-service] function
                // to log access event
                let params = {
                    FunctionName: 'serverless-video-transcode-logging-service',
                    InvocationType: 'Event',
                    LogType: 'None',
                    Payload: JSON.stringify(_payload)
                };
                let lambda = new AWS.Lambda();
                lambda.invoke(params, function(err, data) {
                    if (err) {
                        console.log(
                            'Error occured when triggering Serverless Video Transcode access logging service.',
                            err);
                        return cb('logging trigger failed', null);
                    }

                    return cb(null, 'logging triggered');
                });
            } else {
                return cb(null, 'logging not enabled');
            }

        });

    };

    /**
     * Helper function to retrieve Serverless Video Transcode audit logging configuration setting from
     * Amazon DynamoDB [serverless-video-transcode-settings].
     * @param {getAuditLoggingConfigInfo~requestCallback} cb - The callback that handles the response.
     */
    let getAuditLoggingConfigInfo = function(cb) {
        console.log('Retrieving app-config information...');
        let params = {
            TableName: 'serverless-video-transcode-settings',
            Key: {
                setting_id: 'app-config'
            }
        };
        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        docClient.get(params, function(err, config) {
            if (err) {
                console.log(err);
                return cb('Error retrieving app configuration settings [ddb].', null);
            }

            if (!_.isEmpty(config)) {
                cb(null, config.Item.setting.auditLogging);
            } else {
                cb('No valid audit logging app configuration data available.', null);
            }
        });
    };

    return AccessLog;

})();

module.exports = AccessLog;
