import express from "express";
import Campaign from "../models/Campaign.js";
import Donation from "../models/donation.js";
import twilio from "twilio";
import mongoose from "mongoose";

const router = express.Router();

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE;

let client = null;

if (accountSid && authToken && twilioPhone) {
  client = twilio(accountSid, authToken);
} else {
  console.warn("⚠️ Twilio credentials not found. SMS sending disabled.");
}

// ✅ 1. POST /api/donations/donate
router.post("/donate", async (req, res) => {
  const { campaignId, amount, name, phone, email, razorpay_payment_id } = req.body;

  if (!campaignId || !amount || !name || !phone) {
    return res.status(400).json({ message: "All required fields must be provided." });
  }

  try {
    // Validate campaignId
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID." });
    }

    // Find campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    // Save donation
    const donation = new Donation({
      campaign: campaign._id,
      name,
      amount,
      phone,
      email,
      razorpay_payment_id,
    });
    await donation.save();

    // Update campaign totalAmount or raised
    campaign.totalAmount = (campaign.totalAmount || 0) + Number(amount);
    await campaign.save();

    // Send SMS if Twilio is configured
    if (client) {
      const message = `🙏 Thank you ${name} for your generous donation of ₹${amount} to "${campaign.title}". Your support means the world! - Team Seva`;

      // await client.messages.create({
      //   body: message,
      //   from: twilioPhone,
      //   to: `+91${phone}`,
      // });
    }

    res.status(200).json({ message: "Donation successful and recorded." });
  } catch (err) {
    console.error("❌ Donation error:", err.message || err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// ✅ 2. GET /api/donations/total/:campaignId
router.get("/total/:campaignId", async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID." });
    }

    const result = await Donation.aggregate([
      { $match: { campaign: new mongoose.Types.ObjectId(campaignId) } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const total = result[0]?.total || 0;
    res.status(200).json({ total });
  } catch (error) {
    console.error("❌ Error fetching total donations:", error.message || error);
    res.status(500).json({ message: "Failed to fetch total donations." });
  }
});

// ✅ 3. GET /api/donations (for testing/debug)
router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 }).limit(50);
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donations." });
  }
});

export default router;
