'use strict';

let token = (function() {

    if (!process.env.DATALAKE_ENDPOINT_HOST) {
        console.error('DATALAKE_ENDPOINT_HOST environment variable is not defined.');
        process.exit(1);
    }
    return "tk:dummyToken";

})();

module.exports = token;
