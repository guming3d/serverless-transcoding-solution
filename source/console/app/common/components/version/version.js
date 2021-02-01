/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('dataLake.version', [
    'dataLake.version.interpolate-filter',
    'dataLake.version.version-directive'
])

.value('version', APP_VERSION);
