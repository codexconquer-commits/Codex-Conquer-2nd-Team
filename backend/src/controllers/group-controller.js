import Message from "../models/message-model.js";
import Chat from "../models/chat-model.js";
import UserModel from "../models/user-model.js";

export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Chat.find({
      isGroupChat: true,
      members: { $in: [userId] },
    })
      .populate(
        "members",
        "-password -otp -otpExpiry -__v"
      );

    // 🔥 Admin check + console
    groups.forEach((group) => {
      console.log("Group Name:", group.groupName);
      console.log("User ID:", userId.toString());
      console.log("Group Admin ID:", group.groupAdmin.toString());

      if (group.groupAdmin.toString() === userId.toString()) {
        console.log("✅ Admin Access Granted");
      } else {
        console.log("👤 Standard Member");
      }
    });

    res.status(200).json(groups);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
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

export const getAllUsers = async (req,res)=>{
  try {
    const users = await UserModel.find({_id:{$ne:req.user._id}}).select("-password -otp -otpExpiry -__v");
    res.status(200).json(users);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });

  }
}
