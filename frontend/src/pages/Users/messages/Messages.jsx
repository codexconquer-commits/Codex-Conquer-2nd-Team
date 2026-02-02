import { useContext, useEffect, useRef, useState } from "react";
import Logo from "../../../assets/download-removebg-preview.png";
import Navbar from "../../../components/Navbar";
import { AppContext } from "../../../context/Theme-Context";
import socket from "../../../socket/socket.js";

import api from "../../../api/axios";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatSidebar from "./ChatSidebar";
import useMessagesSocket from "./useMessagesSocket";

const Messages = () => {
  const { isDark } = useContext(AppContext);

  console.log("📨 Messages render");

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const messagesEndRef = useRef(null);

  /* ================= LOAD LOGGED-IN USER ================= */
const { setUser } = useContext(AppContext);

useEffect(() => {
  api.get("/api/users/me")
    .then((res) => {
      setMe(res.data);
      setUser(res.data); // 🔥 THIS IS REQUIRED
      socket.emit("add-user", res.data._id);
    })
    .catch(console.error);
}, []);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    console.log("👥 Fetching users...");
    api.get("/api/users")
      .then((res) => {
        console.log("✅ Users loaded:", res.data);
        setUsers(res.data || []);
      })
      .catch(console.error);
  }, []);

  /* ================= SOCKET MESSAGE LISTENERS ================= */
  useMessagesSocket({
    activeChat,
    setMessages,
    setTypingUser,
    setOnlineUsers,
  });

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= RESPONSIVE ================= */
  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* ================= OPEN CHAT ================= */
  const openChatWithUser = async (userId) => {
    console.log("📂 Opening chat with:", userId);

    const res = await api.post("/api/chats", { userId });
    setActiveChat(res.data);

    socket.emit("join-chat", res.data._id);
    console.log("📡 socket.emit → join-chat", res.data._id);

    const msgs = await api.get(`/api/messages/${res.data._id}`);
    setMessages(msgs.data || []);

    if (isMobile) setShowChatMobile(true);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;

    const res = await api.post("/api/messages", {
      chatId: activeChat._id,
      text,
    });

    setMessages((prev) => [...prev, res.data]);
    setText("");

    socket.emit("send-message", {
      chatId: activeChat._id,
      message: res.data,
    });
  };

  /* ================= RENDER ================= */
  return (
    <div
      className={`flex h-screen overflow-hidden ml-18 font-regular ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
      }`}
    >
      {!(isMobile && showChatMobile) && <Navbar />}

      <ChatSidebar
        users={users}
        onlineUsers={onlineUsers}
        onUserClick={openChatWithUser}
        isMobile={isMobile}
        setShowChatMobile={setShowChatMobile}
        showChatMobile={showChatMobile}
        activeChat={activeChat}
        isDark={isDark}
      />

      <main
        className={
          isMobile && showChatMobile
            ? "fixed inset-0 z-40 flex flex-col bg-inherit"
            : "relative flex-1 flex flex-col"
        }
      >
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <img src={Logo} alt="App Logo" className="w-16 h-16 rounded-full" />
            <h1 className="text-3xl font-extrabold mt-4">
              Convo for Desktop
            </h1>
          </div>
        ) : (
          <>
            <ChatHeader
              activeChat={activeChat}
              me={me}
              onlineUsers={onlineUsers}
              isMobile={isMobile}
              onBack={() => {
                setShowChatMobile(false);
                setActiveChat(null);
              }}
              onCall={() =>
                console.log("🔊 Audio call clicked (handled globally)")
              }
              onVideoCall={() =>
                console.log("🎥 Video call clicked (handled globally)")
              }
            />

            <ChatMessages
              messages={messages}
              me={me}
              typingUser={typingUser}
              messagesEndRef={messagesEndRef}
            />

            <ChatInput
              text={text}
              setText={setText}
              sendMessage={sendMessage}
              activeChat={activeChat}
              me={me}
              isDark={isDark}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Messages;
