import express from "express";
import authMiddleware from "../middlewares/auth-middleware.js";
import {
  sendMessage,
  getMessages,
} from "../controllers/message-controller.js";

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.get("/:chatId", authMiddleware, getMessages);

export default router;
