import   groupCalling from "./group-calling.js";

const onlineUsers = new Map(); // userId -> Set(socketId)

/* 🔁 Helper: emit event to all sockets of a user */
const emitToUser = (io, userId, event, payload) => {
  const sockets = onlineUsers.get(userId?.toString());
  if (!sockets) return;

  for (const socketId of sockets) {
    io.to(socketId).emit(event, payload);
  }
};

const socketHandler = (io) => {
  io.on("connection", (socket) => {

    /* ================= USER ONLINE ================= */
    socket.on("add-user", (userId) => {
      if (!userId) return;

      const key = userId.toString();

      if (!onlineUsers.has(key)) {
        onlineUsers.set(key, new Set());
      }

      onlineUsers.get(key).add(socket.id);

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    /* ================= JOIN CHAT ================= */
    socket.on("join-chat", (chatId) => {
      if (!chatId) return;
      socket.join(chatId);
    });

    /* ================= MESSAGES ================= */
    socket.on("send-message", ({ chatId, message }) => {
      if (!chatId || !message) return;
      socket.to(chatId).emit("receive-message", message);
    });

    socket.on("typing", ({ chatId, senderName }) => {
      socket.to(chatId).emit("typing", { senderName });
    });

    socket.on("stop-typing", ({ chatId }) => {
      socket.to(chatId).emit("stop-typing");
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
      for (const [userId, sockets] of onlineUsers.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);

          if (sockets.size === 0) {
            onlineUsers.delete(userId);
          }

          io.emit("online-users", Array.from(onlineUsers.keys()));
          break;
        }
      }
    });

    /* ================= AUDIO CALL ================= */
    socket.on("call-user", ({ toUserId, offer, fromUser }) => {
      emitToUser(io, toUserId, "incoming-call", { offer, fromUser });
    });

    socket.on("accept-call", ({ toUserId, answer }) => {
      emitToUser(io, toUserId, "call-accepted", { answer });
    });

    socket.on("reject-call", ({ toUserId }) => {
      emitToUser(io, toUserId, "call-rejected");
    });

    socket.on("ice-candidate", ({ toUserId, candidate }) => {
      emitToUser(io, toUserId, "ice-candidate", { candidate });
    });

    socket.on("end-call", ({ toUserId }) => {
      emitToUser(io, toUserId, "call-ended");
    });

    /* ================= VIDEO CALL ================= */
    socket.on("call-user-video", ({ toUserId, offer, fromUser }) => {
      emitToUser(io, toUserId, "incoming-video-call", { offer, fromUser });
    });

    socket.on("accept-video-call", ({ toUserId, answer }) => {
      emitToUser(io, toUserId, "video-call-accepted", { answer });
    });

    socket.on("reject-video-call", ({ toUserId }) => {
      emitToUser(io, toUserId, "video-call-rejected");
    });

    socket.on("video-ice-candidate", ({ toUserId, candidate }) => {
      emitToUser(io, toUserId, "video-ice-candidate", { candidate });
    });

    socket.on("end-video-call", ({ toUserId }) => {
      emitToUser(io, toUserId, "video-call-ended");
    });
    groupCalling(io, socket, emitToUser);
  });
};


export default socketHandler;


