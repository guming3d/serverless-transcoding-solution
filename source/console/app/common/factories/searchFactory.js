/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.factory.search', ['ngResource', 'serverlessVideoTranscode.service.auth'])

.factory('searchFactory', function($resource, $state, authService) {

    var factory = {};

    var searchResource = function(token) {
        var _url = [APIG_ENDPOINT, '/search'].join('');
        return $resource(_url, {}, {
            query: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var statsResource = function(token) {
        var _url = [APIG_ENDPOINT, '/search/stats'].join('');
        return $resource(_url, {}, {
            query: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    factory.search = function(terms, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            searchResource(_token).query({
                term: terms
            }, function(data) {
                return cb(null, data.Items);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };


    factory.stats = function(cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            statsResource(_token).query({
            }, function(data) {
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
