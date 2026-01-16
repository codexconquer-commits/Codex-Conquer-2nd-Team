import axios from "axios";
import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket.js";
import Navbar from "../../components/Navbar";


const BASE = import.meta.env.VITE_BASE_URL;

const Home = () => {
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const isTypingRef = useRef(false);
const [typingUser, setTypingUser] = useState("");

const typingTimeoutRef = useRef(null);

  /* ================= AUTH USER ================= */
  useEffect(() => {
    axios
      .get(`${BASE}/api/users/me`, { withCredentials: true })
      .then((res) => {
        setMe(res.data);
        socket.emit("add-user", res.data._id);
        console.log("🧑 logged in:", res.data.fullName);
      });
  }, []);

  /* ================= USERS ================= */
  useEffect(() => {
    axios.get(`${BASE}/api/users`, { withCredentials: true }).then((res) => {
      setUsers(res.data || []);
    });
  }, []);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    socket.on("receive-message", (msg) => {
      console.log("📩 receive-message", msg);
      if (activeChat && msg.chatId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", ({ senderName }) => {
      console.log("👀 typing:", senderName);
      setTypingUser(senderName + " is typing...");
    });

    socket.on("stop-typing", () => {
      console.log("🛑 stop typing");
      setTypingUser("");
    });

    return () => {
      socket.off("receive-message");
      socket.off("typing");
      socket.off("stop-typing");
    };
  }, [activeChat]);

  /* ================= OPEN CHAT ================= */
  const openChat = async (userId) => {
    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );

    const chat = res.data;
    setActiveChat(chat);

    socket.emit("join-chat", chat._id);
    console.log("📥 joined chat:", chat._id);

    const msgs = await axios.get(`${BASE}/api/messages/${chat._id}`, {
      withCredentials: true,
    });

    setMessages(msgs.data || []);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text || !activeChat) return;

    const res = await axios.post(
      `${BASE}/api/messages`,
      { chatId: activeChat._id, text },
      { withCredentials: true }
    );

    setMessages((prev) => [...prev, res.data]);
    setText("");

    const receiver = activeChat.members.find(
      (m) =>
        (typeof m === "string" ? m : m._id) !==
        (typeof res.data.senderId === "string"
          ? res.data.senderId
          : res.data.senderId._id)
    );

    const receiverId =
      typeof receiver === "string" ? receiver : receiver?._id;

    if (receiverId) {
      socket.emit("send-message", {
        receiverId,
        message: res.data,
      });
    }

    socket.emit("stop-typing", { chatId: activeChat._id });
    isTypingRef.current = false;
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      <Navbar />
      {/* USERS */}
      <div style={{ width: 250, borderRight: "1px solid #ccc" }}>
        <h3 style={{ padding: 10 }}>Users</h3>
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => openChat(u._id)}
            style={{
              padding: 10,
              cursor: "pointer",
              background: "#f5f5f5",
              marginBottom: 4,
            }}
          >
            {u.fullName}
          </div>
        ))}
      </div>

      {/* CHAT */}
      <div style={{ flex: 1, padding: 10 }}>
        {!activeChat ? (
          <h2>Select a user to chat</h2>
        ) : (
          <>
            <div style={{ minHeight: 20, color: "gray" }}>
              {typingUser}
            </div>

            <div
              style={{
                height: "70vh",
                overflowY: "auto",
                border: "1px solid #ddd",
                padding: 10,
                marginBottom: 10,
              }}
            >
              {messages.map((m) => (
                <div key={m._id} style={{ marginBottom: 6 }}>
                  <b>
                    {m.senderId === me?._id ||
                    m.senderId?._id === me?._id
                      ? "You"
                      : "User"}
                    :
                  </b>{" "}
                  {m.text}
                </div>
              ))}
            </div>

            <textarea
              value={text}
              placeholder="Type message..."
              style={{ width: "100%", height: 60 }}
              onChange={(e) => {
                setText(e.target.value);

                if (!activeChat) return;

                if (!isTypingRef.current) {
                  socket.emit("typing", {
                    chatId: activeChat._id,
                    senderName: me.fullName,
                  });
                  console.log("⌨️ typing emit");
                  isTypingRef.current = true;
                }

                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit("stop-typing", {
                    chatId: activeChat._id,
                  });
                  console.log("🛑 stop typing emit");
                  isTypingRef.current = false;
                }, 2000);
              }}
            />

            <button onClick={sendMessage} style={{ marginTop: 8 }}>
              Send
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
