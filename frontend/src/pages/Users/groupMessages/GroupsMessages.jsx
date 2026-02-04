import { useContext, useEffect, useRef, useState } from "react";
import Logo from "../../../assets/download-removebg-preview.png";
import Navbar from "../../../components/Navbar";
import { AppContext } from "../../../context/Theme-Context";
import socket from "../../../socket/socket.js";
import api from "../../../api/axios";

import useMessagesSocket from "../messages/useMessagesSocket.js";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatSidebar from "./ChatSidebar";
import GroupInformationPopUp from "./GroupInformationpopUp";
import Loader from "../../../components/Loader/Loader";

const BASE = import.meta.env.VITE_BASE_URL;

const GroupsMessages = () => {
  const { isDark, user } = useContext(AppContext);

  const [groups, setGroups] = useState([]);
  const [adminGroups, setAdminGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);

  // 🔥 LOADERS
  const [appLoading, setAppLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  const messagesEndRef = useRef(null);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const loadMe = async () => {
      try {
        setAppLoading(true);
        const res = await api.get("/api/users/me");
        setMe(res.data);
        socket.emit("add-user", res.data._id);
      } catch (err) {
        console.error(err);
      } finally {
        setAppLoading(false);
      }
    };

    loadMe();
  }, []);

  /* ================= LOAD GROUPS ================= */
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const res = await api.get("/api/groups/myGroups");
        const fetchedGroups = res.data || [];

        setGroups(fetchedGroups);

        const adminOnly = fetchedGroups.filter(
          (g) => g.groupAdmin?._id === user?._id
        );
        setAdminGroups(adminOnly);
      } catch (err) {
        console.error(err);
      } finally {
        setGroupsLoading(false);
      }
    };

    if (user?._id) loadGroups();
  }, [user?._id]);

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
    setIsGroupInfoOpen(false);
    const group = groups.find((g) => g._id === groupId);
    if (!group) return;

    try {
      setChatLoading(true);
      setActiveChat(group);

      socket.emit("join-chat", groupId);

      const res = await api.get(`${BASE}/api/messages/${groupId}`);
      setMessages(res.data || []);

      if (isMobile) setShowChatMobile(true);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    setIsGroupInfoOpen(false);
    if (!text.trim() || !activeChat) return;

    const res = await api.post(`${BASE}/api/messages`, {
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

  /* ================= MEMBER REMOVED ================= */
  const handleMemberRemoved = (memberId, groupId) => {
    setIsGroupInfoOpen(false);

    setGroups((prev) =>
      prev.map((g) =>
        g._id === groupId
          ? { ...g, members: g.members.filter((m) => m._id !== memberId) }
          : g
      )
    );

    if (activeChat?._id === groupId) {
      setActiveChat((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== memberId),
      }));
    }
  };

  /* ================= ADMIN CHECK ================= */
  useEffect(() => {
    if (!activeChat || !me) return setIsAdmin(false);

    setIsAdmin(
      activeChat.groupAdmin?._id?.toString() === me?._id?.toString()
    );
  }, [activeChat, me]);

  /* ================= RENDER ================= */

  // ✅ ONE-TIME APP LOADER
  if (appLoading) {
    return <Loader text="Loading groups..." />;
  }

  return (
    <div
      className={`flex h-screen font-regular overflow-hidden ml-18 ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"
      }`}
    >
      {!(isMobile && showChatMobile) && <Navbar />}

      <ChatSidebar
        groups={groups}
        groupsLoading={groupsLoading}
        onUserClick={openGroupChat}
        isMobile={isMobile}
        setShowChatMobile={setShowChatMobile}
        isDark={isDark}
        activeChat={activeChat}
        setIsGroupInfoOpen={setIsGroupInfoOpen}
      />

      <main
        className={
          isMobile && showChatMobile
            ? "fixed inset-0 z-40 bg-inherit flex flex-col "
            : "relative flex-1 flex flex-col "
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
              isAdmin={isAdmin}
              isMobile={isMobile}
              onBack={() => {
                setShowChatMobile(false);
                setActiveChat(null);
              }}
              onOpenGroupInfo={() => setIsGroupInfoOpen(true)}
            />

            {/*  CHAT AREA LOADER */}
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
                isDark={isDark}
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

      {activeChat && (
        <GroupInformationPopUp
          open={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          group={activeChat}
          isAdmin={isAdmin}
          onMemberRemoved={handleMemberRemoved}
        />
      )}
    </div>
  );
};

export default GroupsMessages;
