import axios from "axios";
import { useContext, useEffect, useRef, useState } from "react";
import Navbar from "../../../components/Navbar";
import { AppContext } from "../../../context/Theme-Context";
import socket from "../../../socket/socket.js";
import Logo from "../../../assets/download-removebg-preview.png";

import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatSidebar from "./ChatSidebar";
import useMessagesSocket from "./useMessagesSocket";

const BASE = import.meta.env.VITE_BASE_URL;

const Messages = () => {
  const { isDark, user } = useContext(AppContext);

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

  /* ================= API ================= */

  useEffect(() => {
    axios.get(`${BASE}/api/users/me`, { withCredentials: true }).then((res) => {
      setMe(res.data);
      socket.emit("add-user", res.data._id);
    });
  }, []);

  useEffect(() => {
    axios.get(`${BASE}/api/users`, { withCredentials: true }).then((res) => {
      setUsers(res.data || []);
    });
  }, []);

  /* ================= SOCKET ================= */

  useMessagesSocket({
    activeChat,
    setMessages,
    setTypingUser,
    setOnlineUsers,
  });

  /* ================= HELPERS ================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const resize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const openChatWithUser = async (userId) => {
    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );

    setActiveChat(res.data);
    socket.emit("join-chat", res.data._id);

    const msgs = await axios.get(`${BASE}/api/messages/${res.data._id}`, {
      withCredentials: true,
    });

    setMessages(msgs.data || []);
    if (isMobile) setShowChatMobile(true);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;

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

    socket.emit("send-message", {
      receiverId: typeof receiver === "string" ? receiver : receiver?._id,
      message: res.data,
    });
  };

  return (
    <div
      className={`flex h-screen overflow-hidden ml-18 ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
      }`}
    >
      {/* ✅ Navbar hidden when mobile chat open */}
      {!(isMobile && showChatMobile) && <Navbar />}

      {/* LEFT SIDEBAR */}
      <ChatSidebar
        users={users}
        onlineUsers={onlineUsers}
        onUserClick={openChatWithUser}
        isMobile={isMobile}
        setShowChatMobile={setShowChatMobile}
        isDark={isDark}
        showChatMobile={showChatMobile}
      />

      {/* RIGHT CHAT */}
      <main
        className={
          isMobile && showChatMobile
            ? "fixed top-0 left-0 w-screen h-screen z-40 bg-inherit flex flex-col"
            : "relative flex-1 flex flex-col h-full"
        }
      >
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
  {/* App Icon */}
  <div className="w-28 h-28 mb-6 rounded-3xl bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
    <img src={Logo} alt="App Logo" className="w-16 h-16 rounded-full" />
    
  </div>

  {/* Title */}
  <h1 className="text-3xl font-extrabold tracking-tight">
    Convo for Desktop
  </h1>

  {/* Subtitle */}
  <p className="opacity-70 max-w-md mt-3 text-sm sm:text-base">
    Send and receive messages without relying on your phone connection.
  </p>

  {/* Footer note */}
  <div className="flex items-center gap-2 mt-10 text-xs opacity-60">
    <span className="text-lg">🔒</span>
    <span>Your personal messages are end-to-end encrypted</span>
  </div>
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
            />

            <ChatMessages
              messages={messages}
              me={me}
              user={user}
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
