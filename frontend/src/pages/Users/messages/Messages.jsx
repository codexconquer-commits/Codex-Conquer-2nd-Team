import { useContext, useEffect, useRef, useState } from "react";
import Logo from "../../../assets/download-removebg-preview.png";
import Navbar from "../../../components/Navbar";
import { AppContext } from "../../../context/Theme-Context";
import socket from "../../../socket/socket.js";

import api from "../../../api/axios";
import AudioCall from "./AudioCall.jsx";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";
import ChatSidebar from "./ChatSidebar";
import useMessagesSocket from "./useMessagesSocket";
import useAudio from "./useAudioCall.js";
import useVideoCall from "./useVideoCall.js";
import VideoCall from "./VideoCall.jsx";


const BASE = import.meta.env.VITE_BASE_URL;

const Messages = () => {
  const { isDark, user } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);
  const audio = useAudio(me);
const video = useVideoCall(me);
const remoteVideoRef = useRef(null);
const [localVideoStream, setLocalVideoStream] = useState(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatMobile, setShowChatMobile] = useState(false);

  const messagesEndRef = useRef(null);

  /* ================= LOAD USER & USERS ================= */

  useEffect(() => {
    api
      .get("/api/users/me")
      .then((res) => {
        setMe(res.data);
        socket.emit("add-user", res.data._id);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    api.get("/api/users").then((res) => {
      setUsers(res.data || []);
    });
  }, []);

  /* ================= SOCKET MESSAGE LISTENER ================= */

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

  /* ================= OPEN CHAT ================= */

  const openChatWithUser = async (userId) => {
    const res = await api.post(
      `/api/chats`,
      { userId },
      { withCredentials: true }
    );

    setActiveChat(res.data);
    socket.emit("join-chat", res.data._id);

    const msgs = await api.get(`/api/messages/${res.data._id}`);
    setMessages(msgs.data || []);

    if (isMobile) setShowChatMobile(true);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;

    const res = await api.post(`/api/messages`, {
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
      className={`flex h-screen font-regular overflow-hidden ml-18  ${
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
        isDark={isDark}
        showChatMobile={showChatMobile}
        activeChat={activeChat}
      />

      <main
        className={
          isMobile && showChatMobile
            ? "fixed top-0 left-0 w-screen h-screen z-40 bg-inherit flex flex-col"
            : "relative flex-1 flex flex-col h-full"
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

            <h1 className="text-3xl font-extrabold tracking-tight">
              Convo for Desktop
            </h1>

            <p className="opacity-70 max-w-md mt-3 text-sm sm:text-base">
              Send and receive messages without relying on your phone
              connection.
            </p>

            <div className="flex items-center gap-2 mt-10 text-xs opacity-60">
              <span className="text-lg">🔒</span>
              <span>Your personal messages are end-to-end encrypted</span>
            </div>
          </div>
        ) : (
          <>
            <ChatHeader
  onCall={() => {
    const otherUser = activeChat.members.find(
      (m) => m._id !== me._id
    );
    if (otherUser) audio.startAudioCall(otherUser);
  }}

  onVideoCall={async () => {
    const otherUser = activeChat.members.find(
      (m) => m._id !== me._id
    );
    if (otherUser) {
      const stream = await video.startVideoCall(
        otherUser,
        remoteVideoRef.current
      );
      setLocalVideoStream(stream);
    }
  }}

  activeChat={activeChat}
  me={me}
  onlineUsers={onlineUsers}
  isMobile={isMobile}
  onBack={() => {
    setShowChatMobile(false);
    setActiveChat(null);
  }}
/>

            {/* 🔥 Audio Call Popup */}
            <AudioCall
              open={audio.isCallOpen}
              isConnected={audio.isCallConnected}
              callerName={audio.caller?.fullName || "User"}
              callerAvatar={audio.caller?.fullName?.[0] || "U"}
              isCalling={!audio.isCallConnected && !!audio.caller}
              isIncoming={!!audio.incomingCall}
              isMuted={audio.isMuted}
              onAccept={audio.acceptAudioCall}
              onReject={audio.rejectAudioCall}
              onClose={audio.endAudioCall}
              onMuteToggle={audio.toggleMute}
            />

            <VideoCall
  open={video.isCallOpen}
  isConnected={video.isCallConnected}
  callerName={video.caller?.fullName || "User"}
  isIncoming={!!video.incomingCall}
  isMuted={video.isMuted}
  isCameraOff={video.isCameraOff}
  localStream={localVideoStream}
  remoteVideoRef={remoteVideoRef}
  onAccept={async () => {
    const stream = await video.acceptVideoCall(remoteVideoRef.current);
    setLocalVideoStream(stream);
  }}
  onReject={video.endVideoCall}
  onEnd={video.endVideoCall}
  onMuteToggle={video.toggleMute}
  onCameraToggle={video.toggleCamera}
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
