import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../../components/Navbar";
import socket from "../../../socket/socket";
import axios from "axios";

const BASE = import.meta.env.VITE_BASE_URL;

// 🔥 yahan apna real groupId daal
const DEMO_GROUP_ID = "696bb95614466df1b3d35918";

const GroupsMessages = () => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [me, setMe] = useState(null);

  const messagesEndRef = useRef(null);

  /* ================= FETCH ME ================= */
  useEffect(() => {
    axios
      .get(`${BASE}/api/users/me`, { withCredentials: true })
      .then((res) => {
        setMe(res.data);
        socket.emit("add-user", res.data._id);
      });
  }, []);

  /* ================= JOIN GROUP ================= */
  useEffect(() => {
    if (!DEMO_GROUP_ID) return;

    socket.emit("join-chat", DEMO_GROUP_ID);

    socket.on("receive-message", (message) => {
      if (message.chatId === DEMO_GROUP_ID) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receive-message");
    };
  }, []);

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
    if (!text.trim()) return;

    const res = await axios.post(
      `${BASE}/api/messages`,
      {
        chatId: DEMO_GROUP_ID,
        text,
      },
      { withCredentials: true }
    );

    setMessages((prev) => [...prev, res.data]);
    setText("");

    socket.emit("send-message", {
      chatId: DEMO_GROUP_ID,
      message: res.data,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100">
    

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div>
          <h2 className="font-bold text-lg">👥 Demo Group</h2>
          <p className="text-xs text-gray-500">Group Chat Testing</p>
        </div>
      </div>

      {/* ===== MESSAGES ===== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe =
            (typeof msg.senderId === "string"
              ? msg.senderId
              : msg.senderId?._id) === me?._id;

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm shadow
                  ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-black rounded-bl-none"
                  }`}
              >
                {!isMe && (
                  <div className="text-xs font-semibold text-blue-500 mb-1">
                    {msg.senderId?.fullName || "User"}
                  </div>
                )}
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== INPUT ===== */}
      <div className="flex items-center gap-2 p-3 bg-white border-t">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default GroupsMessages;
