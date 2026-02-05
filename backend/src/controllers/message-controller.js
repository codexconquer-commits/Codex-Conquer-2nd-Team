import Message from "../models/message-model.js";
import Chat from "../models/chat-model.js";

export const sendMessage = async (req, res) => {
  const { chatId, text } = req.body;

  if (!chatId || !text) {
    return res.status(400).json({ message: "Invalid data" });
  }

  const message = await Message.create({
    chatId,
    senderId: req.user._id,
    text,
  });

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: message._id,
  });

  res.status(201).json(message);
};

export const getMessages = async (req, res) => {
  const chatId = req.params.chatId;
  const userId = req.user._id;

  // 🔥 mark messages as seen
  await Message.updateMany(
    {
      chatId,
      senderId: { $ne: userId }, // jo maine nahi bheje
      seen: false,
    },
    { $set: { seen: true } }
  );

  const messages = await Message.find({ chatId })
    .populate("senderId", "fullName");

  res.status(200).json(messages);
  console.log(messages);
};
