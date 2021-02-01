/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

angular.module('serverlessVideoTranscode.version', [
    'serverlessVideoTranscode.version.interpolate-filter',
    'serverlessVideoTranscode.version.version-directive'
])

.value('version', APP_VERSION);
