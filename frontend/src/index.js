import registerServiceWorker from './registerServiceWorker';

import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Route, Switch, Redirect } from 'react-router-dom';

import './index.css';
import './range.css';

import App from './view/app';

import Client from './view/client';
import getClientProps from './controller/client';

import Admin from './view/admin';
import getAdminProps from './controller/admin';

import Simulator from './view/simulator';
import getSimulatorProps from './controller/simulator';

registerServiceWorker();

let clientProps, adminProps, simulatorProps;

const render = () => ReactDOM.render(router(), document.getElementById('root'));

let routeSwitch = (
    <Switch>
        <Route path="/" exact render={() => <Redirect to="/client" />} />
        <Route title="Client" path="/client" render={(routeProps) => <Client {...routeProps} {...clientProps || (clientProps = getClientProps(render))} />} />
        <Route title="Admin" path="/admin" render={(routeProps) => <Admin {...routeProps} {...adminProps || (adminProps = getAdminProps(render))} />} />
        <Route title="Simulator" path="/simulator" render={(routeProps) => <Simulator {...routeProps} {...simulatorProps || (simulatorProps = getSimulatorProps(render))} />} />
    </Switch>
);

const router = () => {
    return (
        <HashRouter>
            <App routeSwitch={routeSwitch} />
        </HashRouter>
    );
};

render();

