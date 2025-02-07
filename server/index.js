const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

const port = 5000;

global.access_token = '';
global.refresh_token = '';
global.token_expires_in=0;
global.token_obtained_at=0

dotenv.config();

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const spotify_redirect_uri = process.env.REDIRECT_URI;

const generateRandomString = function (length) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../build')));

app.get('/', (req, res) => {
    res.send('Welcome to the Spotify API Server!');
});

app.get('/auth/login', (req, res) => {
    const scope = "streaming user-modify-playback-state user-read-playback-state user-read-currently-playing user-read-email user-read-private";
    const state = generateRandomString(16);

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id,
        scope: scope,
        redirect_uri: spotify_redirect_uri,
        state: state
    });

    res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
});

app.get('/auth/callback', async (req, res) => {
    const code = req.query.code;

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
            code: code,
            redirect_uri: spotify_redirect_uri,
            grant_type: 'authorization_code'
        })
    };

    try {
        const response = await axios(authOptions);
        access_token = response.data.access_token;
        refresh_token = response.data.refresh_token;
        token_expires_in=response.data.expires_in;
        token_obtained_at=Math.floor(Date.now() / 1000);
        console.log("access_token", access_token);
        console.log("refresh_token", refresh_token);
        res.redirect('http://localhost:5173');
    } catch (error) {
        console.error('Error fetching access token:', error);
        res.status(500).send('Error fetching access token');
    }
});

app.get('/auth/token', (req, res) => {
    res.json({
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_in: token_expires_in,
        token_obtained_at: token_obtained_at
    });
});

app.post('/auth/refresh_token', async (req, res) => {
    const { refresh_token } = req.body;

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        })
    };

    try {
        const response = await axios(authOptions);
        access_token = response.data.access_token;
        token_expires_in = response.data.expires_in; // Update the expiration time
        token_obtained_at = Math.floor(Date.now() / 1000); // Update the time when the token was obtained
        res.json({
            access_token: response.data.access_token,
            expires_in: response.data.expires_in
        });
    } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).send('Error refreshing access token');
    }
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
