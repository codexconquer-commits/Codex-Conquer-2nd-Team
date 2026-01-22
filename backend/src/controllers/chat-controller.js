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

export const getMyChats = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized user" });
  }

  const chats = await// DM only
Chat.find({
  members: req.user._id,
  isGroupChat: false,
})

// Group only
Chat.find({
  members: req.user._id,
  isGroupChat: true,
})
    .populate("members", "-password")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.status(200).json(chats);
};

