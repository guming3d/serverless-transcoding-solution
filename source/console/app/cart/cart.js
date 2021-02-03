/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.cart', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.factory.cart'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('cart', {
        url: '/cart',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@cart': {
                templateUrl: 'cart/cart.html',
                controller: 'CartCtrl'
            }
        },
        authenticate: true,
        activeWithFederation: true
    });
}])

.controller('CartCtrl', function($scope, $state, $blockUI, $_, cartFactory) {

    $scope.cart = [];
    $scope.manifests = [];
    $scope.showerror = false;
    $scope.tabs = [{
        label: '我的数据导出列表',
        id: 'tab_pending'
    }, {
        label: '我的清单文件',
        id: 'tab_manifests'
    }];
    $scope.currentTab = 'tab_pending';
    $scope.manifestType = 'signed-url';
    $scope.showCheckoutModal = false;

    var getCart = function() {
        $blockUI.start();
        cartFactory.listCart(function(err, cart) {
            if (err) {
                console.log('error', err);
                $scope.showerror = true;
                $blockUI.stop();
                return;
            }

            $scope.cart = $_.filter(cart, function(o) {
                return o.cart_item_status === 'pending' ||
                    o.cart_item_status === 'unable_to_process';
            });

            $scope.manifests = $_.where(cart, {
                cart_item_status: 'generated'
            });

            $scope.tabs = [{
                label: ['我的数据导出列表', '(', $scope.cart.length, ')'].join(' '),
                id: 'tab_pending'
            }, {
                label: ['我的清单文件', '(', $scope.manifests.length, ')'].join(' '),
                id: 'tab_manifests'
            }];

            $blockUI.stop();
        });
    };

    $scope.removeCartItem = function(itemid) {
        $blockUI.start();
        cartFactory.deleteCartItem(itemid, function(err, data) {
            if (err) {
                console.log('error', err);
                $scope.showerror = true;
                $blockUI.stop();
                getCart();
                return;
            }

            cartFactory.getCartCount(function(err, data) {
                if (err) {
                    console.log('error', err);
                    $scope.showError = true;
                    $scope.errorMessage =
                        'An unexpected error occurred when attempting to retrieve your updated cart items.';
                    $blockUI.stop();
                    return;
                }

                getCart();
            });

        });
    };

    $scope.refresh = function() {
        getCart();
    };

    $scope.checkout = function() {
        $scope.showCheckoutModal = true;
    };

    $scope.closeCheckoutModal = function() {
        $scope.manifestType = 'signed-url';
        $scope.showCheckoutModal = false;
    };

    $scope.generateManifest = function(type) {
        $scope.showCheckoutModal = false;
        $blockUI.start();
        cartFactory.checkoutCart(type, function(err, data) {
            if (err) {
                console.log('error', err);
                $scope.showerror = true;
                $blockUI.stop();
                getCart();
                return;
            }

            cartFactory.getCartCount(function(err, data) {
                getCart();
            });
        });
    };

    getCart();

});
