/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.factory.task', ['ngResource', 'serverlessVideoTranscode.utils', 'serverlessVideoTranscode.service.auth'])

.factory('dataPackageFactory', function($resource, $_, $state, authService) {

    var factory = {};

    var datatasksResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks'].join('/');
        return $resource(_url, {}, {
            getGovernance: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var datapackageResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId'].join('/');
        return $resource(_url, {
            taskId: '@taskId'
        }, {
            get: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            },
            create: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            },
            remove: {
                method: 'DELETE',
                headers: {
                    Auth: token
                }
            },
            save: {
                method: 'PUT',
                headers: {
                    Auth: token
                }
            }
        });
    };


    var tablesResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/tables'].join('/');
        return $resource(_url, {
            taskId: '@taskId'
        }, {
            getTables: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var tableResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/tables/:tableName'].join('/');
        return $resource(_url, {
            taskId: '@taskId',
            tableName: '@tableName'
        }, {
            viewTableData: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var crawlerResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/crawler'].join('/');
        return $resource(_url, {
            taskId: '@taskId'
        }, {
            getCrawler: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            },
            startCrawler: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            },
            updateOrCreateCrawler: {
                method: 'PUT',
                headers: {
                    Auth: token
                }
            }
        });
    };

    factory.listGovernanceRequirements = function(cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datatasksResource(_token).getGovernance({}, {
                operation: 'required_metadata'
            }, function(data) {
                return cb(null, data.Items);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.getDataPackage = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datapackageResource(_token).get({
                taskId: taskId
            }, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }
                return cb(null, data.Item);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.createDataPackage = function(taskId, newtask, cb) {

        authService.getUserAccessTokenWithUsername().then(function(data) {
            var _token = ['tk:', data.token.jwtToken].join('');
            newtask.owner = data.username;
            datapackageResource(_token).create({
                taskId: taskId
            }, newtask, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }
                return cb(null, data);
            }, function(err) {
                console.log(err);
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.deleteDataPackage = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datapackageResource(_token).remove({
                taskId: taskId
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.updateDataPackage = function(taskId, newtask, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datapackageResource(_token).save({
                taskId: taskId
            }, newtask, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    //-------------------------------------------------------------------------
    // [AWS Glue Integration] Crawler
    //-------------------------------------------------------------------------
    factory.getCrawler = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            crawlerResource(_token).getCrawler({
                taskId: taskId
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.startCrawler = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            crawlerResource(_token).startCrawler({
                taskId: taskId
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.updateOrCreateCrawler = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            crawlerResource(_token).updateOrCreateCrawler({
                taskId: taskId
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    //-------------------------------------------------------------------------
    // [AWS Glue Integration] Table
    //-------------------------------------------------------------------------
    factory.getTables = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            tablesResource(_token).getTables({
                taskId: taskId
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    //-------------------------------------------------------------------------
    // [Amazon Athena Integration] Table Data
    //-------------------------------------------------------------------------
    factory.viewTableData = function(taskId, tableName, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            tableResource(_token).viewTableData({
                taskId: taskId,
                tableName: tableName
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    return factory;

})

.factory('metadataFactory', function($resource, $_, $state, authService) {

    var factory = {};

    var packageMetadataResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/metadata'].join('/');
        return $resource(_url, {
            taskId: '@taskId'
        }, {
            query: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var metadataResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/metadata/:metadataId'].join('/');
        return $resource(_url, {
            taskId: '@taskId',
            metadataId: '@metadataId'
        }, {
            get: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            },
            create: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            },
            remove: {
                method: 'DELETE',
                headers: {
                    Auth: token
                }
            }
        });
    };

    factory.listPackageMetadata = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            packageMetadataResource(_token).query({
                taskId: taskId
            }, function(data) {
                return cb(null, data.Items);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.getMetadata = function(taskId, metadataid, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            metadataResource(_token).get({
                taskId: taskId,
                metadataId: metadataid
            }, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data.Item);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.createMetadata = function(taskId, newmetadata, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            metadataResource(_token).create({
                taskId: taskId,
                metadataId: 'new'
            }, newmetadata, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data);
            }, function(err) {
                console.log(err)
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.deleteMetadata = function(taskId, metadataid, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            metadataResource(_token).remove({
                taskId: taskId,
                metadataId: metadataid
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    return factory;

})

.factory('datasetFactory', function($resource, $_, $state, authService) {

    var factory = {};

    var packageDatasetResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/datasets'].join('/');
        return $resource(_url, {
            taskId: '@taskId'
        }, {
            query: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var datasetResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/datasets/:datasetId'].join('/');
        return $resource(_url, {
            taskId: '@taskId',
            datasetId: '@datasetId'
        }, {
            get: {
                method: 'GET',
                headers: {
                    Auth: token
                }
            },
            create: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            },
            remove: {
                method: 'DELETE',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var datasetProcessResource = function(token) {
        var _url = [APIG_ENDPOINT, 'tasks/:taskId/datasets/:datasetId/process'].join('/');
        return $resource(_url, {
            taskId: '@taskId',
            datasetId: '@datasetId'
        }, {
            process: {
                method: 'POST',
                headers: {
                    Auth: token
                }
            }
        });
    };

    var s3Resource = function(url, filetype) {
        return $resource(
            url, {}, {
                upload: {
                    method: 'PUT',
                    headers: {
                        'Content-Type': filetype
                    }
                }
            });
    };

    factory.listPackageDatasets = function(taskId, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            packageDatasetResource(_token).query({
                taskId: taskId
            }, function(data) {
                return cb(null, data.Items);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });
    };

    factory.getDataset = function(taskId, datasetid, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datasetResource(_token).get({
                taskId: taskId,
                datasetId: datasetid
            }, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data.Item);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.createDataset = function(taskId, newdataset, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datasetResource(_token).create({
                taskId: taskId,
                datasetId: 'new'
            }, newdataset, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.deleteDataset = function(taskId, datasetid, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datasetResource(_token).remove({
                taskId: taskId,
                datasetId: datasetid
            }, function(data) {
                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    factory.uploadFile = function(url, filetype, file, cb) {
        s3Resource(url, filetype).upload({}, file, function(data) {
            return cb(null, data);
        }, function(err) {
            return cb(err, null);
        });
    }

    factory.processManifest = function(taskId, datasetid, cb) {

        authService.getUserAccessToken().then(function(token) {
            var _token = ['tk:', token.jwtToken].join('');
            datasetProcessResource(_token).process({
                taskId: taskId,
                datasetId: datasetid
            }, {}, function(data) {
                if ($_.isEmpty(data)) {
                    return cb(null, data);
                }

                return cb(null, data);
            }, function(err) {
                return cb(err, null);
            });
        }, function(msg) {
            console.log('Unable to retrieve the user session.');
            $state.go('signin', {});
        });

    };

    return factory;

});
