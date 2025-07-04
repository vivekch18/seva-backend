// routes/paymentRoutes.js
import express from "express";
import Razorpay from "razorpay";

const router = express.Router();

// Load Razorpay credentials from environment variables
const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_SECRET;

if (!key_id || !key_secret) {
  throw new Error("❌ Razorpay credentials are missing in environment variables.");
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id,
  key_secret,
});

// POST /api/payment/create-order
router.post("/create-order", async (req, res) => {
  const { amount, currency = "INR" } = req.body;

  if (!amount || isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ message: "Invalid donation amount provided." });
  }

  const options = {
    amount: Number(amount) * 100, // Convert to paisa
    currency,
    receipt: `receipt_order_${Date.now()}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay order created:", order.id);
    res.status(200).json({ order });
  } catch (error) {
    console.error("❌ Razorpay order creation error:", error.message);
    res.status(500).json({
      message: "Failed to create order. Please try again.",
      error: error.message,
    });
  }
});

export default router;
