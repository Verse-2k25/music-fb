import { useState, useEffect } from "react";
import WebPlayback from "./WebPlayback";
import Login from "./Login";
import Chat from "./components/Chat";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
    const [token, setToken] = useState<string>("");
    const [roomId, setRoomId] = useState<string>("");

    useEffect(() => {
        async function getToken() {
            const response = await fetch("/auth/token");
            const json = await response.json();
            setToken(json.access_token);
            localStorage.setItem("refresh_token", json.refresh_token);
            localStorage.setItem("access_token", json.access_token);
        }
        getToken();
    }, []);

    return (
        <div className="app-container">
            {token === "" ? (
                <Login />
            ) : roomId === "" ? (
                <div className="room-selection">
                    <h2>Enter Room ID to Join Chat</h2>
                    <input
                        type="text"
                        placeholder="Enter Room ID"
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button onClick={() => setRoomId(roomId)}>Join Room</button>
                </div>
            ) : (
                <>
                    <WebPlayback initialToken={token} />
                    <Chat socket={socket} roomId={roomId} />
                </>
            )}
        </div>
    );
}

export default App;
