/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

// Declare app level module which depends on views, and components
angular.module('dataLake', [
    'ui.router',
    'ngResource',
    'ngMessages',
    'AWS-UI-Components',
    'dataLake.service.auth',
    'dataLake.dashboard',
    'dataLake.package',
    'dataLake.search',
    'dataLake.cart',
    'dataLake.signin',
    'dataLake.confirm',
    'dataLake.forgot',
    'dataLake.profile',
    'dataLake.profile.changepassword',
    'dataLake.admin.invitation',
    'dataLake.admin.groups',
    'dataLake.admin.users',
    'dataLake.admin.settings',
    'dataLake.admin.group.create',
    'dataLake.admin.group',
    'dataLake.admin.user',
    'dataLake.version',
    'dataLake.goclick.goClick-directive',
    'dataLake.compareTo.compareTo-directive'
])

.filter('moment', function() {
    return function(dateString, format) {
        return moment(new Date(dateString)).format(format);
    };
})

.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/dashboard');
})

.run(function($rootScope, $state, authService) {
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        if (toState.authenticate) {
            authService.isAuthenticated().then(function(authenticated) {
                if (!authenticated) {
                    $state.transitionTo('signin');
                } else if (FEDERATED_LOGIN && !toState.activeWithFederation) {
                    $state.transitionTo('dashboard');
                }
                event.preventDefault();

            }).catch(function(result) {
                // User isn’t authenticated
                $state.transitionTo('signin');
                event.preventDefault();
            });
        } else if (toState.adminAuthenticate) {
            authService.isAdminAuthenticated().then(function(authenticated) {
                if (!authenticated) {
                    $state.transitionTo('signin');
                } else if (FEDERATED_LOGIN && !toState.activeWithFederation) {
                    $state.transitionTo('dashboard');
                }
                event.preventDefault();

            }).catch(function(result) {
                // Admin isn’t authenticated
                $state.transitionTo('signin');
                event.preventDefault();
            });

        }
        else if (FEDERATED_LOGIN && !toState.activeWithFederation) {
            $state.transitionTo('signin');
            event.preventDefault();
        }
    });
}
);
