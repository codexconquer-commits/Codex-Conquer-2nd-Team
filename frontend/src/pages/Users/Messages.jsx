import axios from "axios";
import { ArrowLeft, Mic, Plus, Send, Settings,Phone,Video } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { AppContext } from "../../context/Theme-Context.js";
import socket from "../../socket/socket";

const BASE = import.meta.env.VITE_BASE_URL;

const Messages = () => {
  // Context and state hooks
  const { isDark, user } = useContext(AppContext);

  const [users, setUsers] = useState([]);
  const [myId, setMyId] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [me, setMe] = useState(null); // Add this line

  const isTypingRef = useRef(false);
  const [typingUser, setTypingUser] = useState("");

  const typingTimeoutRef = useRef(null);

  // Ref for auto-scroll
  const messagesEndRef = useRef(null);

  /* ================= AUTH USER ================= */
  useEffect(() => {
    axios.get(`${BASE}/api/users/me`, { withCredentials: true }).then((res) => {
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

  /* ================= OPEN CHAT WITH USER ================= */
  const openChatWithUser = async (userId) => {
    // Open or create chat with selected user
    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );

    const chat = res.data;
    setActiveChat(chat);

    socket.emit("join-chat", chat._id);

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

    const receiverId = typeof receiver === "string" ? receiver : receiver?._id;

    if (receiverId) {
      socket.emit("send-message", {
        receiverId,
        message: res.data,
      });
    }

    socket.emit("stop-typing", { chatId: activeChat._id });
    isTypingRef.current = false;
  };

  // Responsive: detect mobile screen
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Keyboard behavior for textarea
  const handleTextareaKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) sendMessage();
    }
  };

  return (
    <div
      className={`flex pt-14 h-[95vh] overflow-hidden
      ${
        isDark ? "bg-darkmode text-white" : "bg-lightmode text-black relative"
      }`}
    >
      <Navbar />

      {/* LEFT PANEL */}
      <aside
        className={`
          ${isMobile && showChatMobile ? "hidden" : "flex"}
          absolute md:relative
          left-15 md:left-0
          flex-col
          w-full md:w-[340px]
          md:ml-16
          h-full
          border-r border-white/10
          backdrop-blur-xl
          ${showChatMobile ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-xl font-extrabold">Direct Messages</h2>
          <div className="flex gap-2">
            <button className="icon-hover p-2">
              <Settings />
            </button>
            <button className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
              <Plus />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <input
              placeholder="Jump to or Search..."
              className="flex-1 bg-transparent outline-none"
            />
            <Mic size={18} />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-4">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => {
                openChatWithUser(u._id);
                if (isMobile) setShowChatMobile(true);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer
              bg-white/10 hover:bg-white/20"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {u?.fullName?.[0]}
              </div>
              <div className="flex-1 truncate">
                <p className="font-semibold truncate">{u.fullName}</p>
                <p className="text-xs opacity-70 truncate">Tap to chat</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT CHAT */}
      {/* Desktop: normal layout. Mobile: full-screen popup when showChatMobile */}
      <main
        className={
          isMobile && showChatMobile
            ? "fixed top-0 left-0 w-screen h-screen z-[9999] bg-inherit flex flex-col"
            : "relative flex-1 flex flex-col h-full hide-scrollbar " +
              (!showChatMobile && isMobile ? "hidden" : "flex")
        }
      >
        {!activeChat ? (
          // Empty state if no chat is selected
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-extrabold">Convo for Desktop</h1>
            <p className="opacity-70 max-w-md mt-2">
              Send and receive messages without relying on your phone
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div
              className={`sticky top-0 z-10 backdrop-blur-xl
              flex items-center gap-3 px-4 py-3 border-b border-white/10
              ${isMobile && showChatMobile ? "bg-inherit" : ""}`}
            >
              {isMobile && showChatMobile && (
                <div className="flex  items-center justify-between w-full">


                <button
                  className="flex gap-2 p-2 rounded-xl bg-white/10"
                  onClick={() => setShowChatMobile(false)}
                >
                  <ArrowLeft />
                </button>
                <h2 className="ml-2 font-medium text-xl ">
                  {activeChat.members
                    .map((m) =>
                      m._id === me?._id ? null : m.fullName || "Unknown User"
                    )
                    .filter(Boolean)
                    .join(", ")}
                </h2>
                <div className="flex gap-4 ml-auto">
                  <Phone />
                  <Video />
                </div>
                </div>



              )}
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
              {messages.map((m, idx) => {
                // Sender detection (string or object)
                const myIdVal = me?._id || user?._id;
                const senderId =
                  typeof m.senderId === "string" ? m.senderId : m.senderId?._id;
                const isMe = senderId === myIdVal;

                return (
                  <div
                    key={m._id || idx}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2 text-sm break-words
                        ${
                          isMe
                            ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                            : "bg-gray-200 text-black rounded-2xl rounded-bl-md ml-3"
                        }`}
                      style={{
                        wordBreak: "break-word",
                        marginBottom: "2px",
                        borderRadius: isMe
                          ? "18px 18px 6px 18px"
                          : "18px 18px 18px 6px",
                      }}
                    >
                      <p className="text-[10px] mb-1 opacity-70">
                        {isMe
                          ? "You"
                          : typeof m.senderId === "object"
                          ? m.senderId.fullName
                          : ""}
                      </p>
                      <p>{m.text}</p>
                    </div>
                  </div>
                );
              })}
              {/* Typing indicator */}
              {typingUser && (
                <div className="flex items-center px-4 py-2">
                  <span className="text-xs text-gray-500 italic">
                    {typingUser}
                  </span>
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className={`${isDark ? "bg-gray-800" : "bg-[#f3f3f3]"} p-3 rounded-2xl`}>
              <div className="flex items-center gap-2">
                <textarea
                  value={text}
                  rows={1}
                  placeholder="Type a message..."
                  className={`${isDark ? "bg-gray-800 text-white" : "bg-white text-black"} flex-1 resize-none px-4 py-2 rounded-full outline-none`}
                  onChange={(e) => {
                    setText(e.target.value);

                    if (!activeChat || !me) return;

                    if (!isTypingRef.current) {
                      socket.emit("typing", {
                        chatId: activeChat._id,
                        senderName: me.fullName,
                      });
                      isTypingRef.current = true;
                    }

                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      socket.emit("stop-typing", {
                        chatId: activeChat._id,
                      });
                      isTypingRef.current = false;
                    }, 2000);
                  }}
                  onKeyDown={handleTextareaKeyDown}
                />
                <button
                  onClick={() => text.trim() && sendMessage()}
                  className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"
                >
                  <Send size={18} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Messages;
