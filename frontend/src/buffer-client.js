import React from 'react';

class BufferClient extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div>
                {"Client " + (this.props.clientName || this.props.clientId)}
                <br />
                <div>
                    Enter client name: <input value={this.props.clientName} onChange={ (evt) => this.props.onChangeName(evt.target.value) } />
                    <input type="button" className="playit" />
                    <br />
                </div>
                Current play position: {this.props.realPosition / 1000}
                <br />
                Enabled sources:
                <ul>
                    {this.props.sources.filter(source => source.enabled).map(source => 
                        <li key={source.url}>
                            {source.url}
                        </li>
                    )}
                </ul>
            </div>
        );
    }
}

export default BufferClient;
