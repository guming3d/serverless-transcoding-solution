/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

'use strict';

let AWS = require('aws-sdk');
let _ = require('underscore');
let moment = require('moment');

let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials

const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);

/**
 * Initiates search indexing operations [add document, delete document] for Serverless Video Transcode tasks.
 *
 * @class indexer
 */
let indexer = (function() {

    /**
     * @class indexer
     * @constructor
     */
    let indexer = function() {};

    /**
     * Creates a document for indexing a package to the search engine.
     * @param {integer} taskId - ID of the package to create index document for indexing.
     * @param {buildIndexDocument~requestCallback} cb - The callback that handles the response.
     */
    let buildIndexDocument = function(taskId, cb) {
        let params = {
            TableName: 'serverless-video-transcode-tasks',
            Key: {
                task_id: taskId
            }
        };

        docClient.get(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            // get metadata
            if (!_.isEmpty(data)) {

                let params = {
                    TableName: 'serverless-video-transcode-metadata',
                    KeyConditionExpression: 'task_id = :pid',
                    ExpressionAttributeValues: {
                        ':pid': taskId
                    }
                };

                docClient.query(params, function(err, metadata) {
                    if (err) {
                        console.log(err);
                        return cb(err, null);
                    }

                    data.Item.metadata = [];

                    if (metadata.Items.length > 0) {
                        let _sorted = _.sortBy(metadata.Items, function(m) {
                            return m.created_at;
                        });

                        // use the most recent metadata; last item in _sorted
                        if (!_.isEmpty(_sorted[_sorted.length - 1])) {
                            data.Item.metadata = _sorted[_sorted.length - 1].metadata;
                        }
                    }

                    data.Item.updated_at = moment.utc().format();

                    return cb(null, data.Item);

                });

            } else {
                return cb(null, data);
            }

        });

    };

    /**
     * Indexes a Serverless Video Transcode package to the search engine.
     * @param {integer} taskId - ID of the package to index.
     * @param {string} token - Authorization header token of the request to pass to index process.
     * @param {indexToSearch~requestCallback} cb - The callback that handles the response.
     */
    indexer.prototype.indexToSearch = function(taskId, token, cb) {

        buildIndexDocument(taskId, function(err, contentPackage) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            let _document = {
                body: contentPackage,
                resource: '/search/index',
                httpMethod: 'POST',
                headers: {
                    Auth: token
                }
            };

            // invoke serverless-video-transcode-search-service function to index package
            let params = {
                FunctionName: 'serverless-video-transcode-search-service',
                InvocationType: 'RequestResponse',
                LogType: 'None',
                Payload: JSON.stringify(_document)
            };
            let lambda = new AWS.Lambda();
            lambda.invoke(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb(err, null);
                }

                console.log('Search indexer result:' + data);
                return cb(null, 'successfully indexed');
            });
        });

    };

    /**
     * Removes a Serverless Video Transcode package from the search engine.
     * @param {integer} taskId - ID of the package to remove from index.
     * @param {string} token - Authorization header token of the request to pass to index process.
     * @param {deleteIndexedPackage~requestCallback} cb - The callback that handles the response.
     */
    indexer.prototype.deleteIndexedPackage = function(taskId, token, cb) {

        let _document = {
            body: {
                task_id: taskId
            },
            resource: '/search/index',
            httpMethod: 'DELETE',
            headers: {
                Auth: token
            }
        };

        // invoke serverless-video-transcode-admin-service function to verify if user has
        // proper role for requested action
        let params = {
            FunctionName: 'serverless-video-transcode-search-service',
            InvocationType: 'Event',
            LogType: 'None',
            Payload: JSON.stringify(_document)
        };
        let lambda = new AWS.Lambda();
        lambda.invoke(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            return cb(null, 'successfully submitted index removal to ES');
        });

    };

    return indexer;

})();

module.exports = indexer;
