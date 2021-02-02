/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

let AWS = require('aws-sdk');
let _ = require('underscore');

let creds = new AWS.EnvironmentCredentials('AWS');
let cognitoConfig = {
    credentials: creds,
    region: process.env.AWS_REGION
};
let dynamoConfig = {
    region: process.env.AWS_REGION
};
let ddbTable = {
    packages: 'serverless-video-transcode-packages'
};

/**
 * AccessValidator is a auxiliar class to check authentication and Authorization for serverless-video-transcode services
 *
 * @class AccessValidator
 */
let AccessValidator = (function() {

    /**
     * @class AccessValidator
     * @constructor
     */
    let AccessValidator = function() {};

    /**
     * Helper function to validade if the user can access to the package.
     *
     * @param {string} packageId - Serverless Video Transcode package id.
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {string} operation - information about which class and function is trying to check access.
     * @param {validate~requestCallback} cb - The callback that handles the response.
     */
    AccessValidator.prototype.validate = function(packageId, ticket, operation, cb) {
        if (isOpenOperation(operation)) {
            return cb(null, {code: 200, message: "Open Operation"});
        }

        let params = {
            TableName: ddbTable.packages,
            Key: {
                package_id: packageId
            }
        };

        let docClient = new AWS.DynamoDB.DocumentClient(dynamoConfig);
        docClient.get(params, function(err, data) {

            if (err) {
                console.log(err);
                return cb({code: 502, message: "Failed to validade if the user permission."}, null);
            }

            else if ( ticket.auth_status != 'authorized' || _.isEmpty(data) || (data.Item.deleted && !canValidadeAccessToDeletedPackage(operation)) ) {
                let message = "Failed to validade if the user permission. Check if the package exists and if you are authorized to access it.";
                console.log(new Error(message));
                return cb({code: 404, message: message}, null);
            }

            else {
                let isAdmin = (ticket.role.toLowerCase() == 'admin');
                let isPackageOwner = (data.Item.owner == ticket.userid);

                if (isAdmin || isPackageOwner) {
                    return cb(null, data);

                } else if (canValidadeAccessByUserGroups(operation)) {
                    AccessValidator.prototype.getUserGroups(ticket.userid, function(err, userGroupData) {
                        if (!err) {
                            let packageGoups = (data.Item.groups) ? data.Item.groups : [];
                            let userGroups = userGroupData.Groups.map(group => group.GroupName);

                            if (_.intersection(packageGoups, userGroups).length > 0) {
                                return cb(null, data);
                            }
                        }

                        let message = "Failed to validade if the user permission. Check if the package exists and if you are authorized to access it.";
                        console.log(new Error(message));
                        return cb({code: 401, message: message}, null);
                    });

                } else {
                    let message = "Failed to validade if the user permission. Check if the package exists and if you are authorized to access it.";
                    console.log(new Error(message));
                    return cb({code: 401, message: message}, null);
                }
            }
        });
    };

    function isOpenOperation(operation) {
        return (operation == 'content-package:createPackage'||
            operation == 'metadata:search'||
            operation == 'metadata:dashboardStats');
    }

    function canValidadeAccessToDeletedPackage(operation) {
        return (operation == 'content-package:deletePackage'||
            operation == 'content-package:deleteGlueReferences' ||
            operation == 'dataset:deletePackageDataset' ||
            operation == 'metadata:deleteDocument');
    }

    function canValidadeAccessByUserGroups(operation) {
        return (operation == 'content-package:getPackage' ||
            operation == 'content-package:getCrawler' ||
            operation == 'content-package:getTables' ||
            operation == 'content-package:viewTableData' ||
            operation == 'dataset:getPackageDatasets' ||
            operation == 'dataset:getPackageDataset');
    }

    /**
     * Helper function to validade if the user can administrative services.
     *
     * @param {JSON} ticket - Serverless Video Transcode authorization ticket.
     * @param {validateAdminAccess~requestCallback} cb - The callback that handles the response.
     */
    AccessValidator.prototype.validateAdminAccess = function(ticket, cb) {

        if (ticket.auth_status != 'authorized' || ticket.role.toLowerCase() != 'admin') {
            let message = "Failed to validade if the user permission. Check if you are authorized to access this service.";
            console.log(new Error(message));
            return cb({code: 401, message: message}, null);
        }
        else {
            return cb(null, {code: 200, message: "authorized"});
        }

    };

    /**
     * Lists the groups that the user belongs to.
     *
     * @param {string} userId - Username of account to list groups.
     * @param {getUserGroups~requestCallback} cb - The callback that handles the response.
     */
    AccessValidator.prototype.getUserGroups = function(userId, cb) {

        if(process.env.FEDERATED_LOGIN == 'true') {
            let params = {
                UserPoolId: process.env.USER_POOL_ID,
                Username: userId
            };

            let _result = {"Groups": []};
            return cb(null, _result);
            
        } else {
            let params = {
              UserPoolId: process.env.USER_POOL_ID,
              Username: userId
            };
            let cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider(cognitoConfig);
            cognitoidentityserviceprovider.adminListGroupsForUser(params, function(err, data) {
                if (err) {
                    console.log(err);
                    return cb({code: 502, message: `Failed to list the groups that the user belongs to.`}, null);
                }

                return cb(null, data);
            });
        }

    };

    /**
     * Helper function to abstract how to correctly extract authentication token from header.
     *
     * 2017-02-18: hotfix to accomodate API Gateway header transformations
     */
    AccessValidator.prototype.getAuthToken = function(headers) {

        let _authToken = '';
        if (headers.Auth) {
            console.log(['Header token post transformation:', 'Auth'].join(' '));
            _authToken = headers.Auth;
        } else if (headers.auth) {
            console.log(['Header token post transformation:', 'auth'].join(' '));
            _authToken = headers.auth;
        }
        return _authToken;
    };

    return AccessValidator;

})();

module.exports = AccessValidator;
