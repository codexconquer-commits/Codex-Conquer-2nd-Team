import { useEffect, useState } from "react";
import api from "../../../api/axios";
import Navbar from "../../../components/Navbar";

const Home = () => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [me, setMe] = useState(null);

  /* ================= LOAD ME ================= */
  useEffect(() => {
    const loadMe = async () => {
      const res = await api.get("/api/users/me");
      setMe(res.data);
    };
    loadMe();
  }, []);

  /* ================= LOAD CHATS ================= */
  useEffect(() => {
    if (!me) return;

    const loadChats = async () => {
      const res = await api.get("/api/chats");
      setChats(res.data || []);
    };
    loadChats();
  }, [me]);

  /* ================= OPEN CHAT ================= */
  const openChat = async (chat) => {
    setActiveChat(chat);

    // messages load (backend will mark seen=true)
    const res = await api.get(`/api/messages/${chat._id}`);
    setMessages(res.data || []);

    // demo unread clear
    setChats((prev) =>
      prev.map((c) =>
        c._id === chat._id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  if (!me) return <p>Loading...</p>;

  return (
    <div className="bg-black" style={{ display: "flex", height: "100vh" }}>
      <Navbar/>
      {/* ================= CHAT LIST ================= */}
      <div className="ml-30 mt-25" style={{ width: "300px", borderRight: "1px solid gray" }}>
        <h3>Chats</h3>

        {chats.map((chat) => {

          const otherUser = !chat.isGroupChat
            ? chat.members.find((m) => m._id !== me._id)
            : null;

          const chatName = chat.isGroupChat
            ? chat.groupName
            : otherUser?.fullName || "DM";

          //  DEMO unread logic
          const showUnread =
            chat.lastMessage && chat.lastMessage.seen === false;

          return (
            <div
              key={chat._id}
              onClick={() => openChat(chat)}
              style={{
                padding: "10px",
                cursor: "pointer",
                background:
                  activeChat?._id === chat._id ? "#ddd" : "transparent",
              }}
            >
              <div>
                <b>{chatName}</b>
              </div>

              {showUnread && <span>● Unread</span>}
            </div>
          );
        })}
      </div>

      {/* ================= CHAT WINDOW ================= */}
      <div style={{ flex: 1, padding: "10px" }}>
        {!activeChat ? (
          <p>Select a chat</p>
        ) : (
          <>
            <h3>
              {activeChat.isGroupChat
                ? activeChat.groupName
                : "Direct Chat"}
            </h3>

            {messages.map((m) => (
              <div key={m._id}>
                <b>{m.senderId.fullName}:</b> {m.text}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
