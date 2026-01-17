import express from "express";
import authMiddleware from "../middlewares/auth-middleware.js";
import {
  accessChat,
  getMyChats,
  createGroupChat
} from "../controllers/chat-controller.js";

const router = express.Router();


router.post("/", authMiddleware, accessChat);       // 1-to-1
router.post("/group", authMiddleware, createGroupChat); // GROUP
router.get("/", authMiddleware, getMyChats);
export default router;
