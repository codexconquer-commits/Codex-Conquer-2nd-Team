const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // user online
    socket.on("add-user", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log("Online users:", onlineUsers);
    });

    // send message
    socket.on("send-message", ({ receiverId, message }) => {
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", message);
      }
    });

    // disconnect
    socket.on("disconnect", () => {
      for (let [key, value] of onlineUsers.entries()) {
        if (value === socket.id) {
          onlineUsers.delete(key);
          break;
        }
      }
      console.log("🔴 Socket disconnected:", socket.id);
    });
  });
};

export default socketHandler;

