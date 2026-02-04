/* =====================================================
   ========== AXE LEVEL GROUP CALLING SYSTEM ==========
   ===================================================== */

const groupCallRooms = new Map();
// roomId -> Set(userId)

const activeGroupCalls = new Map();
// roomId -> { callerId, type, activeUsers:Set }

const userBusy = new Set();
// userId

const groupCalling = (io, socket, emitToUser) => {

  /* ================= START GROUP CALL ================= */

  socket.on("start-group-call", ({ roomId, callerId, type = "audio" }) => {
    console.log("🔔 start-group-call", { roomId, callerId, type });

    if (!roomId || !callerId) return;

    if (activeGroupCalls.has(roomId)) {
      emitToUser(io, callerId, "group-call-busy", {
        reason: "Call already active",
      });
      return;
    }

    activeGroupCalls.set(roomId, {
      callerId,
      type,
      activeUsers: new Set([callerId]),
    });

    userBusy.add(callerId);

    socket.to(roomId).emit("group-call-ringing", {
      roomId,
      callerId,
      type,
    });
  });

  /* ================= ACCEPT ================= */

  socket.on("accept-group-call", ({ roomId, userId }) => {
    console.log("✅ accept-group-call", { roomId, userId });

    const call = activeGroupCalls.get(roomId);
    if (!call) return;

    call.activeUsers.add(userId);
    userBusy.add(userId);

    emitToUser(io, userId, "group-call-accepted", {
      roomId,
      type: call.type,
    });
  });

  /* ================= REJECT ================= */

  socket.on("reject-group-call", ({ roomId, userId }) => {
    console.log("❌ reject-group-call", { roomId, userId });

    emitToUser(io, userId, "group-call-rejected", { roomId });
  });

  /* ================= JOIN ================= */

  socket.on("join-group-call", ({ roomId, userId }) => {
    console.log("📞 join-group-call", { roomId, userId });

    socket.userId = userId;
    socket.join(roomId);

    if (!groupCallRooms.has(roomId)) {
      groupCallRooms.set(roomId, new Set());
    }

    const users = groupCallRooms.get(roomId);
    if (users.has(userId)) return;

    const existingUsers = Array.from(users);
    users.add(userId);

    socket.to(roomId).emit("group-user-joined", { userId });

    socket.emit("group-existing-users", {
      users: existingUsers,
    });
  });

  /* ================= SIGNALING ================= */

  socket.on("group-offer", ({ toUserId, offer, fromUserId }) => {
    emitToUser(io, toUserId, "group-offer", { offer, fromUserId });
  });

  socket.on("group-answer", ({ toUserId, answer, fromUserId }) => {
    emitToUser(io, toUserId, "group-answer", { answer, fromUserId });
  });

  socket.on("group-ice-candidate", ({ toUserId, candidate, fromUserId }) => {
    emitToUser(io, toUserId, "group-ice-candidate", {
      candidate,
      fromUserId,
    });
  });

  /* ================= END CALL ================= */

  socket.on("end-group-call", ({ roomId, userId }) => {
    console.log("🛑 end-group-call", { roomId, userId });

    const call = activeGroupCalls.get(roomId);
    if (!call) return;

    call.activeUsers.forEach((uid) => userBusy.delete(uid));

    socket.to(roomId).emit("group-call-ended", {
      endedBy: userId,
    });

    activeGroupCalls.delete(roomId);
    groupCallRooms.delete(roomId);
  });

  /* ================= LEAVE ================= */

  socket.on("leave-group-call", ({ roomId, userId }) => {
    console.log("🚪 leave-group-call", { roomId, userId });

    userBusy.delete(userId);
    socket.leave(roomId);

    const users = groupCallRooms.get(roomId);
    if (!users) return;

    users.delete(userId);
    socket.to(roomId).emit("group-user-left", { userId });

    if (users.size === 0) {
      groupCallRooms.delete(roomId);
      activeGroupCalls.delete(roomId);
    }
  });

  /* ================= DISCONNECT ================= */

  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (!userId) return;

    userBusy.delete(userId);

    for (const [roomId, users] of groupCallRooms.entries()) {
      if (users.has(userId)) {
        users.delete(userId);
        socket.to(roomId).emit("group-user-left", { userId });

        if (users.size === 0) {
          groupCallRooms.delete(roomId);
          activeGroupCalls.delete(roomId);
        }
      }
    }
  });
};

export default groupCalling;
