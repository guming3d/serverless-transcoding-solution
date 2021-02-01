/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.admin.groups', ['dataLake.main', 'dataLake.utils', 'dataLake.factory.admin'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('admin_groups', {
        url: '/admin/groups',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@admin_groups': {
                templateUrl: 'admin/groups/groups.html',
                controller: 'AdminGroupsCtrl'
            }
        },
        adminAuthenticate: true,
        activeWithFederation: false
    });
}])

.controller('AdminGroupsCtrl', function($scope, $state, $blockUI, adminGroupFactory) {

    $scope.groups = [];
    $scope.awsUiAlert = {}
    $scope.awsUiAlert.show = false;
    $scope.awsUiAlert.type = "";
    $scope.awsUiAlert.header = "";
    $scope.awsUiAlert.content = "";

    var getGroups = function() {
        $scope.dismissAwsUiAlert();
        $blockUI.start();

        adminGroupFactory.listGroups(function(err, data) {
            if (err) {
                if (err.data) {
                    showErrorAlert(err.data.message);
                } else {
                    $blockUI.stop();
                }
                return;
            }

            $scope.groups = data.Groups;
            $blockUI.stop();
        });
    };

    $scope.refresh = function() {
        getGroups();
    };

    $scope.dismissAwsUiAlert = function() {
        $scope.awsUiAlert.show = false;
        $scope.awsUiAlert.type = "";
        $scope.awsUiAlert.header = "";
        $scope.awsUiAlert.content = "";
    };

    var showSuccessAlert = function(message) {
        $scope.awsUiAlert.type = "success";
        $scope.awsUiAlert.header = "Success";
        $scope.awsUiAlert.content = message;
        $scope.awsUiAlert.show = true;
        $blockUI.stop();
    };

    var showErrorAlert = function(message) {
        $scope.awsUiAlert.type = "error";
        $scope.awsUiAlert.header = "Error";
        $scope.awsUiAlert.content = message;
        $scope.awsUiAlert.show = true;
        $blockUI.stop();
    };

    getGroups();

});
