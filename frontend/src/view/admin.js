import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';       
import Knob from 'react-canvas-knob';

import './admin.css';

const HOST = document.location.host.split(':')[0];

class Admin extends React.Component {
    constructor(props) {
        super(props);
        
        this.state = {
            passwordSubmitted: false,
            password: '',
            syncPacket: {},
            clients: [],
        };

        let ws = this.ws = new WebSocket(`ws://${HOST}:3031`);

        ws.addEventListener('close', () => window.location.reload());
        ws.addEventListener('error', () => window.location.reload());

        ws.addEventListener('message', evt => {
            let data = JSON.parse(evt.data);
            let state = this.state;
            let clients = this.state.clients;

            if(data.type == 'client_add') {
                this.setState({
                    clients: [...clients, data],
                });
            }
            else if(data.type == 'set_sources') {
                this.setSources(data.id, data.sources);
            }
            else if(data.type == 'timecode') {
                this.setState({
                    syncPacket: data
                });
            }
            else if(data.type == 'set_name') {
                this.setState({
                    clients: clients.map(client => 
                        client.id == data.id
                        ? Object.assign({}, client, {
                            name: data.name
                        })
                        : client
                    ),
                });
            }
            else if(data.type == 'client_remove') {
                this.setState({
                    clients: this.state.clients.filter(client => client.id != data.id),
                });
            }
            else if(data.type == 'get_clients') {
                this.setState({
                    clients: data.clients,
                });
            }
            else if(data.type == 'hello_admin') {
                this.setState({
                    passwordSubmitted: true,
                });

                ws.send(JSON.stringify({
                    type: 'get_clients',
                }));
            }
        });
    }
    doHello() {
        this.ws.send(JSON.stringify({type: 'hello_admin', password: this.state.password }));
    }
    setSources(id, sources) {
        this.setState({
            clients: this.state.clients.map(client =>  
                client.id == id
                    ? Object.assign({}, client, {
                        sources: sources,
                    })
                    : client
            ), 
        });
    }
    clickSource(client, source) {
        this.ws.send(JSON.stringify({
            type: 'admin_sources',
            enabled: !source.enabled,
            id: client.id,
            url: source.url,
        }));
    }
    adjustPan(client, source, pan) {
        this.ws.send(JSON.stringify({
            type: 'admin_pan',
            pan: pan,
            id: client.id,
            url: source.url,
        }));

        let sources = client.sources.map(x => 
            x.id == source.id 
                ? Object.assign({}, x, { pan: pan })
                : x
        );

        this.setSources(client.id, sources);
    }
    adjustGain(client, source, gain) {
        this.ws.send(JSON.stringify({
            type: 'admin_gain',
            gain: gain,
            id: client.id,
            url: source.url,
        }));

        let sources = client.sources.map(x => 
            x.id == source.id 
                ? Object.assign({}, x, { gain: gain })
                : x
        );

        this.setSources(client.id, sources);
    }
    adjustTimecode(timecode) {
        this.ws.send(JSON.stringify({
            type: 'admin_timecode',
            timecode: timecode,
        }));

        this.setState({
            syncPacket: {...this.state.syncPacket, timecode: timecode},
        });
    }
    restart() {
        this.ws.send(JSON.stringify({
            type: 'admin_restart',
        }));

    }
    muteAll() {
        this.ws.send(JSON.stringify({
            type: 'admin_mute',
        }));

    }
    unmuteAll() {
        this.ws.send(JSON.stringify({
            type: 'admin_unmute',
        }));

    }
    changePassword(password) {
        this.setState({
            password: password,
        });
    }
    submitPassword() {
        this.doHello();
    }
    render() {
        const state = this.state
        return (
            <div>
                <h1>
                    Source administrator
                </h1>
                <p>
                    This interface allows you to control the state of connected clients; which tracks are playing as well as the pan and gain for each track.
                </p>
                {!this.state.passwordSubmitted
                    ? (
                    <div className="password-input">
                        Enter password: <input type="text" value={this.state.password} onChange={ (evt) => this.changePassword(evt.target.value) } />
                        <button onClick={ () => this.submitPassword() }>
                            Submit
                        </button>
                    </div> 
                    ) : (
                    <div>
                        Current play position: <strong>{this.state.syncPacket.timecode / 1000} seconds</strong><br />
                        <input type="range" min={0} max={370000} step={1} value={this.state.syncPacket.timecode} onChange={ evt => this.adjustTimecode(evt.target.value) } />
                        <div className="track-controls">
                            <button onClick={ () => this.restart() }>
                                Restart song
                            </button>
                            <button onClick={ () => this.muteAll() }>
                                Mute All Clients
                            </button>
                            <button onClick={ () => this.unmuteAll() }>
                                Unmute All Clients
                            </button>
                        </div>
                        <ul className="clients">
                            {state.clients.length
                            ? state.clients.map((client) => 
                                <li key={client.id}>
                                    <div style={{position: 'relative', display: 'inline-block' }} className="speaker"></div>
                                    Client {client.name || client.id} <br />
                                    <br />
                                    Sources: <br />
                                    <ul className="sources">
                                        {client.sources.map((source) => 
                                            <li key={source.url} className={`${source.enabled && 'enabled' }`}>
                                                {source.url.replace(/([A-Z])/g, ' $1')} <br />
                                                <ul class="knobs">
                                                    <li>
                                                        Pan<br />
                                                        <Knob className="pan" bgColor="#000" width={75} height={75} min={-1} value={source.pan} max={1} step={0.01} onChange={ (val) => this.adjustPan(client, source, val) } />
                                                    </li>
                                                    <li>
                                                        Gain<br />
                                                        <Knob className="gain" bgColor="#000" width={75} height={75} min={0} value={source.gain} max={5} step={0.01} onChange={ (val) => this.adjustGain(client, source, val) } />
                                                    </li>
                                                    <li>
                                                        <button onClick={ () => this.clickSource(client, source) }>
                                                            Power
                                                        </button>
                                                    </li>
                                                </ul>
                                            </li>
                                        )}
                                    </ul>
                                </li>
                            ) : <li><h2><strong>No clients connected! Open up another browser to the homepage and click the Client link, or create virtual clients in the Simulator.</strong></h2></li>}
                        </ul>
                    </div>
                    )
                }
            </div>
        );
    }
}

export default Admin;
