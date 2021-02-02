/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.admin.group.create', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.factory.admin'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('group', {
        url: '/admin/groups/create_group',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@group': {
                templateUrl: 'admin/groups/createGroup.html',
                controller: 'AdminCreateGroupCtrl'
            }
        },
        adminAuthenticate: true,
        activeWithFederation: false
    });
}])

.controller('AdminCreateGroupCtrl', function($scope, $state, $stateParams, $blockUI, adminGroupFactory) {

    $scope.awsUiAlert = {}
    $scope.awsUiAlert.show = false;
    $scope.awsUiAlert.type = "";
    $scope.awsUiAlert.header = "";
    $scope.awsUiAlert.content = "";

    $scope.showFormErrors = false;
    $scope.newGroup = {};
    var _token = '';

    $scope.createGroup = function(newGroup, isValid) {
        $blockUI.start();
        if (isValid) {
            $scope.showFormErrors = false;
            adminGroupFactory.createGroup(newGroup.name, newGroup.description, function(err, data) {
                if (err) {
                    showErrorAlert(`Error ${err.data.code} - ${err.data.message}`);
                    return;
                }

                console.log(JSON.stringify(data));
                $state.go('admin_groups', {});
            });
        } else {
            $scope.showFormErrors = true;
            $blockUI.stop();
        }
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

});
