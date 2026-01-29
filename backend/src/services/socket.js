const onlineUsers = new Map();

const socketHandler = (io) => {
  io.on("connection", (socket) => {

    // 🔹 User comes online
    socket.on("add-user", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);

      // sabko updated online users bhejo
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // 🔹 Join chat room (1-to-1 OR Group)
    socket.on("join-chat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
    });

    // 🔥 SEND MESSAGE (WORKS FOR BOTH GROUP & 1-TO-1)
    socket.on("send-message", ({ chatId, message }) => {
      if (!chatId || !message) return;

      // sender ke alawa sabko message mile
      socket.to(chatId).emit("receive-message", message);
    });

    // 🔹 Typing indicator
    socket.on("typing", ({ chatId, senderName }) => {
      socket.to(chatId).emit("typing", { senderName });
    });

    socket.on("stop-typing", ({ chatId }) => {
      socket.to(chatId).emit("stop-typing");
    });

    // 🔹 User disconnect
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("online-users", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });



// 📞 CALL USER
socket.on("call-user", ({ toUserId, offer, fromUser }) => {
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("incoming-call", {
      offer,
      fromUser,
    });
  }
});

// ✅ ACCEPT CALL
socket.on("accept-call", ({ toUserId, answer }) => {
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-accepted", {
      answer,
    });
  }
});

// ❌ REJECT CALL
socket.on("reject-call", ({ toUserId }) => {
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-rejected");
  }
});

// 🌐 ICE CANDIDATE
socket.on("ice-candidate", ({ toUserId, candidate }) => {
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("ice-candidate", {
      candidate,
    });
  }
});

// 🛑 END CALL
socket.on("end-call", ({ toUserId }) => {
  const targetSocketId = onlineUsers.get(toUserId);
  if (targetSocketId) {
    io.to(targetSocketId).emit("call-ended");
  }
});
});
};

export default socketHandler;
