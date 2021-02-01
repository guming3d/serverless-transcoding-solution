/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.profile', ['dataLake.main', 'dataLake.utils', 'dataLake.factory.profile',
    'dataLake.service.auth'
])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('profile', {
        url: '/profile',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@profile': {
                templateUrl: 'profile/profile.html',
                controller: 'ProfileCtrl'
            }
        },
        authenticate: true,
        activeWithFederation: true
    });
}])

.controller('ProfileCtrl', function($scope, $state, $stateParams, $blockUI, authService, profileFactory) {

    $scope.title = '';
    $scope.user = {};
    $scope.profile = {};
    $scope.secret = '';

    $scope.awsUiAlert = {}
    $scope.awsUiAlert.show = false;
    $scope.awsUiAlert.criticalError = false;
    $scope.awsUiAlert.type = "";
    $scope.awsUiAlert.header = "";
    $scope.awsUiAlert.content = "";
    $scope.showChangePassword = false;

    var getUserDetails = function() {
        $blockUI.start();
        $scope.dismissAwsUiAlert();

        authService.getUserInfo().then(function(result) {
            profileFactory.getProfile(function(err, profile) {
                if (err) {
                    showErrorAlert(err.data.message, true);
                    return;
                }

                $scope.profile = profile;
                $scope.user = result;
                $scope.showChangePassword = !FEDERATED_LOGIN;
                $blockUI.stop();
            });
        }, function(msg) {
            $blockUI.stop();
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    $scope.closeSecretModal = function() {
        $scope.secret = '';
        $scope.showSecretModal = false;
    };

    $scope.changePassword = function() {
        $state.go('changePassword', {});
    };

    $scope.generateSecretKey = function() {
        profileFactory.getApiKey(function(err, secret) {
            if (err) {
                console.log('error', err);
                $blockUI.stop();
                return;
            }

            $scope.secret = secret;
            $scope.showSecretModal = true;
            $blockUI.stop();
        });

    };

    $scope.dismissAwsUiAlert = function() {
        $scope.awsUiAlert.show = false;
        $scope.awsUiAlert.criticalError = false;
        $scope.awsUiAlert.type = "";
        $scope.awsUiAlert.header = "";
        $scope.awsUiAlert.content = "";
    };

    var showSuccessAlert = function(message) {
        $scope.awsUiAlert.type = "success";
        $scope.awsUiAlert.header = "Success";
        $scope.awsUiAlert.content = message;
        $scope.awsUiAlert.show = true;
        $scope.awsUiAlert.criticalError = false;
        $blockUI.stop();
    };

    var showErrorAlert = function(message, critical = false) {
        $scope.awsUiAlert.type = "error";
        $scope.awsUiAlert.header = "Error";
        $scope.awsUiAlert.content = message;
        $scope.awsUiAlert.show = true;
        $scope.awsUiAlert.criticalError = critical;
        $blockUI.stop();
    };

    getUserDetails();

});
