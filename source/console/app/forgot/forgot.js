/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.forgot', [])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('forgot', {
        url: '/forgot',
        views: {
            '': {
                templateUrl: 'forgot/forgot.html',
                controller: 'ForgotCtrl'
            }
        },
        activeWithFederation: false
    });
}])

.controller('ForgotCtrl', function($scope, $state, authService) {

    $scope.message = '';
    $scope.errormessage = '';
    $scope.showVerification = false;
    $scope.user = {};

    $scope.forgotPassword = function(user, isValid) {
        $scope.message = '';
        $scope.errormessage = '';
        if (isValid) {
            authService.forgot(user).then(function(code) {
                if (code === 'INVITE_RESENT') {
                    $scope.message = 'Invite resent. Please check your email inbox.';
                } else {
                    $scope.showVerification = true;
                    $scope.user.email = user.email;
                }
            }, function(msg) {
                $scope.errormessage = 'An unexpected error has occurred. Please try again.';
                return;
            });

        } else {
            $scope.errormessage = 'There are still invalid fields.';
        }
    };

    $scope.changePassword = function(user, isValid) {
        $scope.message = '';
        $scope.errormessage = '';
        if (isValid) {
            authService.resetPassword(user).then(function() {
                $state.go('signin', {});
            }, function(msg) {
                $scope.errormessage = 'An unexpected error has occurred. Please try again.';
                return;
            });

        } else {
            $scope.errormessage = 'There are still invalid fields.';
        }
    };

});
