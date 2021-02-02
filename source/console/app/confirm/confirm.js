/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.confirm', [])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('confirm', {
        url: '/confirm',
        params: {
            email: '',
            password: ''
        },
        views: {
            '': {
                templateUrl: 'confirm/confirm.html',
                controller: 'ConfirmCtrl'
            }
        },
        activeWithFederation: false
    });
}])

.controller('ConfirmCtrl', function($scope, $state, $stateParams, authService) {

    $scope.errormessage = '';

    $scope.setPassword = function(newuser, isValid) {
        if (isValid) {
            newuser.email = $stateParams.email;
            newuser.password = $stateParams.password;

            authService.signin(newuser, 'password_challenge').then(function() {
                $state.go('dashboard', {});
            }, function(msg) {
                $scope.errormessage = 'An unexpected error has occurred. Please try again.';
                return;
            });

        } else {
            $scope.errormessage = 'There are still invalid fields.';
        }
    };

});
