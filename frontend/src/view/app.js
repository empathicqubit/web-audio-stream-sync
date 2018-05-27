import React from 'react';
import { Link } from 'react-router-dom';

class App extends React.Component {
    render() {
        return (
            <div>
                <ul>
                    <li>
                        <Link to="/admin">Admin</Link>
                    </li>
                    <li>
                        <Link to="/client">Client</Link>
                    </li>
                    <li>
                        <Link to="/simulator">Simulator</Link>
                    </li>
                </ul>
            </div>
        );
    }
}

export default App
