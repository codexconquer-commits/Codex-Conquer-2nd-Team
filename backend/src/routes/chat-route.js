import express from "express";
import authMiddleware from "../middlewares/auth-middleware.js";
import {
  accessChat,
  getMyChats,
} from "../controllers/chat-controller.js";

const router = express.Router();

router.post("/", authMiddleware, accessChat);
router.get("/", authMiddleware, getMyChats);

export default router;
