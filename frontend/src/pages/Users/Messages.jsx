import axios from "axios";
import { ArrowLeft, Mic, Plus, Send, Settings } from "lucide-react";
import { useContext, useEffect, useState } from "react";
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

  /* ================= GET LOGGED-IN USER ================= */
  useEffect(() => {
    // Fetch logged-in user info
    axios
      .get(`${BASE}/api/users/me`, { withCredentials: true })
      .then((res) => {
        setMyId(res.data._id);
        console.log("🧑 Logged in user:", res.data._id);
      })
      .catch(() => {
        console.error("❌ /api/me not working");
      });
  }, []);

  /* ================= SOCKET REGISTER ================= */
  useEffect(() => {
    // Register user with socket server
    if (!myId) return;

    const onConnect = () => {
      console.log("🟢 Socket connected:", socket.id);
      socket.emit("add-user", myId);
      console.log("📌 add-user emitted:", myId);
    };

    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    return () => socket.off("connect", onConnect);
  }, [myId]);

  /* ================= LOAD USERS ================= */
  useEffect(() => {
    // Load all users
    axios.get(`${BASE}/api/users`, { withCredentials: true }).then((res) => {
      console.log("👥 Users loaded");
      setUsers(res.data);
    });
  }, []);

  /* ================= LOAD CHATS ================= */
  const loadChats = () => {
    // Load all chats
    axios.get(`${BASE}/api/chats`, { withCredentials: true }).then((res) => {
      console.log("💬 Chats loaded");
      setChats(res.data);
    });
  };

  useEffect(() => {
    loadChats();
  }, []);

  /* ================= SOCKET RECEIVE ================= */
  useEffect(() => {
    // Listen for incoming messages
    const handleReceiveMessage = (msg) => {
      console.log("📩 Message received:", msg);

      if (!activeChat || msg.chatId !== activeChat._id) {
        console.log("⚠️ Message ignored (not active chat)");
        return;
      }

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive-message", handleReceiveMessage);
    return () => socket.off("receive-message", handleReceiveMessage);
  }, [activeChat]);

  /* ================= OPEN CHAT WITH USER ================= */
  const openChatWithUser = async (userId) => {
    // Open or create chat with selected user
    console.log("➡️ Opening chat with user:", userId);

    const res = await axios.post(
      `${BASE}/api/chats`,
      { userId },
      { withCredentials: true }
    );

    loadChats();
    openChat(res.data);
  };

  /* ================= OPEN CHAT ================= */
  const openChat = async (chat) => {
    // Load messages for selected chat
    console.log("📂 Chat opened:", chat._id);
    setActiveChat(chat);

    const res = await axios.get(`${BASE}/api/messages/${chat._id}`, {
      withCredentials: true,
    });

    console.log("📜 Messages loaded:", res.data.length);
    setMessages(res.data);
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    // Send a new message
    if (!text || !activeChat) return;

    console.log("✉️ Sending message:", text);

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

    const receiver = activeChat.members.find(
      (m) => m._id !== res.data.senderId
    );

    console.log("📤 Emitting to receiver:", receiver._id);

    socket.emit("send-message", {
      receiverId: receiver._id,
      message: res.data,
    });
  };

  // ================= RENDER =================
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
          absolute md:relative
          left-15 md:left-0
          flex flex-col
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
              onClick={() => openChatWithUser(u._id)}
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
      <main
        className={`relative flex-1 flex flex-col h-full  hide-scrollbar
        ${!showChatMobile ? "hidden md:flex" : "flex"}`}
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
              className="sticky top-0 z-10 backdrop-blur-xl
              flex items-center gap-3 px-4 py-3 border-b border-white/10"
            >
              <button
                className="md:hidden flex gap-2 absolute right-4 p-2 rounded-xl bg-white/10"
                onClick={() => setShowChatMobile(false)}
              >
                <ArrowLeft /> Back
              </button>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24">
  {messages.map((m) => {
    const isMe =
      m.senderId === user?._id || m.senderId?._id === user?._id;

    return (
      <div
        key={m._id}
        className={`flex ${isMe ? "justify-end" : "justify-start" }`}
      >
        <div
          className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words
            ${
              isMe
                ? "bg-blue-600 text-white rounded-br-none"
                : "bg-gray-200 text-black rounded-bl-none  ml-3 "
            }`}
        >
          {/* Sender Label */}
          <p className="text-[10px] mb-1 opacity-70">
            {isMe ? "You" : m.senderId?.fullName}
          </p>

          {/* Message */}
          <p>{m.text}</p>
        </div>
      </div>
    );
  })}
</div>

            {/* Message input */}
            <div className="p-3 bg-[#f3f3f3] rounded-2xl">
              <div className="flex items-center gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  // Handle Enter key for sending
                  rows={1}
                  placeholder="Type a message..."
                  className="flex-1 resize-none px-4 py-2 rounded-full bg-white outline-none"
                />
                <button
                  onClick={sendMessage}
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
