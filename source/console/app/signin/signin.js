/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.signin', ['dataLake.utils'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider.state('signin', {
        url: '/signin',
        views: {
            '': {
                templateUrl: 'signin/signin.html',
                controller: 'SigninCtrl'
            }
        },
        activeWithFederation: true
    });
}])

.controller('SigninCtrl', function($scope, $state, authService, $blockUI, $window) {

    $scope.showLoginForm = true;
    $scope.errormessage = '';
    $blockUI.stop();

    if (FEDERATED_LOGIN) {
        $scope.showLoginForm = false;
        authService.signin().then(function(resp) {
            if (resp) {
                $state.go('dashboard', {});
            } else {
                $window.open(LOGIN_URL, '_self');
            }
        }, function(msg) {
            $window.open(LOGIN_URL, '_self');
        });
    }

    $scope.signin = function(user, isValid) {

        if (isValid) {
            authService.signin(user, '').then(function(resp) {
                if (resp.state == 'login_success') {
                    $state.go('dashboard', {});
                } else if (resp.state == 'new_password_required') {
                    $state.go('confirm', {
                        email: user.email,
                        password: user.password
                    });
                }
            }, function(msg) {
                $scope.errormessage = 'Unable to sign in user. Please check your username and password.';
                if ($scope.$$phase != '$digest') {
                    $scope.$apply();
                }

                return;
            });
        } else {
            $scope.errormessage = 'There are still invalid fields.';
        }
    };

});
