import { useEffect } from "react";
import socket from "../../../socket/socket";

const useMessagesSocket = ({
  activeChat,
  setMessages,
  setTypingUser,
  setOnlineUsers,
}) => {
  useEffect(() => {

    const handleOnlineUser =(users)=>{
      setOnlineUsers(users);
    }

    socket.on("receive-message", (message) => {
      if (message.chatId === activeChat?._id) {
        setMessages((prev) => [...prev, message]);
      }
    });


    socket.on("typing", ({ senderName }) => {
      setTypingUser(senderName);
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
      socket.off("online-users",handleOnlineUser);
    };
  }, [activeChat]);
};

export default useMessagesSocket;
