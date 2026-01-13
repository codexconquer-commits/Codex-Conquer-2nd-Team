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
  const [myId, setMyId] = useState(null);

  /* ================= GET LOGGED-IN USER ================= */
  useEffect(() => {
    axios
      .get(`${BASE}/api/users/me`, { withCredentials: true })
      .then((res) => {
        setMyId(res.data._id);
        console.log("🧑 Logged in user:", res.data._id);
      })
      .catch(() => {
        console.error("❌ /api/me not working");
      });
  }, []);

  /* ================= SOCKET REGISTER ================= */
  useEffect(() => {
    if (!myId) return;

    const onConnect = () => {
      console.log("🟢 Socket connected:", socket.id);
      socket.emit("add-user", myId);
      console.log("📌 add-user emitted:", myId);
    };

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    return () => socket.off("connect", onConnect);
  }, [myId]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    axios
      .get(`${BASE}/api/users`, { withCredentials: true })
      .then((res) => {
        console.log("👥 Users loaded");
        setUsers(res.data);
      });
  }, []);

  /* ================= LOAD CHATS ================= */
  const loadChats = () => {
    axios
      .get(`${BASE}/api/chats`, { withCredentials: true })
      .then((res) => {
        console.log("💬 Chats loaded");
        setChats(res.data);
      });
  };

  useEffect(() => {
    loadChats();
  }, []);

  /* ================= SOCKET RECEIVE ================= */
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      console.log("📩 Message received:", msg);

      if (!activeChat || msg.chatId !== activeChat._id) {
        console.log("⚠️ Message ignored (not active chat)");
        return;
      }

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => socket.off("receive-message", handleReceiveMessage);
  }, [activeChat]);

  /* ================= OPEN CHAT WITH USER ================= */
  const openChatWithUser = async (userId) => {
    console.log("➡️ Opening chat with user:", userId);

    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );

    loadChats();
    openChat(res.data);
  };

  /* ================= OPEN CHAT ================= */
  const openChat = async (chat) => {
    console.log("📂 Chat opened:", chat._id);
    setActiveChat(chat);

    const res = await axios.get(
      `${BASE}/api/messages/${chat._id}`,
      { withCredentials: true }
    );

    console.log("📜 Messages loaded:", res.data.length);
    setMessages(res.data);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text || !activeChat) return;

    console.log("✉️ Sending message:", text);

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

    console.log("📤 Emitting to receiver:", receiver._id);

    socket.emit("send-message", {
      receiverId: receiver._id,
      message: res.data,
    });
  };

  /* ================= UI ================= */
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT */}
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

      {/* RIGHT */}
      <div style={{ flex: 1, padding: 10 }}>
        {activeChat ? (
          <>
            <h3>Messages</h3>

            <div style={{ height: "70vh", overflowY: "auto" }}>
              {messages.map((m) => (
                <div key={m._id}>
                  <b>{m.senderId?.fullName || "You"}:</b> {m.text}
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
