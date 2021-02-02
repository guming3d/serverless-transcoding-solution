/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.admin.users', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.factory.admin'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('admin_users', {
        url: '/admin/users',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            }
        },
        adminAuthenticate: true,
        activeWithFederation: true
    });
}])

.filter('encodeURIComponent', function($window) {
    return $window.encodeURIComponent;
})

.controller('AdminUsersCtrl', function($scope, $state, $blockUI, adminUserFactory) {

    $scope.results = [];
    $scope.showerror = false;
    $scope.federatedLogin = FEDERATED_LOGIN;

    var getUsers = function() {
        $blockUI.start();
        adminUserFactory.listUsers(function(err, users) {
            if (err) {
                console.log('error', err);
                $scope.showerror = true;
                $blockUI.stop();
                return;
            }

            $scope.users = users;
            $blockUI.stop();
        });
    };

    $scope.refresh = function() {
        getUsers();
    };

    getUsers();

});
