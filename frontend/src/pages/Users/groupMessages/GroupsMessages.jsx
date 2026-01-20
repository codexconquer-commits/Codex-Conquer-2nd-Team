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
import useMessagesSocket from "../messages/useMessagesSocket.js";

const BASE = import.meta.env.VITE_BASE_URL;

const GroupsMessages = () => {
  const { isDark, user } = useContext(AppContext);

  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const messagesEndRef = useRef(null);

  /* ================= USER ================= */

  useEffect(() => {
    const loadMe = async () => {
      const res = await axios.get(`${BASE}/api/users/me`, {
        withCredentials: true,
      });
      setMe(res.data);
      socket.emit("add-user", res.data._id);
    };
    loadMe();
  }, []);

  /* ================= GROUPS ================= */

  useEffect(() => {
    const loadGroups = async () => {
      const res = await axios.get(`${BASE}/api/groups/myGroups`, {
        withCredentials: true,
      });
      setGroups(res.data || []);
    };
    loadGroups();
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

  /* ================= OPEN GROUP CHAT ================= */

  const openGroupChat = async (groupId) => {
    const group = groups.find((g) => g._id === groupId);
    if (!group) return;

    setActiveChat(group);

    // 🔌 join socket room
    socket.emit("join-chat", groupId);

    // 📩 fetch messages
    const res = await axios.get(`${BASE}/api/messages/${groupId}`, {
      withCredentials: true,
    });

    setMessages(res.data || []);

    if (isMobile) setShowChatMobile(true);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;

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

    socket.emit("send-message", {
      chatId: activeChat._id,
      message: res.data,
    });
  };

  /* ================= UI ================= */

  return (
    <div
      className={`flex h-screen font-regular overflow-hidden ml-18 ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
      }`}
    >
      {!(isMobile && showChatMobile) && <Navbar />}

      <ChatSidebar
        groups={groups}
        onUserClick={openGroupChat}
        isMobile={isMobile}
        setShowChatMobile={setShowChatMobile}
        isDark={isDark}
        activeChat={activeChat}
        setAddPeople={() => {}}
      />

      <main
        className={
          isMobile && showChatMobile
            ? "fixed inset-0 z-40 bg-inherit flex flex-col"
            : "relative flex-1 flex flex-col"
        }
      >
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            <div className="w-28 h-28 mb-6 rounded-3xl bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
              <img src={Logo} alt="App Logo" className="w-16 h-16 rounded-full" />
            </div>

            <h1 className="text-3xl font-extrabold">Convo for Desktop</h1>
            <p className="opacity-70 max-w-md mt-3">
              Send and receive messages securely.
            </p>
          </div>
        ) : (
          <>
            <ChatHeader
              activeChat={activeChat}
              me={me}
              isMobile={isMobile}
              onBack={() => {
                setShowChatMobile(false);
                setActiveChat(null);
              }}
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

export default GroupsMessages;
