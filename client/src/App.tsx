import { useState, useEffect } from 'react';
import WebPlayback from './WebPlayback';
import Login from './Login';
import './App.css';

function App() {
    const [token, setToken] = useState('');

    useEffect(() => {
        async function getToken() {
            const response = await fetch('/auth/token');
            const json = await response.json();
            setToken(json.access_token);
            localStorage.setItem('refresh_token', json.refresh_token); // Store refresh token
            localStorage.setItem('access_token', json.access_token); // Store access token
        }

        getToken();
    }, []);

    return (
        <>
            {token === '' ? <Login /> : <WebPlayback initialToken={token} />}
        </>
    );
}

export default App;
