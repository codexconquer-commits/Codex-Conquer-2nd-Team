const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // Register user
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId.toString(), socket.id);
      console.log("👤 User online:", userId);
    });

    // Join chat room
    socket.on("join-chat", (chatId) => {
      socket.join(chatId);
      console.log("📥 Joined chat room:", {
        chatId,
        socketId: socket.id,
      });
    });

    // Send message
    socket.on("send-message", ({ receiverId, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId?.toString());

      if (receiverSocketId) {
        // 🔥 FORCE receiver to join room
        const receiverSocket = io.sockets.sockets.get(receiverSocketId);
        receiverSocket?.join(message.chatId);

        io.to(receiverSocketId).emit("receive-message", message);

        console.log("📤 Message sent:", {
          to: receiverId,
          chatId: message.chatId,
        });
      }
    });

    // Typing indicator
    socket.on("typing", ({ chatId, senderName }) => {
      console.log("✍️ typing:", senderName, chatId);
      socket.to(chatId).emit("typing", { senderName });
    });

    socket.on("stop-typing", ({ chatId }) => {
      console.log("🛑 stop typing:", chatId);
      socket.to(chatId).emit("stop-typing");
    });

    socket.on("disconnect", () => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log("🔴 User offline:", userId);
          break;
        }
      }
    });
  });
};

export default socketHandler;
