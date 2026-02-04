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
import Loader from "../../../components/Loader/Loader";

const Messages = () => {
  const { isDark, setUser } = useContext(AppContext);

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);

  // 🔥 SPLIT LOADERS
  const [appLoading, setAppLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef(null);

  /* ================= LOAD LOGGED-IN USER ================= */
  useEffect(() => {
    const loadMe = async () => {
      try {
        setAppLoading(true);
        const res = await api.get("/api/users/me");
        setMe(res.data);
        setUser(res.data);
        socket.emit("add-user", res.data._id);
      } catch (err) {
        console.error(err);
      } finally {
        setAppLoading(false);
      }
    };

    loadMe();
  }, []);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        const res = await api.get("/api/users");
        setUsers(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  /* ================= SOCKET ================= */
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
    try {
      setChatLoading(true);

      const chatRes = await api.post("/api/chats", { userId });
      setActiveChat(chatRes.data);

      socket.emit("join-chat", chatRes.data._id);

      const msgRes = await api.get(`/api/messages/${chatRes.data._id}`);
      setMessages(msgRes.data || []);

      if (isMobile) setShowChatMobile(true);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
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

  // ✅ ONLY FIRST LOAD
  if (appLoading) {
    return <Loader text="Initializing chat app..." />;
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ml-18 font-regular ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
      }`}
    >
      {!(isMobile && showChatMobile) && <Navbar />}

      <ChatSidebar
        users={users}
        usersLoading={usersLoading}
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
              onCall={() => console.log("🔊 Audio call")}
              onVideoCall={() => console.log("🎥 Video call")}
            />

            {/* ✅ CHAT AREA LOADER */}
            {chatLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <ChatMessages
                messages={messages}
                me={me}
                typingUser={typingUser}
                messagesEndRef={messagesEndRef}
              />
            )}

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
