/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let moment = require('moment');
let AWS = require('aws-sdk');
let shortid = require('shortid');
let Indexer = require('./es-indexer.js');
let Metadata = require('./metadata.js');
let _ = require('underscore');
let Validator = require('jsonschema').Validator;
let AccessValidator = require('access-validator');
let UUID = require('uuid');

let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials

const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
const ddbTable = 'serverless-video-transcode-packages';

/**
 * Performs CRUD operations for the Serverless Video Transcode package interfacing primarly with the
 * serverless-video-transcode-packages Amazon DynamoDB table. Additionally, initiates interactions with
 * elastic search cluster for indexing operations.
 *
 * @class contentPackage
 */
let contentPackage = (function() {
    let packageSchema = {
        id: '/ContentPackage',
        type: 'object',
        properties: {
            package_id: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            owner: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            deleted: {
                type: 'boolean'
            }
        },
        required: ['package_id', 'name', 'description', 'owner', 'created_at', 'updated_at']
    };

    let v = new Validator();
    let accessValidator = new AccessValidator();

    /**
     * @class contentPackage
     * @constructor
     */
    let contentPackage = function() {
        v.addSchema(packageSchema, '/ContentPackage');
    };

    /**
     * Creates a new package in the Serverless Video Transcode.
     * @param {JSON} event - Request event.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {createPackage~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.createPackage = function(event, ticket, cb) {

        accessValidator.validate(null, ticket, 'content-package:createPackage', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let _body = JSON.parse(event.body);

            // make sure the package has the requirement governance
            getGovernanceRequirements(function(err, settings) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to retrieves the packages listed in the Serverless Video Transcode."}, null);
                }

                if (settings.Items.length > 0) {
                    for (let i = 0; i < settings.Items.length; i++) {
                        let _mdata = null;
                        if (_body.metadata) {
                            _mdata = _.find(_body.metadata, function(val) {
                                return val.tag == settings.Items[i].setting.tag;
                            });
                        }

                        if (!_mdata && settings.Items[i].setting.governance === 'Required') {
                            return cb({code: 400, message: `The required metadata ${settings.Items[i].setting.tag} is missing`}, null);
                        }
                    }
                }

                shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
                let _package = _body.package;
                let _newpackage = {
                    package_id: shortid.generate(),
                    created_at: moment.utc().format(),
                    updated_at: moment.utc().format(),
                    owner: ticket.userid,
                    name: _package.name.substring(0, 100).trim(),
                    description: _package.description.substring(0, 1000).trim(),
                    deleted: false
                };

                if ('groups' in _package && _package.groups.length > 0) {
                    _newpackage.groups = _package.groups;
                }

                let _schemaCheck = v.validate(_newpackage, packageSchema);
                if (!_schemaCheck.valid) {
                    return cb({code: 400, message: 'Invalid schema provided when attempting to create package.'}, null);
                }

                let params = {
                    TableName: ddbTable,
                    Item: _newpackage
                };

                let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
                docClient.put(params, function(err, data) {
                    if (err) {
                        console.log(err);
                        return cb({code: 502, message: "Failed to create a new package in the Serverless Video Transcode."}, null);
                    }

                    let _accessValidator = new AccessValidator();
                    let _authToken = _accessValidator.getAuthToken(event.headers);

                    // if metadata exists, create the records
                    if (_body.metadata) {
                        let _metadata = new Metadata();
                        var _payload = {
                            headers: {
                                Auth: _authToken
                            },
                            body: JSON.stringify({
                                metadata: _body.metadata,
                                created_by: _newpackage.owner
                            })
                        };
                        _metadata.createPackageMetadata(_newpackage.package_id, _payload.body,
                            _authToken, ticket,
                            function(err, data) {
                                if (err) {
                                    console.log(err);
                                    return cb({code: 502, message: "Failed to create package metadata."}, null);
                                }

                                return cb(null, _newpackage);
                            });
                    } else {
                        let _indexer = new Indexer();
                        _indexer.indexToSearch(_newpackage.package_id, _authToken,
                            function(err,
                                data) {
                                if (err) {
                                    console.log('indexing error: ', err);
                                }

                                return cb(null, _newpackage);
                            });
                    }
                });
            });
        });

    };

    /**
     * Deletes (soft delete) a package from the Serverless Video Transcode.
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {string} authToken - Authorization header token of the request to pass to index process.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {deletePackage~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.deletePackage = function(packageId, authToken, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:deletePackage', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            getConfigInfo()
            .then(function(config) {
                let params = {
                    TableName: ddbTable,
                    Key: {
                        package_id: packageId
                    },
                    UpdateExpression: 'set #a = :x',
                    ExpressionAttributeNames: {
                        '#a': 'deleted'
                    },
                    ExpressionAttributeValues: {
                        ':x': true
                    },
                    ReturnValues: 'ALL_NEW'
                };
                let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
                return Promise.all([
                    deletePackageEsEntry(packageId, authToken),
                    deletePackageS3Entry(packageId, config.Item.setting.defaultS3Bucket),
                    deletePackageDatasetDbdEntries(packageId),
                    docClient.update(params).promise()
                ]);
            })
            .then(function(value) {
                contentPackage.prototype.deleteGlueReferences(packageId, null, ticket, function(err, data) {
                    return cb(null, {code: 200, message: `Package deleted and request sent to ES, S3 and Glue. Package ${packageId}.`});
                });
            })
            .catch(function(err) {
                return cb({code: 502, message: `Failed to delete package ${packageId}.`}, null);
            });
        });

    };

    function deletePackageDatasetDbdEntries(packageId) {
        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        let param = {
            TableName: 'serverless-video-transcode-datasets',
            KeyConditionExpression: 'package_id = :pid',
            ExpressionAttributeValues: {
                ':pid': packageId
            }
        };
        docClient.query(param).promise()
        .then(function(values) {
            return Promise.all(
                values.Items.map(function(item) {
                    let params = {
                        TableName: 'serverless-video-transcode-datasets',
                        Key: {
                            package_id: item.package_id,
                            dataset_id: item.dataset_id
                        }
                    };
                    return docClient.delete(params).promise();
                })
            );
        });
    };

    function deletePackageEsEntry(packageId, authToken) {
        return new Promise((resolve, reject) => {
            let _indexer = new Indexer();
            _indexer.deleteIndexedPackage(packageId, authToken, function(err, data) {
                if (err) {
                    console.log(err);
                    reject({code: 502, message: "ES failed to process delete request."});
                }

                resolve({code: 200, message: "Delete request sent to ES."});
            });
        });
    }

    function deletePackageS3Entry(packageId, bucket) {
        return new Promise((resolve, reject) => {
            let s3 = new AWS.S3();
            const listParams = {
                Bucket: bucket,
                Prefix: `${packageId}/`
            };

            s3.listObjectsV2(listParams).promise()
            .then( function(listData) {
                if (listData.Contents.length > 0) {
                    const deleteParams = {
                        Bucket: bucket,
                        Delete: { Objects: listData.Contents.map(obj => { return {Key: obj['Key']}; }) }
                    };
                    return s3.deleteObjects(deleteParams).promise();
                }
            })
            .then( function(deleteData) {
                if ( typeof deleteData !== 'undefined' && deleteData ) {
                    return deletePackageS3Entry(packageId, bucket)
                }
            })
            .then( function(deleteData) {
                resolve({code: 200, message: `${bucket}/${packageId} cleaned.`});
            })
            .catch(err => {
                console.log(err);
                reject({code: 502, message: `[deletePackageS3Entry] Failed to clean ${bucket}/${packageId}`});
            });
        });
    }

    /**
     * Retrieves a package from the Serverless Video Transcode.
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {getPackage~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.getPackage = function(packageId, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:getPackage', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let params = {
                TableName: ddbTable,
                Key: {
                    package_id: packageId
                }
            };

            let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
            docClient.get(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to retrieve package data. Check if the package exists."}, null);
                }

                if (!_.isEmpty(data)) {
                    if (data.Item.deleted) {
                        data = {};
                    }
                }

                return cb(null, data);
            });
        });

    };

    /**
     * Updates a package in the Serverless Video Transcode.
     * @param {JSON} event - Request event.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {updatePackage~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.updatePackage = function(event, ticket, cb) {

        accessValidator.validate(event.pathParameters.package_id, ticket, 'content-package:updatePackage', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let _package = JSON.parse(event.body);
            let _package_id = event.pathParameters.package_id

            let params = {
                TableName: ddbTable,
                Key: {
                    package_id: _package_id
                }
            };

            let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
            docClient.get(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to updates package. Check if the package exists."}, null);
                }

                if (_.isEmpty(data)) {
                    return cb({code: 404, message: 'The Serverless Video Transcode package requested to update does not exist.'}, null);
                }

                if (data.Item.owner != ticket.userid && ticket.role.toLowerCase() != 'admin') {
                    return cb({code: 401, message: 'User does not have access to updated the requested package.'}, null);
                }

                let newName = _package.name.trim();
                let oldName = data.Item.name.trim();
                let params = {
                    TableName: ddbTable,
                    Key: {
                        package_id: _package_id
                    },
                    UpdateExpression: 'set #a = :x, #b = :y, #c = :z, #d = :w',
                    ExpressionAttributeNames: {
                        '#a': 'updated_at',
                        '#b': 'description',
                        '#c': 'name',
                        '#d': 'groups'
                    },
                    ExpressionAttributeValues: {
                        ':x': moment.utc().format(),
                        ':y': _package.description ? _package.description : data.Item.description,
                        ':z': newName ? newName : oldName,
                        ':w': _package.groups ? _package.groups : []
                    },
                    ReturnValues: 'ALL_NEW'
                };

                docClient.update(params, function(err, resp) {
                    if (err) {
                        console.log(err);
                        return cb({code: 502, message: "Failed to updates package"}, null);
                    }

                    chekAndDeleteGlueReferences(newName, oldName, _package_id, ticket, function(err, data) {
                        chekAndStartCrawler(newName, oldName, _package_id, ticket, function(err, data) {
                            let _indexer = new Indexer();
                            let _accessValidator = new AccessValidator();
                            let _authToken = _accessValidator.getAuthToken(event.headers);
                            _indexer.indexToSearch(_package_id, _authToken, function(err, data) {
                                if (err) {
                                    console.log('indexing error: ', err);
                                }
                                return cb(null, resp);
                            });
                        });
                    });
                });
            });
        });
    };

    function chekAndDeleteGlueReferences(newName, oldName, packageId, ticket, cb) {
        if (newName == oldName) {
            return cb(null, packageId);
        }

        contentPackage.prototype.deleteGlueReferences(packageId, oldName, ticket, function(err, data) {
            cb(null, packageId);
        });
    }

    function chekAndStartCrawler(newName, oldName, packageId, ticket, cb) {
        if (newName == oldName) {
            return cb(null, packageId);
        }

        getConfigInfo()
        .then(function(config) {
            var params = {
                Bucket: config.Item.setting.defaultS3Bucket,
                MaxKeys: 1,
                Prefix: `${packageId}/`
            };
            let s3 = new AWS.S3();
            return s3.listObjectsV2(params).promise();
        })
        .then(function(data) {
            if (data && data.Contents.length >= 0) {
                contentPackage.prototype.startCrawler(packageId, ticket, function(err, data) {
                    return cb(err, packageId);
                });
            } else {
                return cb(null, packageId);
            }
        })
        .catch(function(err) {
            console.log(err);
            return cb(err, null);
        });
    }

    /**
     * Retrieves the definitions of some or all of the tables in a given package.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {getTables~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.getTables = function(packageId, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:getTables', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let glueNames = getGlueNames(data.Item.name, packageId);
            var params = {
                DatabaseName: glueNames.database
            };
            let glue = new AWS.Glue();
            glue.getTables(params, function(err, data) {
                if (err) {
                    // Fix for github issue #20
                    return cb(null, {tables:[], message: "Failed to retrieve definitions of tables in this package. Check if the package tables already exist in AWS Glue."});
                }
                else {
                    var glueTables = [];
                    for (var i = data.TableList.length - 1; i >= 0; i--) {
                        glueTables.push({
                            DatabaseName: glueNames.database,
                            TableName: data.TableList[i].Name,
                            ViewTableUrl: `https://${process.env.AWS_REGION}.console.amazonaws.cn/glue/home?region=${process.env.AWS_REGION}#table:name=${data.TableList[i].Name};namespace=${glueNames.database}`,
                            Classification: data.TableList[i].Parameters.classification,
                            LastUpdate: data.TableList[i].UpdateTime
                        });
                    }
                    return cb(null, {tables:glueTables});
                }
            });
        });

    };

    /**
     * Retrieves the external link to view table data in Amazon Athena.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {string} tableName - Catalog table name.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {viewTableData~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.viewTableData = function(packageId, tableName, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:viewTableData', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1; //months from 1-12
            var day = dateObj.getUTCDate();
            var year = dateObj.getUTCFullYear;

            let glueNames = getGlueNames(data.Item.name, packageId);
            var params = {
                QueryString: `SELECT * FROM "${glueNames.database}"."${tableName}" limit 10;`,
                ResultConfiguration: {
                    OutputLocation: `s3://aws-athena-query-results-${process.env.ACCOUNT_ID}-${process.env.AWS_REGION}/Unsaved/${year}/${month}/${day}/${UUID.v4()}.csv`,
                    EncryptionConfiguration: {
                        EncryptionOption: 'SSE_S3'
                    }
                },
                QueryExecutionContext: {
                    Database: 'packageId'
                }
            };
            let athena = new AWS.Athena();
            athena.startQueryExecution(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to retrieves the external link to view table data in Amazon Athena. Check if the package table exists in AWS Glue."}, null);
                }

                else {
                    return cb(null, {link: `https://${process.env.AWS_REGION}.console.amazonaws.cn/athena/home?region=${process.env.AWS_REGION}#query/history/${data.QueryExecutionId}`});
                }
            });
        });

    };

    /**
     * Deletes all AWS Glue references - crawler and database.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {string} packageName - Serverless Video Transcode packe name.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {deleteGlueReferences~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.deleteGlueReferences = function(packageId, packageName, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:deleteGlueReferences', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            if (!packageName) {
                packageName = data.Item.name;
            }

            let glue = new AWS.Glue();
            let glueNames = getGlueNames(packageName, packageId);
            let params_crawler = {Name: glueNames.crawler};
            let params_database = {Name: glueNames.database};

            if (typeof cb !== 'undefined') {
                Promise.all([
                    glue.deleteCrawler(params_crawler).promise(),
                    glue.deleteDatabase(params_database).promise()
                ].map(p => p.catch(e => e)))
                .then(function(value) {
                    return cb(null, {code: 200, message: `Delete request sent to AWS Glue. Package ${packageId}.`});
                });
            }
            else {
                return Promise.all([
                    glue.deleteCrawler(params_crawler).promise(),
                    glue.deleteDatabase(params_database).promise()
                ].map(p => p.catch(e => e)));
            }
        });
    };

    /**
     * Retrieves crawler metadata for a specified package.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {getCrawler~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.getCrawler = function(packageId, ticket, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:getCrawler', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            //Fetch the ddb status
            let glueCrawler = {
                name: `Serverless Video Transcode job -${packageId}`,
                status: "INPROGRESS",
                lastRun: "-"
            };
            // Fix for github issue #20
            return cb(null, glueCrawler);
        });

    };

    /**
     * Starts a crawler for the specified package, regardless of what is scheduled.
     * If the crawler is already running, does nothing.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {startCrawler~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.startCrawler = function(packageId, ticket, s3Bucket, s3Key, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:startCrawler', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let packageName = data.Item.name;
            contentPackage.prototype.updateOrCreateCrawler(packageId, ticket, s3Bucket, s3Key, function(err, data) {
                if (err) {
                    return cb(err, null);
                }

                // Browse the DDB table for the package status

                return cb(null, {code: 200, message: `AWS Serverless Video Transcoder process for ${packageId} will start shortly.`});

                // let glueNames = getGlueNames(packageName, packageId);
                // var params = {Name: glueNames.crawler};
                // let glue = new AWS.Glue();
                // glue.startCrawler(params, function(err, data) {
                //     if (err) {
                //         console.log(err);
                //         return cb({code: 502, message: "Failed to start AWS Glue crawler. Check if the crawler is already running, the account limits and if the name of the package is supported by AWS Glue."}, null);
                //     }
                //     return cb(null, {code: 200, message: `AWS Glue crawler for ${glueNames.database} will start shortly.`});
                // });
            });
        });

    };

    /**
     * Creates or Update (if the crawler already exits) the package crawler.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {updateOrCreateCrawler~requestCallback} cb - The callback that handles the response.
     */
    contentPackage.prototype.updateOrCreateCrawler = function(packageId, ticket, s3Bucket, s3Key, cb) {

        accessValidator.validate(packageId, ticket, 'content-package:updateOrCreateCrawler', function(err, data) {
            if (err) {
                return cb(err, null);
            }

            let packageName = data.Item.name;
            getConfigInfo(function(err, config) {
                if (err) {
                    return cb(err, null);
                }

                let defaultTarget = `s3://${config.Item.setting.defaultS3Bucket}/${packageId}`;

                /*
                 * Start calling Video Transcoder trigger lambda function
                 * Entry point!!!!!!!!
                 */
                let s3_input = {
                    bucket: `${s3Bucket}`,
                    key: `${s3Key}`,
                }
                // invoke serverless-video-transcode-admin-service function to verify if user has
                // proper role for requested action
                let params = {
                    FunctionName: 'serverless-video-transcoder-TriggerFunction-L4B78NNPNK6N',
                    InvocationType: 'RequestResponse',
                    LogType: 'Tail',
                    Payload: JSON.stringify(s3_input)
                };
                let lambda = new AWS.Lambda();
                lambda.invoke(params, function(err, data) {
                    if (err) {
                        console.log(err);
                        return cb({code: 502, message: "Failed to trigger the serverless Video Transcoder, detail error: "+err}, null);
                        callback(Error(err))
                    }else{
                        console.log("Succeed calling the serverless video transcoder lambda trigger");
                        return cb(null, {code: 200, message: `Serverless Video Transcoder triggerred.`});
                    }
                });

                // getManifestImportedDatasetsList(packageId, defaultTarget, function(err, crawlerFilter) {
                //     if (err) {
                //         return cb(err, null);
                //     }
                //
                //     let glue = new AWS.Glue();
                //     let glueNames = getGlueNames(packageName, packageId);
                //     let params = {Name: glueNames.crawler};
                //     glue.getCrawler(params, function(err, data) {
                //         let crawlerData = {
                //             DatabaseName: glueNames.database,
                //             Name: glueNames.crawler,
                //             Role: process.env.CRAWLER_ROLE_ARN,
                //             Targets: {S3Targets: [{Path: defaultTarget}]},
                //             Description: 'Glue crawler that creates tables based on S3 ServerlessVideoTranscode resources',
                //             Schedule: 'cron(0 0 * * ? *)',
                //             Configuration: '{ "Version": 1.0, "CrawlerOutput": { "Partitions": { "AddOrUpdateBehavior": "InheritFromTable" } } }',
                //             SchemaChangePolicy: {
                //               DeleteBehavior: 'DELETE_FROM_DATABASE',
                //               UpdateBehavior: 'UPDATE_IN_DATABASE'
                //             },
                //             TablePrefix: glueNames.tablePrefix
                //         };
                //         crawlerData.Targets.S3Targets[0].Exclusions = crawlerFilter.exclude;
                //         crawlerData.Targets.S3Targets = crawlerData.Targets.S3Targets.concat(crawlerFilter.include);
                //
                //         if (data && data.Crawler !== undefined) {
                //             if (data.Crawler.DatabaseName !== undefined) {
                //                 crawlerData.DatabaseName = data.Crawler.DatabaseName;
                //             }
                //             if (data.Crawler.Name !== undefined) {
                //                 crawlerData.Name = data.Crawler.Name;
                //             }
                //             if (data.Crawler.Role !== undefined) {
                //                 crawlerData.Role = data.Crawler.Role;
                //             }
                //             if (data.Crawler.Description !== undefined) {
                //                 crawlerData.Description = data.Crawler.Description;
                //             }
                //             if (data.Crawler.Schedule !== undefined && data.Crawler.Schedule.ScheduleExpression !== undefined) {
                //                 crawlerData.Schedule = data.Crawler.Schedule.ScheduleExpression;
                //             }
                //             if (data.Crawler.Configuration !== undefined) {
                //                 crawlerData.Configuration = data.Crawler.Configuration;
                //             }
                //             if (data.Crawler.SchemaChangePolicy !== undefined) {
                //                 crawlerData.SchemaChangePolicy = data.Crawler.SchemaChangePolicy;
                //             }
                //             if (data.Crawler.TablePrefix !== undefined) {
                //                 crawlerData.TablePrefix = data.Crawler.TablePrefix;
                //             }
                //             glue.updateCrawler(crawlerData, function(err, data) {
                //                 if (err) {
                //                     console.log(err);
                //                     return cb({code: 502, message: "Failed to update AWS Glue crawler. Check if the is not crawler running, the account limits and if the crawler wasn not deleted while running this request."}, null);
                //                 }
                //
                //                 return cb(null, {code: 200, message: `AWS Glue crawler ${glueNames.database} updated.`});
                //             });
                //
                //         } else {
                //             glue.createCrawler(crawlerData, function(err, data) {
                //                 if (err) {
                //                     console.log(err);
                //                     return cb({code: 502, message: "Failed to create AWS Glue crawler. Check account limits and if the name of the package is supported by AWS Glue."}, null);
                //                 }
                //
                //                 return cb(null, {code: 200, message: `AWS Glue crawler ${glueNames.database} created.`});
                //             });
                //         }
                //     });
                // });
            });
        });
    };

    /**
     * Retrieves the Serverless Video Transcode package governance requirements.
     * @param {getGovernanceRequirements~requestCallback} cb - The callback that handles the response.
     */
    let getGovernanceRequirements = function(cb) {

        // get metadata governance requirements
        let params = {
            TableName: 'serverless-video-transcode-settings'
        };

        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        docClient.scan(params, function(err, resp) {
            if (err) {
                console.log(err);
                return cb({code: 502, message: "Failed to retrieve package governance requirements."}, null);
            }

            let _settings = {
                Items: _.where(resp.Items, {
                    type: 'governance'
                })
            };
            cb(null, _settings);
        });

    };

    /**
     * Helper function to retrieve Serverless Video Transcode configuration setting from Amazon DynamoDB [serverless-video-transcode-settings].
     * @param {getConfigInfo~requestCallback} cb - The callback that handles the response.
     */
    let getConfigInfo = function(cb) {
        let params = {
            TableName: 'serverless-video-transcode-settings',
            Key: {
                setting_id: 'app-config'
            }
        };

        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        if (typeof cb !== 'undefined' && cb) {
            docClient.get(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to retrieving app configuration settings [ddb]."}, null);
                }

                return cb(null, data);
            });
        } else {
            return docClient.get(params).promise();
        }
    };

    /**
     * Normalize glue resource naming considering best practices/restrictions:
     *  - A database name cannot be longer than 252 characters.
     *  - Any custom prefix cannot be longer than 64 characters.
     *
     * Ref: https://amzn.to/2rIhtBM and https://amzn.to/2KZYaMd
     *
     * @param {string} packageName - Serverless Video Transcode packe name.
     * @param {string} packageId - Serverless Video Transcode package id.
     */
    let getGlueNames = function(packageName, packageId) {
        packageName = packageName.replace(/ /g,"_").replace(/\W/g, '').toLowerCase();
        packageName = packageName.replace(/_/g," ").trim().replace(/ /g,"_"); //trim('_')

        // Subtract sufix.length to avoid truncating packageId value
        let database_sufix = '_' + packageId;
        let crawler_sufix = ' ' + packageId;
        return {
            database: packageName.substring(0, 252 - database_sufix.length) + database_sufix,
            crawler: packageName.substring(0, 252 - crawler_sufix.length) + crawler_sufix, // using same limit above
            tablePrefix: `${packageName}`.substring(0, 63) + '_'
        };
    };

    /**
     * Helper function to retrieve infomation about crawler include and exclude paths.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {getConfigInfo~requestCallback} cb - The callback that handles the response.
     */
    let getManifestImportedDatasetsList = function(packageId, defaultTarget, cb) {
        let crawlerFilter = {
            include: [],
            exclude: []
        };

        let params = {
            TableName: 'serverless-video-transcode-datasets',
            KeyConditionExpression : 'package_id = :hkey',
            ExpressionAttributeValues : {
                ':hkey' : packageId
            }
        };
        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        docClient.query(params, function(err, data) {
            if (err) {
                console.log(err);
                return cb({code: 502, message: "Failed to retrieving crawler filter list."}, null);
            }

            data.Items.forEach(function(item) {
                if (item.content_type === 'include-path') {
                    crawlerFilter.include.push({
                        Path:'s3://' + item.s3_bucket + item.s3_key,
                        Exclusions:item.excludePatterns
                    });

                } else if (item.type == 'manifest') {
                    let excludePath = `s3://${item.s3_bucket}/${item.s3_key}`;
                    crawlerFilter.exclude.push(excludePath.replace(new RegExp(`${defaultTarget}/`, 'g'), ''));
                }
            });

            return cb(null, crawlerFilter);
        });
    };

    return contentPackage;

})();

module.exports = contentPackage;
