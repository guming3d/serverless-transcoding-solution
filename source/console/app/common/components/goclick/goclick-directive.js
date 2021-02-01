/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.goclick.goClick-directive', [])

.directive('goClick', function($window) {
    return function(scope, element, attrs) {
        var path;

        attrs.$observe('goClick', function(val) {
            path = val;
        });

        element.bind('click', function() {
            scope.$apply(function() {
                $window.open(path, '_blank');
            });
        });
    };
});
