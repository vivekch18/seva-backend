import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID from token payload to req.user
    req.user = { id: decoded.userId };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
