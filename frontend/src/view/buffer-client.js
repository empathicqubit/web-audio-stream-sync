import React from 'react';

import './buffer-client.css';

class BufferClient extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillUnmount() {
        this.props.onComponentUnmount && this.props.onComponentUnmount();
    }
    render() {
        let enabledSources = this.props.sources.filter(source => source.enabled);
        return (
            <div>
                <div style={{position: 'relative', display: 'inline-block' }} className="speaker"></div>
                <strong>{"Client " + (this.props.clientName || this.props.clientId)}</strong>
                <br />
                <div>
                    Enter client name: <input type="text" value={this.props.clientName} onChange={ (evt) => this.props.onChangeName(evt.target.value) } />
                    <button className="playit">Play!</button>
                    <br />
                </div>
                Current play position: <strong>{(this.props.realPosition / 1000).toFixed(2)} seconds</strong><br />
                <br />
                {enabledSources.length
                    ? <div className="enabled-sources">
                        <strong>Enabled sources:</strong>
                        <ul>
                            {enabledSources.map(source => 
                                <li key={source.url}>
                                    {source.url}
                                </li>
                            )}
                        </ul>
                    </div> : null}
            </div>
        );
    }
}

export default BufferClient;
