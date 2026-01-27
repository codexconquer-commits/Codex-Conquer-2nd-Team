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

// ================= GLOBAL REFS =================
let peerConnection;
let localStream;
let remoteAudioEl;

const RTC_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const BASE = import.meta.env.VITE_BASE_URL;

const Messages = () => {
  const { isDark, user } = useContext(AppContext);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callerName, setCallerName] = useState("User");
  const [callRemoteUser, setCallRemoteUser] = useState(null);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

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

  /* ================= AUDIO HELPERS ================= */

  const attachRemoteAudio = (stream) => {
    if (!remoteAudioEl) {
      remoteAudioEl = document.createElement("audio");
      remoteAudioEl.autoplay = true;
      remoteAudioEl.playsInline = true;
      remoteAudioEl.muted = false;
      document.body.appendChild(remoteAudioEl);
    }

    remoteAudioEl.srcObject = stream;

    remoteAudioEl.play().catch((err) => {
      console.log("🔇 Audio play blocked:", err);
    });
  };

  const cleanupAudioCall = () => {
    // ✅ Stop local tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      localStream = null;
    }

    // ✅ Stop remote audio
    if (remoteAudioEl) {
      remoteAudioEl.srcObject = null;
      if (document.body.contains(remoteAudioEl)) {
        document.body.removeChild(remoteAudioEl);
      }
      remoteAudioEl = null;
    }

    // ✅ Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    // ✅ Reset state
    setIsCallConnected(false);
    setCallRemoteUser(null);
    setIncomingCallData(null);
    setIsMuted(false);
  };

  const endAudioCall = () => {
    // ✅ Notify remote user
    if (callRemoteUser) {
      socket.emit("end-call", {
        toUserId: callRemoteUser._id,
      });
    }

    // ✅ Cleanup
    cleanupAudioCall();
    setIsCallOpen(false);
  };

  /* ================= MUTE / UNMUTE HANDLERS ================= */

  const handleMuteToggle = (muteState) => {
    // ✅ Disable/enable audio track
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !muteState;
        setIsMuted(muteState);
        console.log(muteState ? "🔇 Muted" : "🎤 Unmuted");
      }
    }
  };

  /* ================= START AUDIO CALL ================= */

  const startAudioCall = async () => {
    if (!activeChat || !me) return;

    const otherUser = activeChat.members.find((m) => m._id !== me._id);
    if (!otherUser) return;

    try {
      // ✅ Get local audio
      localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // ✅ Create peer connection
      peerConnection = new RTCPeerConnection(RTC_CONFIG);

      // ✅ Add tracks to peer connection
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });

      // ✅ Handle ICE candidates
      peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit("ice-candidate", {
            toUserId: otherUser._id,
            candidate: e.candidate,
          });
        }
      };

      // ✅ Handle remote track
      peerConnection.ontrack = (e) => {
        const stream = e.streams[0];
        stream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });
        attachRemoteAudio(stream);
      };

      // ✅ Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      setCallerName(otherUser.fullName);
      setCallRemoteUser(otherUser);
      setIsCallOpen(true);

      socket.emit("call-user", {
        toUserId: otherUser._id,
        offer,
        fromUser: {
          _id: me._id,
          fullName: me.fullName,
        },
      });

      console.log("📞 Calling...");
    } catch (error) {
      console.error("❌ Failed to start call:", error);
      cleanupAudioCall();
    }
  };

  /* ================= WEBRTC SOCKET LISTENERS ================= */

  useEffect(() => {
    // ================= INCOMING CALL =================
    const handleIncomingCall = async ({ offer, fromUser }) => {
      console.log("📞 Incoming call from", fromUser.fullName);

      setCallerName(fromUser.fullName);
      setCallRemoteUser(fromUser);
      setIncomingCallData({ offer, fromUser });
      setIsCallOpen(true);
    };

    // ================= AUTO ACCEPT & ANSWER =================
    const acceptIncomingCall = async () => {
      if (!incomingCallData || !me) return;

      const { offer, fromUser } = incomingCallData;

      try {
        // ✅ Get local audio
        localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        // ✅ Create peer connection
        peerConnection = new RTCPeerConnection(RTC_CONFIG);

        // ✅ Add tracks
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });

        // ✅ Handle remote track
        peerConnection.ontrack = (e) => {
          const stream = e.streams[0];
          stream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });
          attachRemoteAudio(stream);
        };

        // ✅ Handle ICE candidates
        peerConnection.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", {
              toUserId: fromUser._id,
              candidate: e.candidate,
            });
          }
        };

        // ✅ Set remote description and create answer
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // ✅ Send answer
        socket.emit("accept-call", {
          toUserId: fromUser._id,
          answer,
        });

        setIsCallConnected(true);
        setIncomingCallData(null);

        console.log("✅ Call accepted");
      } catch (error) {
        console.error("❌ Failed to accept call:", error);
        cleanupAudioCall();
      }
    };

    // ✅ Auto-accept when AudioCall opens with incoming call data
    if (isCallOpen && incomingCallData && !isCallConnected) {
      acceptIncomingCall();
    }

    // ================= CALL ACCEPTED =================
    const handleCallAccepted = async ({ answer }) => {
      try {
        if (peerConnection) {
          await peerConnection.setRemoteDescription(answer);
          setIsCallConnected(true);
          console.log("✅ Call connected");
        }
      } catch (error) {
        console.error("❌ Failed to set remote description:", error);
      }
    };

    // ================= ICE CANDIDATE =================
    const handleIceCandidate = async ({ candidate }) => {
      try {
        if (candidate && peerConnection) {
          await peerConnection.addIceCandidate(candidate);
        }
      } catch (error) {
        console.error("❌ Failed to add ICE candidate:", error);
      }
    };

    // ================= CALL REJECTED =================
    const handleCallRejected = () => {
      console.log("❌ Call rejected");
      cleanupAudioCall();
      setIsCallOpen(false);
    };

    // ================= CALL ENDED =================
    const handleCallEnded = () => {
      console.log("📞 Call ended");
      cleanupAudioCall();
      setIsCallOpen(false);
    };

    // ================= REGISTER LISTENERS =================
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    // ================= CLEANUP =================
    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
    };
  }, [isCallOpen, incomingCallData, isCallConnected, me]);

  /* ================= CLEANUP ON UNMOUNT =================*/

  useEffect(() => {
    return () => {
      cleanupAudioCall();
    };
  }, []);

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
              onCall={startAudioCall}
              activeChat={activeChat}
              me={me}
              onlineUsers={onlineUsers}
              isCallOpen={isCallOpen}
              isMobile={isMobile}
              onBack={() => {
                setShowChatMobile(false);
                setActiveChat(null);
              }}
            />

            {/* 🔥 Audio Call Popup */}
            <AudioCall
              open={isCallOpen}
              isConnected={isCallConnected}
              callerName={callerName}
              callerAvatar={callerName?.[0]?.toUpperCase() || "U"}
              isCalling={!isCallConnected && !!callRemoteUser}
              onClose={endAudioCall}
              isMuted={isMuted}
              onMuteToggle={handleMuteToggle}
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
