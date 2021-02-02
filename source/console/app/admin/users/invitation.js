/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.admin.invitation', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.factory.admin'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('admin_invitation', {
        url: '/admin/invite',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@admin_invitation': {
                templateUrl: 'admin/users/invitation.html',
                controller: 'AdminInvitationCtrl'
            }
        },
        adminAuthenticate: true,
        activeWithFederation: false
    });
}])

.controller('AdminInvitationCtrl', function($scope, $state, $stateParams, $blockUI, adminInvitationFactory) {

    $scope.showCreateError = false;
    $scope.roles = [{
        value: 'Member',
        text: 'Member'
    }, {
        value: 'Admin',
        text: 'Admin'
    }];
    $scope.newinvite = {
        role: 'Member'
    };

    var _token = '';

    $scope.createInvitation = function(newinvite, isValid) {
        $blockUI.start();
        if (isValid) {
            adminInvitationFactory.createInvitation(newinvite, function(err,
                data) {
                if (err) {
                    console.log('error', err);
                    $scope.showCreateError = true;
                    $blockUI.stop();
                    return;
                }

                $state.go('admin_users', {});
            });
        } else {
            $scope.showCreateError = true;
            $blockUI.stop();
        }
    };

});
