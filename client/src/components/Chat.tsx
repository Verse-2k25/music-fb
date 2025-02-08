import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";

interface ChatProps {
    socket: Socket;
    roomId: string;
}

interface Message {
    username: string;
    message: string;
}

const Chat: React.FC<ChatProps> = ({ socket, roomId }) => {
    const [username, setUsername] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        socket.emit("joinRoom", { username, roomId });

        socket.on("receiveMessages", (chatHistory: Message[]) => {
            setMessages(chatHistory);
        });

        socket.on("receiveMessage", (data: Message) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        socket.on("userJoined", (msg) => {
            setMessages((prevMessages) => [...prevMessages, { username: "System", message: msg }]);
        });

        socket.on("userLeft", (msg) => {
            setMessages((prevMessages) => [...prevMessages, { username: "System", message: msg }]);
        });

        return () => {
            socket.emit("leaveRoom", { username, roomId });
            socket.off("receiveMessages");
            socket.off("receiveMessage");
            socket.off("userJoined");
            socket.off("userLeft");
        };
    }, [socket, roomId]);

    const sendMessage = () => {
        if (message.trim() !== "" && username.trim() !== "") {
            socket.emit("sendMessage", { username, message, roomId });
            setMessage("");
        }
    };

    return (
        <div className="chat-container">
            <h2>Room: {roomId}</h2>
            {username === "" ? (
                <div>
                    <input
                        type="text"
                        placeholder="Enter your name"
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <button onClick={() => socket.emit("joinRoom", { username, roomId })}>
                        Join Chat
                    </button>
                </div>
            ) : (
                <>
                    <div className="chat-box">
                        {messages.map((msg, index) => (
                            <p key={index}>
                                <strong>{msg.username}:</strong> {msg.message}
                            </p>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Type a message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </>
            )}
        </div>
    );
};

export default Chat;
