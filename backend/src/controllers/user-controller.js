import mongoose from "mongoose";
import userModel from "../models/user-model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password,contact } = req.body;

    const alreadyExistUser = await userModel.findOne({ email: email });

    if (alreadyExistUser) {
      return res.status(400).json({
        message: "User Already Exist",
      });
    }
    const HashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      fullName,
      email,
      password: HashedPassword,
      contact,

    });

    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET
    );
    res.cookie("token", token, { httpOnly: true });

    res.status(201).json({
      message: "User Registered Successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.fullName,
        email: newUser.email,
        
        contact: newUser.contact
      },
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(req.body);
    console.log(`hit this api`);

    const existingUser = await userModel.findOne({ email: email });

    if (!existingUser) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.JWT_SECRET
    );
    res.cookie("token", token);
    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: existingUser._id,
        userName: existingUser.fullName,
        email: existingUser.email,
      },
    });
  } catch (error) {
    console.log(error.message);
  }
};

export const logOutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      message: "Logout Successful",
    });
  } catch (error) {}
};

export const getAllUsers = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const users = await userModel.find({
    _id: { $ne: req.user._id },
  }).select("-password");

  res.status(200).json(users);
};
