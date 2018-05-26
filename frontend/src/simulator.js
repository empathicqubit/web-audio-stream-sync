import BufferClient from './buffer-client.js';
import BufferClientBackend from './buffer-client-backend.js';
import React from 'react';
import Draggable from 'react-draggable';

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
                <p>
                    Add virtual clients here, and go to the admin page to control them. Moving them around
                    the room will allow you to change how they would sound to the listener (you). The listener's
                    location is represented by the ear icon, and can also be moved around the room.
                </p>
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
                <h2>Virtual Room</h2>
                <div className="room">
                    <Draggable position={{ x: this.props.listenerX, y: this.props.listenerY }} onDrag={this.props.onDrag}>
                        <div className="listener" />
                    </Draggable>
                    {this.props.clients.map(client => 
                        <Draggable position={{ x: client.x, y: client.y }} key={client.clientId} onDrag={client.onDrag}>
                            <div className="speaker">
                                {client.name || client.clientId}
                            </div>
                        </Draggable>
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
