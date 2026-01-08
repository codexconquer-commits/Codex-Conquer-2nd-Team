import http from "http";
import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { Server } from "socket.io";
import socketHandler from "./src/services/socket.js";
import { connectDb } from "./src/db/db.js";

connectDb();

const server = http.createServer(app);

// 🔥 Socket.io attach here
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

socketHandler(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server + Socket running on port ${PORT}`);
});
