const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    socket.on("add-user", (userId) => {
      if (!userId) return;
      onlineUsers.set(userId.toString(), socket.id);
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("send-message", ({ receiverId, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", message);
      }
    });

    socket.on("typing", ({ chatId, senderName }) => {
      socket.to(chatId).emit("typing", { senderName });
    });

    socket.on("stop-typing", ({ chatId }) => {
      socket.to(chatId).emit("stop-typing");
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("online-users", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });
  });
};

export default socketHandler;
