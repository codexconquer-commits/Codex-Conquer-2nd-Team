import Chat from "../models/chat-model.js";

export const accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "UserId required" });
  }

  let chat = await Chat.findOne({
    members: { $all: [req.user._id, userId] },
  }).populate("members", "-password");

  if (!chat) {
    chat = await Chat.create({
      members: [req.user._id, userId],
    });
  }

  res.status(200).json(chat);
};

export const getMyChats = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized user" });
  }

  const chats = await Chat.find({
    members: req.user._id,
  })
    .populate("members", "-password")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.status(200).json(chats);
};

export const createGroupChat = async (req, res) => {
  const { name, users } = req.body;

  if (!name || !users || users.length < 2) {
    return res.status(400).json({
      message: "Group name & minimum 2 users required",
    });
  }

  // 🔥 Remove duplicates + ensure admin included once
  const uniqueUsers = [
    ...new Set([...users.map(id => id.toString()), req.user._id.toString()])
  ];

  const group = await Chat.create({
    groupName: name,
    members: uniqueUsers,
    isGroupChat: true,
    groupAdmin: req.user._id,
  });

  const fullGroup = await Chat.findById(group._id)
    .populate("members", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullGroup);
};
