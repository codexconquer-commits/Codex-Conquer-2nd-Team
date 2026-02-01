import { useEffect } from "react";
import socket from "../../../socket/socket";

const useMessagesSocket = ({
  activeChat,
  setMessages,
  setTypingUser,
  setOnlineUsers,
}) => {

  // 🌐 ONLINE USERS (GLOBAL)
  useEffect(() => {
    const handleOnlineUser = (users) => {
      setOnlineUsers(users);
    };

    socket.on("online-users", handleOnlineUser);

    return () => {
      socket.off("online-users", handleOnlineUser);
    };
  }, []);

  // 💬 CHAT EVENTS (CHAT DEPENDENT)
  useEffect(() => {
    if (!activeChat?._id) return;

    const handleMessage = (message) => {
      if (message.chatId === activeChat._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = ({ senderName }) => {
      setTypingUser(senderName);
    };

    const handleStopTyping = () => {
      setTypingUser("");
    };

    socket.on("receive-message", handleMessage);
    socket.on("typing", handleTyping);
    socket.on("stop-typing", handleStopTyping);

    return () => {
      socket.off("receive-message", handleMessage);
      socket.off("typing", handleTyping);
      socket.off("stop-typing", handleStopTyping);
    };
  }, [activeChat?._id]);
};

export default useMessagesSocket;
