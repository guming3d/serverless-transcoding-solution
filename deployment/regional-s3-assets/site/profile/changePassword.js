/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.profile.changepassword', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.service.auth'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('changePassword', {
        url: '/profile/changepassword',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@changePassword': {
                templateUrl: 'profile/changePassword.html',
                controller: 'ChangePasswordCtrl'
            }
        },
        authenticate: true,
        activeWithFederation: false
    });
}])

.controller('ChangePasswordCtrl', function($scope, $state, $stateParams, $blockUI, authService) {

    $scope.changeinfo = {
        newPassword: ''
    };
    $scope.showError = false;

    $scope.changePassword = function(newinfo, isValid) {
        $blockUI.start();
        if (isValid) {
            authService.changePassword(newinfo.oldPassword, newinfo.newPassword).then(function(resp) {
                    $blockUI.stop();
                    $state.go('profile', {});
                },
                function(msg) {
                    $blockUI.stop();
                    $scope.showError = true;
                    console.log('Unable to change the user password.');
                    return;
                });
        } else {
            $scope.showError = true;
            $blockUI.stop();
        }
    };

});
