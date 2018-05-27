'use strict';
require('dotenv').config();

const express = require('express');
const q = require('q');
const fs = require('fs');
const cors = require('cors');
const execFile = q.denodeify(require('child_process').execFile);
const musicMetadata = require('music-metadata');
const path = require('path');
const ws = require('./ws');
const config = require('./config.js');

const files = config.files;

const app = express();

app.listen(3030, () => console.log('Listening...'));

const whitelist = ['http://localhost:3032', new RegExp('^http://.*:3032'), new RegExp('^http://.*:3000')];

const corsOptions = {
    origin: (origin, callback) => {
        let some = whitelist.find(white =>
            (typeof white == 'string' && white == origin) ||
            (white.test && white.test(origin))
        );

        if(!some) {
            callback(new Error("CORS FAIL"));
        }
        else {
            callback(null, true);
        }
    },
};

app.get('/files.json', cors(corsOptions), (req, res) => {
    res.json(files);
})

const getDuration = (filename) => {
    return q.resolve()
        .then(() => musicMetadata.parseFile(filename))
        .then(meta => {
            return meta.format.duration * 1000;
        });
};

q.resolve()
    .then(() => getDuration(path.join(__dirname + '/frontend/public/audio', files[0])))
    .then(audioLength => {
        let startTime = Date.now();

        ws.init(startTime, audioLength, files.map(x => 'audio/' + x));
    })
    .catch(e => {
        console.error(e);
        metaFile.close();
        process.exit(1);
    });
