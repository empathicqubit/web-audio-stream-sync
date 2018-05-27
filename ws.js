'use strict';
const express = require('express');    
const ws = require('ws');
const q = require('q');
const fs = require('fs');
const cors = require('cors');
const execFile = q.denodeify(require('child_process').execFile);
const path = require('path');
const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const readFile = q.denodeify(fs.readFile);

let PASSWORD = require('./config').password;

let storage = lowdb(new FileSync(path.join(__dirname, 'storage.json')));

let _savedSources = storage.get('savedSources').value();

const savedSources = (set) => {
    if(set) {
        _savedSources = set
        storage.set('savedSources', _savedSources).write();
    }

    return _savedSources;
}

_savedSources = _savedSources || savedSources({}); 

let poller;
let startTime;
let audioLength;
let defaultSources;
let muted = false;
let words = []; 

readFile('words.txt', 'utf8')
    .then(data => words = data.split(/[\r\n]+/gi));  

let wsServer;

const originAllowed = origin => {
    console.log(origin);

    return true;
};

const wsSend = (client, data) => q.denodeify(client.send.bind(client))(JSON.stringify(data));

const wsBroadcast = data => {
    if(data.constructor.name == 'WebSocket') {
        throw new Error('You can\'t pass a socket to this function! Broadcast propagates to all connected clients.');
    }
    return Promise.all(
        Array.from(wsServer.clients).map(client => {
            if(client.readyState != ws.OPEN) {
                return null;
            }

            return client._sendPromise(JSON.stringify(typeof data == 'function' ? data() : data));
        })
    );
}

const setSources = (client, dontBroadcast) => {
    let ss = savedSources();
    if(!client.sources || !client.sources.length) {
        let clientSources = ss[client.name];
        if(clientSources && clientSources.length) {
            client.sources = clientSources;
        }
        else {
            client.sources = defaultSources.map(x => Object.assign({}, x));
        }
    }

    let msg = {
        type: 'set_sources',  
        id: client.id,
        sources: client.sources,
    };

    ss[client.name] = client.sources;

    savedSources(ss);

    return dontBroadcast
        ? wsSend(msg)
        : wsBroadcast(msg)
};

const broadcastTimeCode = () => {
    return wsBroadcast(() => {
        let timeCode = muted ? -1 : (Date.now() - startTime) % audioLength;
        return {type: 'timecode', timecode: timeCode, timestamp: Date.now() }
    })
    .then(setPoller, setPoller);
};

const stopPoller = () => poller && clearTimeout(poller);
 
const setPoller = () => {
    stopPoller();
    return poller = setTimeout(broadcastTimeCode, 100);
};

const initServer = () => {
    wsServer = new ws.Server({
        port: 3031,
    });

    wsServer.on('connection', (client, req) => {
        client.admin = false;
        client.sources = [];
        client.id = Math.floor(Math.random() * 1000000);
        client.name = client.id;
        client.hello = false;
        // Attempt to reduce latency.
        client._sendPromise = q.denodeify(client.send.bind(client));

        client.on('message', msg => {
            try {
                let data = JSON.parse(msg); 
                if(data.type == 'hello') {
                    Promise.resolve()
                        .then(() => {
                            client.name = data.name || client.name;
                            client.hello = true;

                            return wsSend(client, {
                                type: 'hello',
                                id: client.id,
                                name: client.name,
                                offset: Date.now() - data.timestamp,
                                timestamp: Date.now(),
                            });
                        })
                        .then(() => setSources(client))
                        .then(() => 
                            wsBroadcast({
                                type: 'client_add',
                                id: client.id,
                                sources: client.sources,
                                name: client.name
                            })
                        )
                        .catch(console.error);
                }
                else if(data.type == 'hello_admin') {
                    // Gecting the password wrong shouldn't cause a disconnect.
                    if(data.password == PASSWORD) {
                        wsSend(client, data); 

                        client.hello = client.admin = true;
                    }
                }
                else if(!client.hello) {
                    client.close();
                    return;
                }
                else if(data.type == 'get_sources') {
                    setSources(srcClient, true);
                }
                else if(data.type == 'set_name') {
                    client.name = data.name;
                    client.sources = [];
                    setSources(client);

                    wsBroadcast({
                        type: 'set_name',
                        id: client.id,
                        name: client.name,
                    });
                }
                // Admin functions. This isn't secure but whatever.
                else if(client.admin) {
                    if(data.id && data.url) {
                        let srcClient = Array.from(wsServer.clients).find(x => x.id == data.id);
                        if(!srcClient) {
                            console.log(`Client ${data.id} not found!`);
                            return;
                        }

                        let source = srcClient.sources.find(x => x.url == data.url);

                        if(!source) {
                            console.log(`Source ${data.url} not found!`);
                            return;
                        }

                        if(data.type == 'admin_sources') {
                            source.enabled = data.enabled;

                            setSources(srcClient);
                        }
                        else if(data.type == 'admin_gain') {
                            source.gain = data.gain;

                            setSources(srcClient);
                        }
                        else if(data.type == 'admin_pan') {
                            source.pan = data.pan;

                            setSources(srcClient);
                        }
                    }
	            else if(data.type == 'admin_timecode') {
			startTime = Date.now() - data.timecode;
		    }
                    else if(data.type == 'admin_mute') {
                        muted = true;
                    }
                    else if(data.type == 'admin_unmute') {
                        muted = false;
                    }
                    else if(data.type == 'admin_restart') {
                        startTime = Date.now();
                    }
                    else if(data.type == 'get_clients') {
                        let json = {
                            type: 'get_clients', 
                            clients: Array.from(wsServer.clients).filter(x => !x.admin && x.hello).map(client => ({
                                sources: client.sources,
                                name: client.name,
                                id: client.id,
                            })),
                        };

                        wsSend(client, json);
                    }
                }
            }
            catch(e) {
                console.error(e);
            }
        });

        client.on('close', () => {
            console.log('Disconnection');

            wsBroadcast({
                type: 'client_remove',
                id: client.id,
            });
        });

        client.on('error', console.error);
    });
};

module.exports = {
    init: (st, al, s) => {
        audioLength = al;
        startTime = st;
        defaultSources = s.map(x => ({
            enabled: false,
            url: x,
            pan: 0,
            gain: 1,
        }));

        for(let k in _savedSources) {
            let def = defaultSources[0];
            let sources = _savedSources[k];

            if(sources.every(x => x.pan === def.pan && def.gain === x.gain && def.enabled === x.enabled)) {
                delete _savedSources[k];
            }

            savedSources(_savedSources);
        }


        if(!wsServer) {
            initServer();
        }

        setPoller();
    },
};
