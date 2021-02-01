/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.factory.profile', ['ngResource', 'serverlessVideoTranscode.service.auth'])

.factory('profileFactory', function($resource, $state, authService) {

    var factory = {};

    var profileResource = function(token) {
        var _url = [APIG_ENDPOINT, 'profile'].join('/');
        return $resource(_url, {}, {
            get: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var profileKeyResource = function(token) {
        var _url = [APIG_ENDPOINT, 'profile/apikey'].join('/');
        return $resource(_url, {}, {
            get: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    factory.getProfile = function(cb) {
        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            profileResource(_token).get({}, function(data) {
                if (data.errorMessage) {
                    return cb(data.error, null);
                }

                return cb(null, data);
            }, function(err) {
                console.log(err);
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });
    };

    factory.getApiKey = function(cb) {
        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            profileKeyResource(_token).get({}, function(data) {
                if (data.errorMessage) {
                    return cb(data.error, null);
                }

                return cb(null, data);
            }, function(err) {
                console.log(err);
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });
    };

    return factory;

});
