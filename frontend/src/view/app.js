import React from 'react';
import { NavLink, Link } from 'react-router-dom';

import './app.css';

class App extends React.Component {
    render() {
        return (
            <div>
                <header>
                    <nav>
                        <ul>
                            <li>
                                <NavLink to="/admin">Admin</NavLink>
                            </li>
                            <li>
                                <NavLink to="/client">Client</NavLink>
                            </li>
                            <li>
                                <NavLink to="/simulator">Simulator</NavLink>
                            </li>
                        </ul>
                    </nav>
                </header>
                <main>
                    {this.props.routeSwitch}
                </main>
            </div>
        );
    }
}

export default App
