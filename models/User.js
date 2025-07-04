import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      minlength: 3,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // basic email validation
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: /^[6-9]\d{9}$/, // Indian phone format
    },
    password: {
      type: String,
      minlength: 6,
    },
    otp: String,
    otpExpiry: Date,
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    bio: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
