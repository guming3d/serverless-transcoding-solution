/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0 */

/**
 * @author Solution Builders
 */

'use strict';

const fs = require('fs');
const path = require('path');

let getFileList = function(path) {
    let fileInfo;
    let filesFound;
    let fileList = [];

    filesFound = fs.readdirSync(path);
    for (let i = 0; i < filesFound.length; i++) {
        fileInfo = fs.lstatSync([path, filesFound[i]].join('/'));
        if (fileInfo.isFile()) {
            fileList.push(filesFound[i]);
        }

        if (fileInfo.isDirectory()) {
            console.log([path, filesFound[i]].join('/'));
        }
    }

    return fileList;
};

// List all files in a directory in Node.js recursively in a synchronous fashion
let walkSync = function(dir, filelist) {
    // let filelist = []; //getFileList('./temp/site');
    let files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            filelist = walkSync(path.join(dir, file), filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });

    return filelist;
};

let _filelist = [];
let _manifest = {
    files: []
};
walkSync(process.argv[2]+'/site', _filelist);

for (let i = 0; i < _filelist.length; i++) {
    _manifest.files.push(_filelist[i].replace(process.argv[2]+'/site/', ''));
};

console.log(_manifest);
fs.writeFile(process.argv[2]+'/serverless-video-transcode-site-manifest.json', JSON.stringify(_manifest, null), function (err, data) {
    if (err) throw err;
});
