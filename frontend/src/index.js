import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import { HashRouter, Route, Switch } from 'react-router-dom';

import './index.css';
import './range.css';

import App from './view/app';

import Client from './view/client';
import getClientProps from './controller/client';

import Admin from './view/admin';
import getAdminProps from './controller/admin';

import Simulator from './view/simulator';
import getSimulatorProps from './controller/simulator';

const render = () => ReactDOM.render(router(), document.getElementById('root'));

let clientProps, adminProps, simulatorProps;

const router = () => {
    return <HashRouter>
        <Switch>
            <Route path="/" exact component={App} />
            <Route path="/client" render={(routeProps) => <Client {...routeProps} {...clientProps || (clientProps = getClientProps(render))} />} />
            <Route path="/admin" render={(routeProps) => <Admin {...routeProps} {...adminProps || (adminProps = getAdminProps(render))} />} />
            <Route path="/simulator" render={(routeProps) => <Simulator {...routeProps} {...simulatorProps || (simulatorProps = getSimulatorProps(render))} />} />
        </Switch>
    </HashRouter>
};

render();
registerServiceWorker();
