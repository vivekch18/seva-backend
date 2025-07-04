import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Campaign title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
    },
    goal: {
      type: Number,
      required: [true, "Fundraising goal is required"],
      min: [1, "Goal must be at least ₹1"],
    },
    organizer: {
      type: String,
      required: [true, "Organizer name is required"],
      trim: true,
    },
    beneficiaryName: {
      type: String,
      required: [true, "Beneficiary name is required"],
      trim: true,
    },
    medicalCondition: {
      type: String,
      required: [true, "Medical condition is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please provide a valid email address"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    story: {
      type: String,
      required: [true, "Campaign story is required"],
    },
    image: {
      type: String,
      default: null,
    },
    documents: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Add this field to track raised donations
    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Campaign", campaignSchema);
