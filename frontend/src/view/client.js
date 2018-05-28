'use strict';
import BufferClient from './buffer-client.js';
import React from 'react';
import Helmet from 'react-helmet';

let e = React.createElement;
let n = null;

class Client extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.props.onComponentMount && this.props.onComponentMount();
    }
    render() {
        return (
            <div>
                <Helmet>
                    <title>{"Client " + this.props.clientName}</title>
                </Helmet>
                <h1>
                    Client
                </h1>
                <p>
                    This is the client page. This connects to the server, and will emit sounds with the configuration
                    that the server specifies. If you enter a client name into the box below, it will load settings
                    that were previously saved for this client after a few seconds. The client name is case sensitive.
                    YARGY is different from Yargy and YaRgY.
                </p>
                <BufferClient {...this.props} />
            </div>
        );
    }
}

export default Client;
