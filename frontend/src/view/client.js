'use strict';
import BufferClient from './buffer-client.js';
import React from 'react';

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
            <BufferClient {...this.props} />
        );
    }
}

export default Client;
