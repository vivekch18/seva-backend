import express from "express";
import User from "../models/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get logged-in user's profile
 * @access  Private
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -otp -otpExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("GET /api/users/profile error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update logged-in user's profile
 * @access  Private
 */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpiry");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("PUT /api/users/profile error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

export default router;
