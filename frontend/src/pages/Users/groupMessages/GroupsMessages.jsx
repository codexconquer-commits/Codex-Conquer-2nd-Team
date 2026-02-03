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


const BASE = import.meta.env.VITE_BASE_URL;

const GroupsMessages = () => {
  const { isDark, user } = useContext(AppContext);
  const [adminGroups, setAdminGroups] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading,setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  console.log(isLoading, "This is a group message");

  /* ================= USER ================= */

  useEffect(() => {
    const loadMe = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/api/users/me");
        setMe(res.data);
        socket.emit("add-user", res.data._id);
      } catch (error) {
        console.error(error.message);
      } finally{
        setIsLoading(false);
      }
    };
    loadMe();
  }, []);

  /* ================= GROUPS ================= */

  useEffect(() => {
    const loadGroups = async () => {
      
      const res = await api.get("/api/groups/myGroups");

      const fetchedGroups = res.data || [];

      setGroups(fetchedGroups);
      // 👑 Admin groups nikaalo
      const adminOnlyGroups = fetchedGroups.filter(
        (group) => group.groupAdmin?._id === user?._id
      );

      setAdminGroups(adminOnlyGroups);
    };
    loadGroups();
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

    setActiveChat(group);

    // 🔌 join socket room
    socket.emit("join-chat", groupId);

    // 📩 fetch messages
    const res = await api.get(`${BASE}/api/messages/${groupId}`);

    setMessages(res.data || []);

    if (isMobile) setShowChatMobile(true);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    setIsGroupInfoOpen(false);
    if (!text.trim() || !activeChat) return;

    const res = await api.post(`${BASE}/api/messages`, {
      chatId: activeChat._id,
      text,
    });
     setIsGroupInfoOpen(false);

    setMessages((prev) => [...prev, res.data]);
    setText("");

    socket.emit("send-message", {
      chatId: activeChat._id,
      message: res.data,
    });
  };

  // ✅ Handle member removal - sync with groups state
  const handleMemberRemoved = (memberId, groupId) => {
     setIsGroupInfoOpen(false);
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g._id === groupId
          ? {
              ...g,
              members: g.members.filter((m) => m._id !== memberId),
            }
          : g
      )
    );

    // Update active chat if viewing the same group
    if (activeChat?._id === groupId) {
       setIsGroupInfoOpen(false);
      setActiveChat((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m._id !== memberId),
      }));
    }
  };

  useEffect(() => {
    if (!activeChat || !me) {
      setIsAdmin(false);
      return;
    }

    const adminCheck =
      activeChat.groupAdmin?._id?.toString() === me?._id?.toString();
    setIsAdmin(adminCheck);
  }, [activeChat, me]);

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
        setGroups={setGroups}
        onUserClick={openGroupChat}
        isMobile={isMobile}
        setShowChatMobile={setShowChatMobile}
        isDark={isDark}
        activeChat={activeChat}
        setIsGroupInfoOpen={setIsGroupInfoOpen}
        loaderabc={isLoading}
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
              <img
                src={Logo}
                alt="App Logo"
                className="w-16 h-16 rounded-full"
              />
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

            <ChatMessages
              messages={messages}
              me={me}
              typingUser={typingUser}
              messagesEndRef={messagesEndRef}
              isDark={isDark}
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

      {/* Group Information Modal */}
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
