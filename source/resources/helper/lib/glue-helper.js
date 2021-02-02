/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let AWS = require('aws-sdk');

let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials
const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};

/**
 * Helper function to interact with AWS Glue for Serverless Video Transcode cfn custom resource.
 *
 * @class glueHelper
 */
let glueHelper = (function() {

    /**
     * @class glueHelper
     * @constructor
     */
    let glueHelper = function() {};

    /**
     * Clean all AWS Glue resources - crawlers and databases/tables.
     */
    glueHelper.prototype.cleanServerlessVideoTranscodeGlueResources = function(cb) {
        let glue = new AWS.Glue();
        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        let param = {
            TableName: 'serverless-video-transcode-packages',
            FilterExpression: "#d = :deleted",
            ExpressionAttributeNames: {
                "#d": "deleted"
            },
            ExpressionAttributeValues: {
                ":deleted": false
            }
        };

        docClient.scan(param, function(err, data) {
            if (err) {
                console.log('[cleanServerlessVideoTranscodeGlueResources] Failed to retrieve information about active packages', err);
                return cb({code: 502, message: `Failed to clean AWS Glue resources.`}, null);
            }
            if (data.Items.length == 0) {
                return cb(null, {code: 200, message: 'No active package to be cleaned'});
            }

            let processed = 0;
            for (let i = 0; i < data.Items.length; i++) {
                let item = data.Items[i];
                let glueNames = getGlueNames(item.name, item.package_id);
                glue.deleteCrawler({Name: glueNames.crawler}, function(err, crawler) {
                    if (err) {
                        console.log(`[cleanServerlessVideoTranscodeGlueResources] Please got to AWS Glue console and check if ${glueNames.crawler} crawler was successfully deleted.`, err);
                    }

                    glue.deleteDatabase({Name: glueNames.database}, function(err, database) {
                        if (err) {
                            console.log(`[cleanServerlessVideoTranscodeGlueResources] Please got to AWS Glue console and check if ${glueNames.database} database was successfully deleted.`, err);
                        }

                        processed++;
                        if (processed == data.Items.length) {
                            return cb(null, {code: 200, message: 'Requested AWS Glue to clean all serverless-video-transcode resource.'});
                        }
                    });
                });
            }
        });
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
        let sufix = '_' + packageId;
        return {
            database: packageName.substring(0, 252 - sufix.length) + sufix,
            crawler: packageName.substring(0, 252 - sufix.length) + sufix, // using same limit above
            tablePrefix: `${packageName}`.substring(0, 63) + '_'
        };
    };

    return glueHelper;

})();

module.exports = glueHelper;
