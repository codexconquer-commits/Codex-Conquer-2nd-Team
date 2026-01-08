import React, { useEffect, useState } from "react";
import axios from "axios";
import socket from "../../socket/socket";

const BASE = import.meta.env.VITE_BASE_URL;

const Home = () => {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // 🔹 Load all users
  useEffect(() => {
    axios
      .get(`${BASE}/api/users`, { withCredentials: true })
      .then((res) => setUsers(res.data))
      .catch(console.error);
  }, []);

  // 🔹 Load chats
  const loadChats = () => {
    axios
      .get(`${BASE}/api/chats`, { withCredentials: true })
      .then((res) => setChats(res.data));
  };

  useEffect(() => {
    loadChats();
  }, []);

  // 🔹 Socket receive
  useEffect(() => {
    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.off("receive-message");
  }, []);

  // 🔹 Create / Open chat
  const openChatWithUser = async (userId) => {
    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );
    loadChats();
    openChat(res.data);
  };

  // 🔹 Open chat
  const openChat = async (chat) => {
    setActiveChat(chat);
    const res = await axios.get(
      `${BASE}/api/messages/${chat._id}`,
      { withCredentials: true }
    );
    setMessages(res.data);
  };

  // 🔹 Send message
  const sendMessage = async () => {
    if (!text || !activeChat) return;

    const res = await axios.post(
      `${BASE}/api/messages`,
      {
        chatId: activeChat._id,
        text,
      },
      { withCredentials: true }
    );

    setMessages((prev) => [...prev, res.data]);
    setText("");

    const receiver = activeChat.members.find(
      (m) => m._id !== res.data.senderId
    );

    socket.emit("send-message", {
      receiverId: receiver._id,
      message: res.data,
    });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT PANEL */}
      <div style={{ width: 300, borderRight: "1px solid gray", padding: 10 }}>
        <h3>All Users</h3>
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => openChatWithUser(u._id)}
            style={{ cursor: "pointer", padding: 5 }}
          >
            {u.fullName}
          </div>
        ))}

        <hr />

        <h3>Chats</h3>
        {chats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => openChat(chat)}
            style={{ cursor: "pointer", padding: 5 }}
          >
            Chat {chat._id.slice(-4)}
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 10 }}>
        {activeChat ? (
          <>
            <h3>Messages</h3>

            <div style={{ height: "70vh", overflowY: "auto" }}>
              {messages.map((m) => (
                <div key={m._id}>
                  <b>{m.senderId.fullName || "You"}:</b> {m.text}
                </div>
              ))}
            </div>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type message"
            />
            <button onClick={sendMessage}>Send</button>
          </>
        ) : (
          <h3>Select user or chat</h3>
        )}
      </div>
    </div>
  );
};

export default Home;
