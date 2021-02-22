/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.dashboard', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('dashboard', {
        url: '/dashboard',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@dashboard': {
                templateUrl: 'dashboard/dashboard.html',
                controller: 'DashboardCtrl'
            }
        },
        authenticate: true,
        activeWithFederation: true
    });
}])

.controller('DashboardCtrl', function($scope, $state, $localstorage, $blockUI, searchFactory) {

    $scope.showIntroModal = false;
    $scope.currentSlide = 0;
    $scope.slideTitle = '欢迎使用AWS无服务器视频转码解决方案解决方案';
    $scope.navText = '下一页';
    $scope.ownedPackages = 0;
    $scope.accessiblePackages = 0;

    var loadStats = function() {
        $blockUI.start();

        searchFactory.stats(function(err, stats) {
            if(stats){
              $scope.ownedPackages = stats.owned_packages;
              $scope.accessiblePackages = stats.accessible_packages;
            }else{
              $scope.ownedPackages = 0;
              $scope.accessiblePackages = 0;
            }
            $state.go('search', {
                terms: '*'
            });
            $blockUI.stop();
        });
    };

    $scope.search = function(terms) {
        $state.go('search', {
            terms: terms
        });
    };

    $scope.nextIntroSlide = function() {
        $scope.currentSlide++;
        switch ($scope.currentSlide) {
            case 1:
                $scope.slideTitle = '安全，耐用和高度可扩展';
                break;
            case 2:
                $scope.slideTitle = '上载新数据或链接现有数据';
                break;
            case 3:
                $scope.slideTitle = '访问您感兴趣的数据';
                $scope.navText = '开始使用';
                break;
            case 4:
                $localstorage.set('showIntro', 'false');
                $scope.showIntroModal = false;
                break;
            default:
                break;
        }
    };

    if ($localstorage.get('showIntro', 'true') === 'true') {
        $scope.showIntroModal = false;
    }

    loadStats();
});
