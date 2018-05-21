import BufferClient from './buffer-client.js';
import BufferClientBackend from './buffer-client-backend.js';
import React from 'react';

import './simulator.css';
import 'material-design-icons/sprites/svg-sprite/svg-sprite-hardware.css';

class Simulator extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                <h1>
                    Simulator
                </h1>
                <button onClick={ () => this.props.onNewMixerNode() }>
                    Create new client
                </button>
                {!this.props.passwordSubmitted
                    ? <div className="password-input">
                        Enter password: <input type="text" value={this.props.password} onChange={ (evt) => this.props.onChangePassword(evt.target.value) } />
                        <button onClick={ () => this.props.onSubmitPassword(this.props.password) }>
                            Submit
                        </button>
                    </div> : null}
                <div className="grid">
                    <div className="head" style={{ top: this.props.listenerY, left: this.props.listenerX }} onMouseMove={this.props.onMouseMove} onMouseUp={this.props.onMouseUp} onMouseDown={this.props.onMouseDown} />
                    {this.props.clients.map(client => 
                        <div key={client.clientId} onMouseOut={client.onMouseMove} onMouseMove={client.onMouseMove} onMouseDown={client.onMouseDown} onMouseUp={client.onMouseUp} className="speaker" style={{ top: client.y , left: client.x }}>
                            {client.name || client.clientId}
                        </div>
                    )}
                </div>
                <div className="clients">
                    {this.props.clients.map(client => 
                        <BufferClient {...client} key={client.clientId} />
                    )}
                </div>
            </div>
        );
    }
}

export default Simulator;
