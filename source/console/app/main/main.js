/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.main', ['dataLake.factory.cart'])

.controller('MainCtrl', function($scope, $state, $location, $rootScope, authService, cartFactory, $interval) {
    var callAtInterval = function () {
        window._keycloak.updateToken(30).then(function() {
            localStorage.setItem('keycloak_token', window._keycloak.token);
        }).catch(function() {
            alert('Failed to refresh token');
        });;
    };
    $interval(callAtInterval, 30000);

    $scope.username = '';
    $scope.cartCount = 0;
    $scope.showadmin = false;
    $scope.showUsers = false;
    $scope.showGroups = false;

    authService.getUserInfo().then(function(result) {
        $rootScope.username = result.display_name;
        $scope.username = $rootScope.username;
        if (result.role.toLowerCase() !== 'admin') {
            var myEl = angular.element(document.querySelector('#adminMenu'));
            myEl.empty();
        } else {
            $scope.showadmin = true;
            $scope.showUsers = true;
            $scope.showGroups = !FEDERATED_LOGIN;
        }
    }, function(msg) {
        console.log('Unable to retrieve the user session.');
        // $state.go('signin', {});
    });

    $scope.$watch(function() {
        return cartFactory.cartCount;
    }, function(NewValue, OldValue) {
        $scope.cartCount = NewValue;
        if ($scope.$$phase != '$digest') {
            $scope.$apply();
        }
    });

    cartFactory.getCartCount(function(err, count) {
        if (err) {
            console.log('error', err);
            return;
        }
    });

    $scope.getMenuClass = function(path) {
        return ($location.path().substr(0, path.length) === path) ? 'active' : '';
    };

    $scope.signout = function() {
        if (authService.signOut()) {
            $state.go('signin', {});
        }
    };

});
