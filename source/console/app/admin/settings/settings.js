/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.admin.settings', ['serverlessVideoTranscode.main', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.factory.admin'])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider.state('settings', {
        url: '/admin/settings',
        views: {
            '': {
                templateUrl: 'main/main.html',
                controller: 'MainCtrl'
            },
            '@settings': {
                templateUrl: 'admin/settings/settings.html',
                controller: 'AdminSettingsCtrl'
            }
        },
        adminAuthenticate: true,
        activeWithFederation: true
    });
}])

.controller('AdminSettingsCtrl', function($scope, $state, $blockUI, adminSettingsFactory) {

    $scope.showerror = false;
    $scope.appconfig = null;
    $scope.metadataGovernance = [];
    $scope.tag_governance = [{
        value: 'Optional',
        text: 'Optional'
    }, {
        value: 'Required',
        text: 'Required'
    }];
    $scope.tabs = [{
        label: '通用设置',
        id: 'tab_general'
    }];
    $scope.currentTab = 'tab_general';

    var getSettings = function() {
        $blockUI.start();
        adminSettingsFactory.listConfigSettings(function(err, appconfig) {
            if (err) {
                console.log('error', err);
                $scope.showerror = true;
                $blockUI.stop();
                return;
            }

            $scope.appconfig = appconfig;

            adminSettingsFactory.listGovernanceSettings(function(err, governance) {
                if (err) {
                    console.log('error', err);
                    $scope.showerror = true;
                    $blockUI.stop();
                    return;
                }

                $scope.metadataGovernance = governance;
                $blockUI.stop();
            });
        });
    };

    $scope.updateAppSettings = function(config, isValid) {
        $blockUI.start();
        if (isValid) {
            adminSettingsFactory.updateConfigSettings(config, function(err,
                data) {
                if (err) {
                    console.log('error', err);
                    $scope.showError = true;
                    $blockUI.stop();
                    return;
                }

                getSettings();
            });
        } else {
            $scope.showError = true;
            $blockUI.stop();
        }
    };

    $scope.addMetadataGovernance = function() {
        var _governance = {
            setting: {
                tag: '',
                governance: '',
                _state: 'new'
            }
        };

        $scope.metadataGovernance.push(_governance);
    };

    $scope.removeMetadataGovernance = function(index) {
        if (index > -1 && index < $scope.metadataGovernance.length) {
            $scope.metadataGovernance[index].setting._state = 'deleted';
        }
    };

    var processSetting = function(index, cb) {
        if (index < $scope.metadataGovernance.length) {
            if ($scope.metadataGovernance[index].setting._state === 'new') {
                if ($scope.metadataGovernance[index].setting.tag.trim() !== '') {
                    if ($scope.metadataGovernance[index].setting.governance === '') {
                        $scope.metadataGovernance[index].setting.governance = 'Optional';
                    }

                    var _governance = {
                        setting: {
                            tag: $scope.metadataGovernance[index].setting.tag,
                            governance: $scope.metadataGovernance[index].setting.governance
                        }
                    };
                    adminSettingsFactory.createGovernanceSetting(_governance, function(err, data) {
                        if (err) {
                            console.log('error', err);
                        }

                        processSetting(index + 1, cb);
                    });
                } else {
                    processSetting(index + 1, cb);
                }
            } else if ($scope.metadataGovernance[index].setting._state === 'deleted') {
                adminSettingsFactory.deleteGovernanceSetting($scope.metadataGovernance[index].setting_id,
                    function(err, data) {
                        if (err) {
                            console.log('error', err);
                        }

                        processSetting(index + 1, cb);
                    });
            } else if ($scope.metadataGovernance[index].setting._state === 'updated') {
                var _governance = {
                    setting_id: $scope.metadataGovernance[index].setting_id,
                    type: $scope.metadataGovernance[index].type,
                    setting: {
                        tag: $scope.metadataGovernance[index].setting.tag,
                        governance: $scope.metadataGovernance[index].setting.governance
                    },
                    created_at: $scope.metadataGovernance[index].created_at,
                    updated_at: $scope.metadataGovernance[index].updated_at
                };
                adminSettingsFactory.updateGovernanceSetting(_governance,
                    function(err, data) {
                        if (err) {
                            console.log('error', err);
                        }

                        processSetting(index + 1, cb);
                    });
            } else {
                processSetting(index + 1, cb);
            }
        } else {
            return cb(null, 'done processing settings.');
        }
    };

    $scope.saveGovernanceSettings = function() {
        $blockUI.start();
        processSetting(0, function(err, cb) {
            if (err) {
                console.log('error', err);
                $scope.showError = true;
                $blockUI.stop();
                return;
            }

            getSettings();
        });
    };

    $scope.governanceChanged = function(index) {
        if ($scope.metadataGovernance[index].setting._state !== 'new' && $scope.metadataGovernance[index].setting
            ._state !== 'deleted') {
            $scope.metadataGovernance[index].setting._state = 'updated';
        }
    };

    $scope.cancelGovernanceEdits = function() {
        getSettings();
    };

    $scope.refresh = function() {
        getSettings();
    };

    getSettings();

});
