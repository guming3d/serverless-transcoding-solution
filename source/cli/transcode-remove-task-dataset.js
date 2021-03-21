'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');

program
    .option('--task-id <value>', 'task identifier')
    .option('--dataset-id <value>', 'dataset identifier')
    .parse(process.argv);

if (!program.taskId) {
    console.error('option "--task-id <value>" argument required');
    process.exit(1);
}

if (!program.datasetId) {
    console.error('option "--dataset-id <value>" argument required');
    process.exit(1);
}


// send api request
let _apiproxy = new ApiProxy();
let _path = ['/prod/packages/', program.taskId, '/datasets/', program.datasetId].join('');
_apiproxy.sendApiRequest(_path, 'DELETE', null, Token, function(err, data) {
    if (err) {
        console.log(err);
        process.exit(1);
    }

    console.log(JSON.stringify(data, null, 4));
});
