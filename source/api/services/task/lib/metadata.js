/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

'use strict';

let moment = require('moment');
let AWS = require('aws-sdk');
let Indexer = require('./es-indexer.js');
let _ = require('underscore');
let shortid = require('shortid');
let Validator = require('jsonschema').Validator;

let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials

const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
const ddbTable = 'serverless-video-transcode-metadata';

/**
 * Performs CRUD operations for the Serverless Video Transcode package metadata interfacing primiarly with the
 * serverless-video-transcode-metadata Amazon DynamoDB table. Additionally, initiates interactions with
 * elastic search cluster for indexing operations.
 *
 * @class metadata
 */
let metadata = (function() {

    let tagSchema = {
        id: '/tag',
        type: 'object',
        properties: {
            tag: {
                type: 'string'
            },
            value: {
                type: 'string'
            }
        },
        required: ['tag', 'value']
    };

    let metadataSchema = {
        id: '/metadata',
        type: 'object',
        properties: {
            metadata_id: {
                type: 'string'
            },
            task_id: {
                type: 'string'
            },
            metadata: {
                type: 'array',
                items: {
                    '$ref': '/tag'
                }
            },
            created_by: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            }
        },
        required: ['metadata_id', 'task_id', 'metadata', 'created_by', 'created_at']
    };

    let v = new Validator();
    v.addSchema(tagSchema, '/tag');

    /**
     * @class metadata
     * @constructor
     */
    let metadata = function() {};

    /**
     * Retrieves list of metadata associated with a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package to retrieve metadata.
     * @param {getAllPackageMetadata~requestCallback} cb - The callback that handles the response.
     */
    metadata.prototype.getAllPackageMetadata = function(taskId, cb) {
        getMetadataForPackage(taskId, cb);
    };

    /**
     * Retrieves the metadata governance associated with creating a Serverless Video Transcode package.
     * @param {JSON} request - Requested operation should equal 'required_metadata'.
     * @param {getMetadataGovernance~requestCallback} cb - The callback that handles the response.
     */
    metadata.prototype.getMetadataGovernance = function(request, cb) {

        if (request.operation === 'required_metadata') {
            let params = {
                TableName: 'serverless-video-transcode-settings'
            };

            docClient.scan(params, function(err, resp) {
                if (err) {
                    console.log(err);
                    return cb(err, null);
                }

                let _settings = {
                    Items: []
                };

                for (let i = 0; i < resp.Items.length; i++) {
                    if (resp.Items[i].type === 'governance') {
                        _settings.Items.push({
                            tag: resp.Items[i].setting.tag,
                            governance: resp.Items[i].setting.governance
                        });
                    }
                }

                cb(null, _settings);

            });
        } else {
            cb(null, {
                Items: []
            });
        }

    };

    /**
     * Creates metadata and associates with a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package to assocate metadata with.
     * @param {JSON} packageMetadata - Metadata object to add to package.
     * @param {string} token - Authorization header token of the request to pass to import process.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {createPackageMetadata~requestCallback} cb - The callback that handles the response.
     */
    metadata.prototype.createPackageMetadata = function(taskId, packageMetadata, token, ticket, cb) {

        let params = {
            TableName: 'serverless-video-transcode-tasks',
            Key: {
                task_id: taskId
            }
        };

        docClient.get(params, function(err, task) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            if (!_.isEmpty(task)) {
                //verify the requestor is the package owner or and admin to verify
                //they can add metadata to the package
                if (task.Item.owner == ticket.userid || ticket.role.toLowerCase() == 'admin') {
                    // get the latest metadata entry
                    getLatestMetadataEntry(taskId, function(err, latest) {

                        let _postedMetadata = {};
                        try {
                            if (typeof packageMetadata === 'string') {
                                _postedMetadata = JSON.parse(packageMetadata);
                            } else {
                                _postedMetadata = packageMetadata;
                            }
                        } catch (ex) {
                            return cb({
                                error: {
                                    message: 'Invalid json provided when attempting to create metadata.'
                                }
                            }, null);
                        }

                        let _newMetadata = {
                            task_id: taskId,
                            metadata_id: shortid.generate(),
                            created_at: moment.utc().format(),
                            created_by: ticket.userid,
                            metadata: []
                        };

                        for (let i = 0; i < _postedMetadata.metadata.length; i++) {
                            let _tagCheck = v.validate(_postedMetadata.metadata[i], tagSchema);
                            if (_tagCheck.valid) {
                                _newMetadata.metadata.push({
                                    tag: _postedMetadata.metadata[i].tag,
                                    value: _postedMetadata.metadata[i].value
                                });
                            } else {
                                return cb({
                                    error: {
                                        message: 'Invalid schema provided when attempting to create metadata.'
                                    }
                                }, null);
                            }
                        }

                        // existing metadata entries. Add or update existing entries
                        if (!_.isEmpty(latest)) {
                            // loop through last metadata entry and see if the tags exist in the new entry
                            // to ensure metadata is immutable
                            for (let i = 0; i < latest.metadata.length; i++) {
                                let _exist = _.find(_newMetadata.metadata, function(item) {
                                    return item.tag === latest.metadata[i].tag;
                                });

                                //add if doesn't exists
                                if (_.isEmpty(_exist)) {
                                    _newMetadata.metadata.push({
                                        tag: latest.metadata[i].tag,
                                        value: latest.metadata[i].value
                                    });
                                }

                            }
                        }

                        let _schemaCheck = v.validate(_newMetadata, metadataSchema);
                        if (_schemaCheck.valid) {
                            let params = {
                                TableName: ddbTable,
                                Item: _newMetadata
                            };

                            docClient.put(params, function(err, data) {
                                if (err) {
                                    console.log(err);
                                    return cb(err, null);
                                }

                                let _indexer = new Indexer();

                                _indexer.indexToSearch(_newMetadata.task_id, token,
                                    function(err, data) {
                                        if (err) {
                                            console.log(err);
                                            return cb(err, null);
                                        }

                                        return cb(null, _newMetadata);
                                    });
                            });
                        } else {
                            return cb({
                                error: {
                                    message: 'Invalid schema provided when attempting to create metadata.'
                                }
                            }, null);
                        }

                    });

                } else {
                    return cb('User does not have access to create metadata on the requested package.',
                        null);
                }

            } else {
                return cb('The Serverless Video Transcode package requested to update does not exist.', null);
            }
        });

    };

    /**
     * Deletes metadata from a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package the metadata is associated with.
     * @param {integer} metadataId - ID of metadata to delete.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {deletePackageMetadata~requestCallback} cb - The callback that handles the response.
     */
    metadata.prototype.deletePackageMetadata = function(taskId, metadataId, ticket, cb) {

        let params = {
            TableName: 'serverless-video-transcode-tasks',
            Key: {
                task_id: taskId
            }
        };

        docClient.get(params, function(err, task) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            if (!_.isEmpty(task)) {
                //verify the requestor is the package owner or and admin to verify
                //they can add metadata to the package
                if (task.Item.owner == ticket.userid || ticket.role.toLowerCase() == 'admin') {
                    let params = {
                        TableName: ddbTable,
                        Key: {
                            task_id: taskId,
                            metadata_id: metadataId
                        }
                    };

                    docClient.delete(params, function(err, data) {
                        if (err) {
                            console.log(err);
                            return cb(err, null);
                        }

                        return cb(null, data);
                    });
                } else {
                    return cb('User does not have access to delete the requested metadata.', null);
                }

            } else {
                return cb('The Serverless Video Transcode package requested to update does not exist.', null);
            }
        });

    };

    /**
     * Retrieves metadata object associated with a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package the metadata is associated with.
     * @param {integer} metadataId - ID of metadata to retrieve.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {getPackageMetadata~requestCallback} cb - The callback that handles the response.
     */
    metadata.prototype.getPackageMetadata = function(taskId, metadataId, cb) {

        let params = {
            TableName: ddbTable,
            Key: {
                task_id: taskId,
                metadata_id: metadataId
            }
        };

        docClient.get(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            return cb(null, data);
        });

    };

    /**
     * Helper function to retrieve all metadata associated with a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package the metadata is associated with.
     * @param {getMetadataForPackage~requestCallback} cb - The callback that handles the response.
     */
    let getMetadataForPackage = function(taskId, cb) {
        let params = {
            TableName: ddbTable,
            KeyConditionExpression: 'task_id = :pid',
            ExpressionAttributeValues: {
                ':pid': taskId
            }
        };

        docClient.query(params, function(err, resp) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            return cb(null, resp);
        });

    };

    /**
     * Helper function to retrieve the latest metadata record associated with a Serverless Video Transcode package.
     * @param {integer} taskId - ID of the package the metadata is associated with.
     * @param {getLatestMetadataEntry~requestCallback} cb - The callback that handles the response.
     */
    let getLatestMetadataEntry = function(taskId, cb) {
        getMetadataForPackage(taskId, function(err, data) {
            if (err) {
                console.log(err);
                return cb(err, null);
            }

            let _mostRecent = {};
            if (data.Items.length > 0) {
                var _sorted = _.sortBy(data.Items, function(o) {
                    return o.created_at;
                });

                // get most recent
                _mostRecent = _sorted[data.Items.length - 1];
            }

            return cb(null, _mostRecent);
        });
    };

    return metadata;

})();

module.exports = metadata;
