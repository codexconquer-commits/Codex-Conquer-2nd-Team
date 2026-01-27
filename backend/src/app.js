import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user-route.js";
import chatRoutes from "./routes/chat-route.js";
import messageRoutes from "./routes/message-route.js";
import groupRoutes from "./routes/group-route.js";

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173","https://codex-conquer-2nd-team-2c4g.onrender.com"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

export default app;
