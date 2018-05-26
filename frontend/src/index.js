import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import BufferClientBackend from './buffer-client-backend';
import StartAudioContext from 'startaudiocontext';
import { HashRouter, Route, Switch } from 'react-router-dom';

import './index.css';
import App from './app';
import Client from './client';
import Admin from './admin';
import Simulator from './simulator';

const HOST = window.location.host.split(':')[0];

const render = () => ReactDOM.render(router(), document.getElementById('root'));

const router = () => {
    return <HashRouter>
        <Switch>
            <Route path="/" exact component={App} />
            <Route path="/client" render={(routeProps) => <Client {...routeProps} {...props.client} />} />
            <Route path="/admin" render={(routeProps) => <Admin {...routeProps} {...props.admin} />} />
            <Route path="/simulator" render={(routeProps) => <Simulator {...routeProps} {...props.simulator} />} />
        </Switch>
    </HashRouter>
};

const getProps = () => {
    const props = {
        admin: {},
    };
        
    const createClient = () => {
        const client = {
            clientName: '',
            clientId: '',
            sources: [],
            realPosition: 0,
        };

        client.options = {
            onTimeOffset: timeOffset => {
                client.realPosition = backend.getRealPosition();
                render();
            },
            onClientId: clientId => {
                client.clientId = clientId;
                render();
            },
            onSourcesUpdated: sources => {
                client.sources = sources
                render();
            },
            onSyncPacket: packet => {
                client.realPosition = backend.getRealPosition();
                render();
            }
        };

        const backend = new BufferClientBackend(client.options);

        client.onChangeName = (clientName) => {
            backend.changeName(clientName);
            client.clientName = clientName;
            render();
        };

        client.onComponentMount = () => {
            StartAudioContext(backend._context, '.playit')
                .then(() => {
                    backend.afterContextStarted();
                });
        };

        return client;
    };

    props.client = createClient();

    const createSimulator = () => {
        let AudioContext = window.AudioContext || window.webkitAudioContext;
        let context = new AudioContext();

        const createClient = () => {
            let mixerNode = null;

            let options = {
                context: context,
                onTimeOffset: timeOffset => {
                    client.realPosition = backend.getRealPosition();
                    render();
                },
                onClientId: clientId => {
                    client.clientId = clientId;
                    render();
                },
                onSourcesUpdated: sources => {
                    client.sources = sources;
                    render();
                },
                onSyncPacket: packet => {
                    client.realPosition = backend.getRealPosition();
                    render();
                },
                onMixerNodeCreated: node => {
                    mixerNode = node;
                    mixerNode.panningModel = 'HRTF';
                    mixerNode.distanceModel = 'inverse';
                    mixerNode.refDistance = 1;
                    mixerNode.maxDistance = 500;
                    mixerNode.rolloffFactor = 0.01;
                    mixerNode.coneInnerAngle = 360;
                    mixerNode.coneOuterAngle = 0;
                    mixerNode.codeOuterGain = 0;
                    
                    client.x = 50;
                    client.y = 50;
                    
                    render();
                },
            };
            
            let backend = new BufferClientBackend(options);

            const updateX = (newX) => {
                client.x = newX;
                
                mixerNode.positionX.value = newX - 250;
            };

            const updateY = (newY) => {
                client.y = newY;
                
                mixerNode.positionZ.value = 250 - newY;
            }

            let client = {
                sources: [],
                realPosition: 0,
                clientId: 0,
                x: 0,
                y: 0,
                onDrag: (evt, data) => {
                    updateX(data.x);
                    updateY(data.y);
                    render();
                },
                onChangeName: (name) => {
                    backend.changeName(name);
                    client.name = name;
                    render();
                },
            };

            StartAudioContext(backend._context, '.playit')
                .then(() => {
                    backend.afterContextStarted();
                });

            return client;
        };

        let clients = [];
        
        const doHello = (password) => {
            ws.send(JSON.stringify({type: 'hello_admin', password: password }));
        }

        const updateX = (newX) => {
            simulator.listenerX = newX;
            
            context.listener.positionX.value = newX - 250;
        };

        const updateY = (newY) => {
            simulator.listenerY = newY;
            
            context.listener.positionZ.value = 250 - newY;
        }

        let simulator = {
            clients: clients,
            passwordSubmitted: false,
            password: '',
            listenerX: 250,
            listenerY: 250,
            onDrag: (evt, data) => {
                updateX(data.x);
                updateY(data.y);
                render();
            },
            onNewMixerNode: () => {
                clients.push(createClient());
                render();
            },
            onSubmitPassword: (password) => doHello(password),
            onChangePassword: (password) => {
                simulator.password = password;
                render();
            },
        };
        
        let ws = new WebSocket(`ws://${HOST}:3031`);
        
        ws.addEventListener('message', evt => {
            let data = JSON.parse(evt.data);
        
            if(data.type == 'hello_admin') {
                simulator.passwordSubmitted = true;
                render();
            }
        });

        return simulator;
    };

    props.simulator = createSimulator();

    return props;
}

const props = getProps();

        //<Route path="/admin" component={Admin} />
        //<Route path="/simulator" component={Simulator} />

render();
registerServiceWorker();
