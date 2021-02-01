/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.utils', [])

.factory('$_', function() {
    return window._;
})

.factory('$blockUI', function($document) {
    return {
        start: function() {
            var _body = $document.find('body').eq(0);
            _body.addClass('block-ui-active block-ui-visible');
        },
        stop: function() {
            var _body = $document.find('body').eq(0);
            _body.removeClass('block-ui-active');
            _body.removeClass('block-ui-visible');
        }
    };
})

.factory('$localstorage', ['$window', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        remove: function(key) {
            $window.localStorage.removeItem(key);
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        }
    };
}]);
