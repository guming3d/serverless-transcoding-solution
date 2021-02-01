/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

console.log('Loading function');
let lib = require('./lib');

exports.handler = function(event, context, callback) {
    console.log(event);

    lib.respond(event, function(error, response) {
        if (error) {
            console.error(error);
            return callback(null, error);
        } else {
            return callback(null, response);
        }
    });

};
