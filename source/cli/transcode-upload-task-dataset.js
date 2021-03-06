'use strict';

let program = require('commander');
let Token = require('./core/token.js');
let ApiProxy = require('./core/apiproxy.js');
const path = require('path');
const fs = require('fs');
const https = require("https");
const request = require('request');

program
    .option('--task-id <value>', 'task identifier')
    .option('--file <file path>', 'path to dataset file')
    .option('--content-type <value>', 'content type of dataset file')
    .parse(process.argv);

if (!program.taskId) {
    console.error('option "--task-id <value>" argument required');
    process.exit(1);
}

if (!program.file) {
    console.error('option "--file <file path>" argument required');
    process.exit(1);
}

if (!program.contentType) {
    console.error('option "--content-type <value>" argument required');
    process.exit(1);
}

let _stats = fs.lstat(program.file, function(err, stats) {
    if (err) {
        console.error('error accessing provided --file argument');
        process.exit(1);
    }



    // send api request
    let _apiproxy = new ApiProxy();
    let _basename = path.basename(program.file);

    let _payload = JSON.stringify({
        name: _basename,
        type: 'dataset',
        content_type: program.contentType
    });
    let _path = ['/prod/tasks/', program.taskId, '/datasets/new'].join('');
    _apiproxy.sendApiRequest(_path, 'POST', _payload, Token, function(err, data) {
        if (err) {
            console.log(err);
            process.exit(1);
        }

        let _stream = fs.createReadStream(program.file);

        var options = {
            url: data.uploadUrl,
            timeout: 3600000,
            headers: {
                'Content-Type': program.contentType,
                'Content-Length': stats.size
            }
        };

        fs.createReadStream(program.file).pipe(request.put(options).on('response', function(response) {

            if (response.statusCode !== 200) {
                console.log('The manifest entry was created, but the file failed to upload.');
                process.exit(1);
            }

            let _datasetPath = ['/prod/tasks/', program.taskId, '/datasets/',
                data.dataset_id
            ].join('');
            _apiproxy.sendApiRequest(_datasetPath, 'GET', null, Token, function(
                err, dataset) {
                if (err) {
                    console.log(err);
                    process.exit(1);
                }

                console.log(JSON.stringify(data, null, 4));
            });

        }));
    });
});
