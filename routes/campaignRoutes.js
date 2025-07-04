import express from "express";
import multer from "multer";
import Campaign from "../models/Campaign.js";
import Donation from "../models/donation.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { storage } from "../utils/cloudinary.js";

const router = express.Router();
const uploads = multer({ storage });

// ----------------------
// Create Campaign
// ----------------------
router.post(
  "/",
  verifyToken,
  uploads.fields([
    { name: "image", maxCount: 1 },
    { name: "documents", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        goal,
        organizer,
        beneficiaryName,
        medicalCondition,
        email,
        phone,
        story,
      } = req.body;

      if (
        !title || !description || !goal || !organizer ||
        !beneficiaryName || !medicalCondition || !email || !phone || !story
      ) {
        return res.status(400).json({ error: "Please fill in all required fields." });
      }

      const goalNum = Number(goal);
      if (isNaN(goalNum) || goalNum <= 0) {
        return res.status(400).json({ error: "Goal must be a positive number." });
      }

      const image = req.files["image"]?.[0]?.path || null;
      const documents = req.files["documents"]?.map(file => file.path) || [];

      const campaign = new Campaign({
        title,
        description,
        goal: goalNum,
        organizer,
        beneficiaryName,
        medicalCondition,
        email,
        phone,
        story,
        image,
        documents,
        createdBy: req.user.id,
      });

      await campaign.save();
      res.status(201).json(campaign);
    } catch (err) {
      console.error("❌ Error creating campaign:", err);
      res.status(500).json({ error: "Server error. Please try again." });
    }
  }
);

// ----------------------
// Get All Campaigns
// ----------------------
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    const campaignIds = campaigns.map(c => c._id);

    const totalDonations = await Donation.find({ campaign: { $in: campaignIds } });

    const donationSumMap = {};
    totalDonations.forEach(donation => {
      const id = donation.campaign.toString();
      donationSumMap[id] = (donationSumMap[id] || 0) + donation.amount;
    });

    const campaignsWithAmount = campaigns.map(c => ({
      ...c.toObject(),
      totalAmount: donationSumMap[c._id.toString()] || 0,
    }));

    res.json(campaignsWithAmount);
  } catch (err) {
    console.error("❌ Error fetching campaigns:", err);
    res.status(500).json({ error: "Failed to fetch campaigns." });
  }
});

// ----------------------
// Get Logged-in User's Campaigns
// ----------------------
router.get("/my-campaigns", verifyToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    const campaignIds = campaigns.map(c => c._id);

    const totalDonations = await Donation.find({ campaign: { $in: campaignIds } });

    const donationSumMap = {};
    totalDonations.forEach(donation => {
      const id = donation.campaign.toString();
      donationSumMap[id] = (donationSumMap[id] || 0) + donation.amount;
    });

    const campaignsWithAmount = campaigns.map(c => ({
      ...c.toObject(),
      totalAmount: donationSumMap[c._id.toString()] || 0,
    }));

    res.json(campaignsWithAmount);
  } catch (err) {
    console.error("❌ Error fetching user campaigns:", err);
    res.status(500).json({ error: "Failed to fetch your campaigns." });
  }
});

// ----------------------
// Get Single Campaign by ID
// ----------------------
router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    const totalDonations = await Donation.find({ campaign: campaign._id });
    const totalAmount = totalDonations.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      ...campaign.toObject(),
      totalAmount,
    });
  } catch (err) {
    console.error("❌ Error fetching campaign:", err);
    res.status(500).json({ error: "Failed to fetch campaign." });
  }
});

// ----------------------
// Update Campaign by ID
// ----------------------
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    if (campaign.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to update this campaign" });
    }

    if (req.body.goal !== undefined) {
      const updatedGoal = Number(req.body.goal);
      if (isNaN(updatedGoal) || updatedGoal <= 0) {
        return res.status(400).json({ error: "Goal must be a positive number." });
      }
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updatedCampaign);
  } catch (err) {
    console.error("❌ Error updating campaign:", err);
    res.status(500).json({ error: "Failed to update campaign." });
  }
});

export default router;
