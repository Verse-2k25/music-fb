import React, { useState, useEffect, useCallback,useRef } from 'react';
import Search from './components/SearchParams.tsx';

const initialTrack = {
    album: { images: [{ url: "" }] },
    name: "",
    artists: [{ name: "" }],
    uri: ""
};

function WebPlayback() {
    const [player, setPlayer] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [token, setToken] = useState("");
    const [refreshToken, setRefreshToken] = useState("");
    const [deviceId, setDeviceId] = useState("");
    const [currentTrack, setCurrentTrack] = useState(initialTrack);
    const [tracks, setTracks] = useState<any[]>([]); // Store the top 10 tracks
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const lastPreviousPress = useRef<number | null>(null);

    const refreshAccessToken = useCallback(async () => {
        try {
            const response = await fetch('http://localhost:5000/auth/refresh_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
            const data = await response.json();
            setToken(data.access_token);
            localStorage.setItem('access_token', data.access_token);
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
        }
    }, [refreshToken]);


    const initializePlayer = useCallback(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(token); },
                volume: 0.5
            });

            setPlayer(player);

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id);
                setIsReady(true);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
                setIsReady(false);
            });

            player.addListener('player_state_changed', state => {
                if (!state) {
                    return;
                }
                console.log('Player state changed:', state);
                setIsPlaying(!state.paused);
                setIsPaused(state.paused);
                setCurrentTrack(state.track_window.current_track || initialTrack);
            });

            player.connect().then(success => {
                if (success) {
                    console.log('The Web Playback SDK successfully connected to Spotify!');
                }
            });
        };
    }, [token]);

    useEffect(() => {
        if (token) {
            initializePlayer();
        }
    }, [token, initializePlayer]);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('http://localhost:5000/auth/token');
                const data = await response.json();
                setToken(data.access_token);
                setRefreshToken(data.refresh_token);
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);

                const refreshInterval = setInterval(() => {
                    refreshAccessToken();
                }, 3540000); // Refresh every 59 minutes

                return () => clearInterval(refreshInterval);
            } catch (error) {
                console.error('Error fetching token:', error);
            }
        };

        fetchToken();
    }, [refreshAccessToken]);

    const handlePlayPause = useCallback(() => {
        if (!player || !isReady) {
            console.log('Player is not ready');
            return;
        }

        player.getCurrentState().then((state) => {
            if (!state) {
                console.error('User is not playing music through the Web Playback SDK');
                return;
            }

            console.log('Current playback state:', state.paused ? 'Paused' : 'Playing');

            if (state.paused) {
                player.resume().then(() => {
                    console.log('Playback resumed');
                    setIsPlaying(true);
                    setIsPaused(false);
                }).catch((error) => {
                    console.error('Failed to resume:', error);
                });
            } else {
                player.pause().then(() => {
                    console.log('Playback paused');
                    setIsPlaying(false);
                    setIsPaused(true);
                }).catch((error) => {
                    console.error('Failed to pause:', error);
                });
            }
        }).catch((error) => {
            console.error('Failed to get current state:', error);
        });
    }, [player, isReady]);


    useEffect(() => {
        if (player) {
            player.addListener('player_state_changed', (state) => {
                if (!state) {
                    return;
                }
                console.log('Player state changed:', state);
                setIsPlaying(!state.paused);
                setIsPaused(state.paused);
                setCurrentTrack(state.track_window.current_track || initialTrack);
            });
        }
    }, [player]);

    const handlePreviousTrack = () => {
        if (!player || !isReady) {
            console.log('Player is not ready');
            return;
        }

        const now = Date.now();
        const timeSinceLastPress = lastPreviousPress.current ? now - lastPreviousPress.current : null;
        lastPreviousPress.current = now;

        if (timeSinceLastPress && timeSinceLastPress < 1000) {
            // If the previous press was within 1 second, go to the previous track
            const currentTrackIndex = tracks.findIndex(track => track.uri === currentTrack.uri);
            if (currentTrackIndex > 0) {
                const previousTrack = tracks[currentTrackIndex - 1];
                playTrack(previousTrack.uri);
            } else {
                console.log('No previous track available');
            }
        } else {
            // Otherwise, restart the current track
            player.seek(0).catch(error => {
                console.error('Error restarting track:', error);
            });
        }
    };

    const handleNextTrack = () => {
        if (!player || !isReady) {
            console.log('Player is not ready');
            return;
        }

        const currentTrackIndex = tracks.findIndex(track => track.uri === currentTrack.uri);
        if (currentTrackIndex === -1 || currentTrackIndex === tracks.length - 1) {
            console.log('No next track available');
            return;
        }

        const nextTrack = tracks[currentTrackIndex + 1];
        playTrack(nextTrack.uri);
    };

    const playTrack = async (uri: string) => {
        if (currentTrack.uri === uri && isPlaying) {
            console.log("Track is already playing.");
            return;
        }

        const trackToPlay = tracks.find(track => track.uri === uri);
        setCurrentTrack(trackToPlay || initialTrack);

        if (player && isReady) {
            try {
                await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                });
                setIsPlaying(true);
            } catch (error) {
                console.error('Error playing track:', error);
            }
        } else {
            console.error("Player is not initialized.");
        }
    };

    return (
        <div>
            <Search token={token} playTrack={playTrack} setTracks={setTracks} />
            <div className="container">
                <div className="main-wrapper">
                    {isReady ? (
                        <div>
                            <img src={currentTrack.album.images[0].url} className="now-playing__cover" alt="" />
                            <div className="now-playing__side">
                                <div className="now-playing__name">{currentTrack.name}</div>
                                <div className="now-playing__artist">
                                    {currentTrack.artists.map(artist => artist.name).join(', ')}
                                </div>
                            </div>
                            <div className="controls">
                                <button className="btn-spotify" onClick={handlePreviousTrack}>
                                    Previous Track
                                </button>
                                <button className="btn-spotify" onClick={handlePlayPause}>
                                    {isPlaying ? 'Pause' : 'Play'}
                                </button>
                                <button className="btn-spotify" onClick={handleNextTrack}>
                                    Next Track
                                </button>
                            </div>
                            <div className="track-list">
                                {tracks.map(track => (
                                    <div key={track.uri} className="track-item">
                                        <span>{track.name} - {track.artists.map(artist => artist.name).join(', ')}</span>
                                        <button onClick={() => playTrack(track.uri)}>Play</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>Loading Spotify Player...</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default WebPlayback;
