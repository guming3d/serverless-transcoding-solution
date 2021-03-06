/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

/**
 * Lib
 */

let AWS = require('aws-sdk');
let Metadata = require('./metadata.js');
let AccessLog = require('./access-log.js');
let AccessValidator = require('access-validator');
const servicename = 'serverless-video-transcode-search-service';

/**
 * Verifies user's authorization to execute requested action. If the request is
 * authorized, it is processed, otherwise a 401 unathorized result is returned
 * @param {JSON} event - Request event.
 * @param {respond~requestCallback} cb - The callback that handles the response.
 */
module.exports.respond = function(event, cb) {

    //-----------------------------------------------------------------------------------
    // Check if event was generated by CloudWatch Events.
    // This function is invoked when an AWS Glue crawler finishes successfully.
    // https://amzn.to/2KsVkyj
    //-----------------------------------------------------------------------------------
    if (event.source === 'aws.glue') {
        let _metadata = new Metadata();
        _metadata.indexColumns(event, function(err, data) {
            return cb(err, data);
        });

    } else {
        let _accessValidator = new AccessValidator();
        let _authToken = _accessValidator.getAuthToken(event.headers);
        let _authCheckPayload = {
            authcheck: ['admin', 'member'],
            authorizationToken: _authToken
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
                _response = buildOutput(500, err);
                return cb(_response, null);
            }

            let _ticket = JSON.parse(data.Payload);
            console.log('Authorization check result: ' + _ticket.auth_status);
            if (_ticket.auth_status === 'authorized') {
                processRequest(event, _ticket, cb);
            } else {
                _response = buildOutput(401, {
                    error: {
                        message: 'User is not authorized to perform the requested action.'
                    }
                });
                return cb(_response, null);
            }

        });
    }

};

/**
 * Routes the request to the appropriate logic based on the request resource and method.
 * @param {JSON} event - Request event.
 * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
 * @param {processRequest~requestCallback} cb - The callback that handles the response.
 */
function processRequest(event, ticket, cb) {

    let _response = {};

    let INVALID_PATH_ERR = {
        Error: ['Invalid path request ', event.resource, ', ', event.httpMethod].join('')
    };

    let _metadata = new Metadata();
    let _accessLog = new AccessLog();
    let _operation = '';

    if (event.resource === '/search') {
        _operation = ['search Serverless Video Transcode with terms [', event.queryStringParameters.term, ']'].join(' ');
        _metadata.search(event.queryStringParameters.term, ticket, function(err, data) {
            if (err) {
                console.log(err);
                _response = buildOutput(500, err);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'failed/error',
                    function(err, resp) {
                        return cb(_response, null);
                    });
            } else {
                _response = buildOutput(200, data);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'success',
                    function(err, resp) {
                        return cb(null, _response);
                    });
            }
        });

    } else if (event.resource === '/search/index' && event.httpMethod === 'POST') {
        _metadata.indexDocument(event.body, ticket, function(err, data) {
            if (err) {
                console.log(err);
                _response = buildOutput(500, err);
                return cb(_response, null);
            }

            _response = buildOutput(200, data);
            return cb(null, _response);
        });

    } else if (event.resource === '/search/index' && event.httpMethod === 'DELETE') {
        _operation = ['delete task', event.body.task_id, 'from search index'].join(' ');
        _metadata.deleteDocument(event, ticket, function(err, data) {
            if (err) {
                console.log(err);
                _response = buildOutput(500, err);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'failed/error',
                    function(err, resp) {
                        return cb(_response, null);
                    });
            } else {
                _response = buildOutput(200, data);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'success',
                    function(err, resp) {
                        return cb(null, _response);
                    });
            }
        });

    } else if  (event.resource === '/search/stats') {
        _operation = 'retrieve task stats';
        _metadata.stats(ticket, function(err, data) {
            if (err) {
                console.log(err);
                _response = buildOutput(500, err);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'failed/error',
                    function(err, resp) {
                        return cb(_response, null);
                    });
            } else {
                _response = buildOutput(200, data);
                _accessLog.logEvent(event.requestContext.requestId, servicename, ticket.userid, _operation,
                    'success',
                    function(err, resp) {
                        return cb(null, _response);
                    });
            }
        });

    } else {
        _response = buildOutput(500, INVALID_PATH_ERR);
        return cb(_response, null);
    }

};

/**
 * Constructs the appropriate HTTP response.
 * @param {integer} statusCode - HTTP status code for the response.
 * @param {JSON} data - Result body to return in the response.
 */
function buildOutput(statusCode, data) {

    let _response = {
        statusCode: statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
    };

    return _response;
};
