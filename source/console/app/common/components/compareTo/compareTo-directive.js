/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.compareTo.compareTo-directive', [])

.directive('compareTo', [function() {
    return {
        require: 'ngModel',
        scope: {
            compareTo: '='
        },
        link: function(scope, element, attributes, ngModel) {

            ngModel.$validators.compareTo = function(modelValue) {
                return modelValue == scope.compareTo;
            };

            scope.$watch('otherModelValue', function() {
                ngModel.$validate();
            });
        }
    };
}]);
