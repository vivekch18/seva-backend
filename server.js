import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import session from "express-session";
import passport from "passport";
import { fileURLToPath } from "url";
import "./config/passport.js"; // Passport config

// Route imports
import campaignRoutes from "./routes/campaignRoutes.js";
import donationRoutes from "./routes/donationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,           //"http://localhost:5173", // fallback for local
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "seva_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Health check route
app.get("/", (req, res) => {
  res.send("Seva backend is running!");
});

// Optional: prevent favicon 404 spam
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Routes
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
