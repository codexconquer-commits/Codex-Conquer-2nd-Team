import { useEffect } from "react";
import socket from "../../../socket/socket.js";

const useMessagesSocket = ({
  activeChat,
  setMessages,
  setTypingUser,
  setOnlineUsers,
}) => {
  useEffect(() => {
    socket.on("receive-message", (msg) => {
      if (activeChat && msg.chatId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on("typing", ({ senderName }) => {
      setTypingUser(senderName + " is typing...");
    });

    socket.on("stop-typing", () => {
      setTypingUser("");
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("receive-message");
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("online-users");
    };
  }, [activeChat]);
};

export default useMessagesSocket;
