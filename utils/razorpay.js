// utils/razorpay.js
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: "YOUR_RAZORPAY_KEY_ID",
  key_secret: "YOUR_RAZORPAY_SECRET",
});

export default razorpay;
