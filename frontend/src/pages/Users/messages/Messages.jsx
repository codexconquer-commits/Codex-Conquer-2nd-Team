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
import api from "../../../api/axios";

let peerConnection;
let localStream;

let remoteAudioEl;

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

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
  api.get("/api/users/me")
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

  /* ================= OPEN CHAT ================= */

  const openChatWithUser = async (userId) => {
    const res = await api.post(
      `/api/chats`,
      { userId },
      { withCredentials: true }
    );

    setActiveChat(res.data);

    // ✅ JOIN ROOM (important for group & private)
    socket.emit("join-chat", res.data._id);

    const msgs = await api.get(`/api/messages/${res.data._id}`);

    setMessages(msgs.data || []);
    if (isMobile) setShowChatMobile(true);
  };

  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if (!text.trim() || !activeChat) return;

    const res = await api.post(
      `/api/messages`,
      { chatId: activeChat._id, text },
    );

    // ✅ Local update
    setMessages((prev) => [...prev, res.data]);
    setText("");

    // 🔥 SOCKET EMIT (WORKS FOR GROUP + 1-to-1)
    socket.emit("send-message", {
      chatId: activeChat._id,
      message: res.data,
    });
  };

  const attachRemoteAudio = (stream) => {
  if (!remoteAudioEl) {
    remoteAudioEl = document.createElement("audio");
    remoteAudioEl.autoplay = true;
    remoteAudioEl.playsInline = true;
    remoteAudioEl.muted = false; // 🔥 important
    document.body.appendChild(remoteAudioEl);
  }

  remoteAudioEl.srcObject = stream;

  remoteAudioEl.play().catch((err) => {
    console.log("🔇 Audio play blocked:", err);
  });
};


  const startAudioCall = async () => {
  if (!activeChat || !me) return;

  const otherUser = activeChat.members.find(
    (m) => m._id !== me._id
  );

  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  peerConnection = new RTCPeerConnection(RTC_CONFIG);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", {
        toUserId: otherUser._id,
        candidate: e.candidate,
      });
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("call-user", {
    toUserId: otherUser._id,
    offer,
    fromUser: {
      _id: me._id,
      fullName: me.fullName,
    },
  });

peerConnection.ontrack = (e) => {
  const stream = e.streams[0];

  stream.getAudioTracks().forEach((track) => {
    track.enabled = true;
    console.log("🎧 Remote track:", track);
  });

  attachRemoteAudio(stream);
};

  console.log("📞 Calling...");
};

useEffect(() => {
  socket.on("incoming-call", async ({ offer, fromUser }) => {
    console.log("📞 Incoming call from", fromUser.fullName);

    const accept = window.confirm(
      `Incoming call from ${fromUser.fullName}`
    );

    if (!accept) {
      socket.emit("reject-call", {
        toUserId: fromUser._id,
      });
      return;
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    peerConnection = new RTCPeerConnection(RTC_CONFIG);

    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

   peerConnection.ontrack = (e) => {
  const stream = e.streams[0];

  stream.getAudioTracks().forEach((track) => {
    track.enabled = true;
    console.log("🎧 Remote track:", track);
  });

  attachRemoteAudio(stream);
};

    peerConnection.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          toUserId: fromUser._id,
          candidate: e.candidate,
        });
      }
    };

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("accept-call", {
      toUserId: fromUser._id,
      answer,
    });
  });

  socket.on("call-accepted", async ({ answer }) => {
    await peerConnection.setRemoteDescription(answer);
    console.log("✅ Call connected");
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (candidate) {
      await peerConnection.addIceCandidate(candidate);
    }
  });

  return () => {
    socket.off("incoming-call");
    socket.off("call-accepted");
    socket.off("ice-candidate");
  };
}, []);

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
              onCall={startAudioCall}
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

