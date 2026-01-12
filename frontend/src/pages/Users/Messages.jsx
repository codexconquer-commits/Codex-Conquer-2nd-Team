import axios from "axios";
import {
  Mic,
  Plus,
  Settings,
  ArrowLeft,
  Send,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import socket from "../../socket/socket";
import { AppContext } from "../../context/Theme-Context.js";

const BASE = import.meta.env.VITE_BASE_URL;
const NAVBAR_HEIGHT = "3.5rem"; // h-14

const Messages = () => {
  const { isDark, user } = useContext(AppContext);

  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showChatMobile, setShowChatMobile] = useState(false);

  /* ================= USERS ================= */
  useEffect(() => {
    axios
      .get(`${BASE}/api/users`, { withCredentials: true })
      .then((res) => setUsers(res.data || []))
      .catch(() => setUsers([]));
  }, []);

  /* ================= SOCKET ================= */
  useEffect(() => {
    const handler = (msg) => {
      if (!msg) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive-message", handler);
    return () => socket.off("receive-message", handler);
  }, []);

  /* ================= OPEN CHAT ================= */
  const openChatWithUser = async (userId) => {
    try {
      const chatRes = await axios.post(
        `${BASE}/api/chats`,
        { userId },
        { withCredentials: true }
      );

      setActiveChat(chatRes.data);
      setShowChatMobile(true);

      const msgRes = await axios.get(
        `${BASE}/api/messages/${chatRes.data._id}`,
        { withCredentials: true }
      );

      setMessages(msgRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim() || !activeChat?._id) return;

    try {
      const res = await axios.post(
        `${BASE}/api/messages`,
        {
          chatId: activeChat._id,
          text: text.trim(),
        },
        { withCredentials: true }
      );

      setMessages((prev) => [...prev, res.data]);
      setText("");

      const receiver = activeChat.members?.find(
        (m) => m?._id !== user?._id
      );

      if (receiver?._id) {
        socket.emit("send-message", {
          receiverId: receiver._id,
          message: res.data,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= ENTER KEY ================= */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`flex pt-14 h-[calc(100vh-${NAVBAR_HEIGHT})] overflow-hidden
      ${isDark ? "bg-darkmode text-white" : "bg-lightmode text-black"}`}
    >
      {/* NAVBAR (ALWAYS VISIBLE) */}
      <Navbar />

      {/* ================= LEFT PANEL ================= */}
      <aside
        className={`
          flex flex-col
          w-full md:w-[340px]
          md:ml-16
          h-full
          border-r border-white/10
          backdrop-blur-xl
          ${showChatMobile ? "hidden md:flex" : "flex"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <h2 className="text-xl font-extrabold">
            Direct Messages
          </h2>

          <div className="flex gap-2">
            <button className="icon-hover p-2">
              <Settings />
            </button>
            <button className="p-2 rounded-xl bg-gradient-to-tr from-blue-500 to-purple-500 text-white">
              <Plus />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
            <input
              placeholder="Jump to or Search..."
              className="flex-1 bg-transparent outline-none"
            />
            <Mic size={18} />
          </div>
        </div>

        {/* Users */}
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
                <p className="font-semibold truncate">
                  {u.fullName}
                </p>
                <p className="text-xs opacity-70 truncate">
                  Tap to chat
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ================= RIGHT CHAT ================= */}
      <main
        className={`
          flex-1 flex flex-col h-full
          ${!showChatMobile ? "hidden md:flex" : "flex"}
        `}
      >
        {!activeChat ? (
          /* EMPTY STATE */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-extrabold">
              Convo for Desktop
            </h1>
            <p className="opacity-70 max-w-md mt-2">
              Send and receive messages without relying on your phone
            </p>
            <p className="mt-6 text-sm opacity-60">
              🔒 End-to-end encrypted
            </p>
          </div>
        ) : (
          <>
            {/* CHAT HEADER */}
            <div className="sticky top-0 z-10 backdrop-blur-xl
              flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <button
                className="md:hidden flex gap-2 absolute right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20"
                onClick={() => setShowChatMobile(false)}
              >
                <ArrowLeft /><div className="font-semibold">
                Back
              </div>
              </button>

            </div>

            {/* MESSAGES */}
            <div className="flex-1  overflow-y-auto px-4 py-3 space-y-3 pb-24">
              {messages
                .filter(Boolean)
                .map((m) => {
                  const isMe =
                    m.senderId === user?._id ||
                    m.senderId?._id === user?._id;

                  return (
                    <div
                      key={m._id}
                      className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm
                      ${
                        isMe
                          ? "ml-auto bg-blue-600 text-white"
                          : "bg-white/10"
                      }`}
                    >
                      {m.text}
                    </div>
                  );
                })}
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2 items-center w-[85%] ml-20 md:w-full ">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Type a message..."
                  className="flex-1 resize-none px-4 py-2 rounded-full
                  bg-white/10 outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="p-3 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500"
                >
                  <Send size={18} />
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
