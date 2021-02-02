/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let moment = require('moment');
let AWS = require('aws-sdk');
let shortid = require('shortid');
let _ = require('underscore');
let hat = require('hat');
const url = require('url');

let creds = new AWS.EnvironmentCredentials('AWS'); // Lambda provided credentials

const dynamoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};

/**
 * Performs profile actions for a user, such as, creating a secret access key and retrieving
 * user profile information..
 *
 * @class profile
 */
let profile = (function() {

    /**
     * @class profile
     * @constructor
     */
    let profile = function() {};

    /**
     * Get profile information for the user stored outside of cognitio user pool.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {getProfile~requestCallback} cb - The callback that handles the response.
     */
    profile.prototype.getProfile = function(ticket, cb) {

        getConfigInfo(function(err, config) {
            if (err) {
                return cb(err, null);
            }

            let _url = url.parse(config.Item.setting.apiEndpoint);
            let _profile = {
                hostname: _url.hostname
            };

            cb(null, _profile);
        });
    };

    /**
     * Creates a secret access key for a user and encrypts the key using the Serverless Video Transcode KMS key.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {createApiKey~requestCallback} cb - The callback that handles the response.
     */
    profile.prototype.createApiKey = function(ticket, cb) {

        getConfigInfo(function(err, config) {
            if (err) {
                return cb(err, null);
            }

            let _key = hat();

            let params = {
                KeyId: config.Item.setting.kmsKeyId,
                Plaintext: _key
            };

            let kms = new AWS.KMS();
            kms.encrypt(params, function(err, keydata) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: "Failed to encrypt API Key."}, null);
                }

                let _encryptedKey = keydata.CiphertextBlob.toString('base64');

                let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

                let params = {
                    UserAttributes: [{
                        Name: 'custom:secretaccesskey',
                        Value: _encryptedKey
                    }],
                    UserPoolId: config.Item.setting.idp,
                    Username: ticket.userid
                };
                cognitoidentityserviceprovider.adminUpdateUserAttributes(params, function(err,
                    data) {
                    if (err) {
                        console.log(err);
                        return cb({code: 502, message: "Failed to update user  attributes."}, null);
                    }

                    return cb(null, {key: _key});
                });
            });

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


    return profile;

})();

module.exports = profile;
