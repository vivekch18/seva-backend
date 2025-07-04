import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Donor name is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Donation amount is required"],
      min: [1, "Donation amount must be at least ₹1"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
    },
    razorpay_payment_id: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Donation = mongoose.models.Donation || mongoose.model("Donation", donationSchema);
export default Donation;
