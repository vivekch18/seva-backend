import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Fallback: also check for existing email to avoid duplicate errors
          const existingUser = await User.findOne({ email: profile.emails[0].value });

          if (existingUser) {
            // If email exists but not linked to Google, update it
            existingUser.googleId = profile.id;
            await existingUser.save();
            user = existingUser;
          } else {
            // Create new user
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("Passport Google Strategy Error:", err);
        return done(err, null);
      }
    }
  )
);

// Serialize user for session (optional if you're using JWT)
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
