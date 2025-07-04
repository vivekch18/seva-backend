import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import passport from "passport";
import twilio from "twilio";

import User from "../models/User.js";

dotenv.config();
const router = express.Router();

// Twilio client setup
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// ----------------------------------------
// Register New User
// ----------------------------------------
router.post("/register", async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.toLowerCase().trim();
    const phone = req.body.phone?.trim();
    const password = req.body.password;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ----------------------------------------
// Login with Phone & Password
// ----------------------------------------
router.post("/login", async (req, res) => {
  try {
    const phone = req.body.phone?.trim();
    const password = req.body.password;

    if (!phone || !password) {
      return res.status(400).json({ error: "Mobile number and password are required" });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Invalid mobile number format" });
    }

    const user = await User.findOne({ phone });

    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ----------------------------------------
// Send OTP using Twilio with 60-second delay
// ----------------------------------------
router.post("/send-otp", async (req, res) => {
  const { contact } = req.body;

  if (!/^\d{10}$/.test(contact)) {
    return res.status(400).json({ error: "Invalid mobile number format" });
  }

  try {
    const user = await User.findOne({ phone: contact });
    if (!user) return res.status(404).json({ error: "Mobile number not registered" });

    const now = new Date();
    if (user.otpExpiry && now < new Date(user.otpExpiry.getTime() - 4 * 60 * 1000)) {
      return res.status(429).json({ error: "Please wait before requesting another OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    user.otp = otp;
    user.otpExpiry = expiry;
    await user.save();

    await twilioClient.messages.create({
      body: `Your OTP for Seva login is: ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${contact}`,
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ----------------------------------------
// Verify OTP Login
// ----------------------------------------
router.post("/verify-otp", async (req, res) => {
  const { contact, otp } = req.body;

  try {
    const user = await User.findOne({
      phone: contact,
      otp,
      otpExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired OTP" });

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const { password: _, ...userWithoutPassword } = user.toObject();

    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ----------------------------------------
// Google OAuth Login
// ----------------------------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
  }
);

export default router;
