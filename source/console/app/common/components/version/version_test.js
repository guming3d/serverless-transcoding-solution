/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

describe('dataLake.version module', function() {
    beforeEach(module('dataLake.version'));

    describe('version service', function() {
        it('should return current version', inject(function(
            version) {
            expect(version).toEqual(APP_VERSION);
        }));
    });
});
