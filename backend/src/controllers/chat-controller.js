import Chat from "../models/chat-model.js";

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

let chat = await Chat.findOne({
  isGroupChat: false,
  members: { $all: [req.user._id, userId] },
})
.populate("members", "-password");

  if (!chat) {
   chat = await Chat.create({
  members: [req.user._id, userId],
  isGroupChat: false,
});
  }

  res.status(200).json(chat);
};

import Message from "../models/message-model.js";

export const getMyChats = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const userId = req.user._id;

    // 🔥 DM + Group chats
    const chats = await Chat.find({
      members: userId,
    })
      .populate("members", "-password")
      .populate({
        path: "lastMessage",
        populate: {
          path: "senderId",
          select: "fullName email",
        },
      })
      .sort({ updatedAt: -1 });

    // 🔵 add unread count (seen=false)
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          senderId: { $ne: userId },
          seen: false,
        });

        return {
          ...chat.toObject(),
          unreadCount,
        };
      })
    );

    console.log("getMyChats success:", chatsWithUnread);

    res.status(200).json(chatsWithUnread);
  } catch (error) {
    console.error("getMyChats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

