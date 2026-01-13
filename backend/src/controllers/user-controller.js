import mongoose from "mongoose";
import userModel from "../models/user-model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "email-validator";

import { SendEmail } from "../config/email-verification.js";


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


export const profileUser = async (req, res) => {
  try {
    const user = req.user;
    
    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        contact: user.contact
      }
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


// 📌 SendOtp User
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Save OTP + Expiry
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    // ✅ Send OTP via Email
    await SendEmail(
      email,
      "Your OTP Code",
      `${otp}.  It will expire in 5 minutes.`,
    );

    return res.status(200).json({
      status: "success",
      message: "OTP sent successfully",
      expiry,
      info: "Check your email for the OTP. It is valid for 5 minutes."
    });
  } catch (error) {
    console.error("❌ OTP HAS NOT BEEN GENERATED:", error.message);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
};


// 📌 ResetPassword User
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newpassword } = req.body;

    // 1. Validate fields
    if (!email || !otp || !newpassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Check OTP validity
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 4. Check OTP expiry
    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // 5. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, salt);

    // 6. Update password & clear OTP
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("PASSWORD NOT UPDATED:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

