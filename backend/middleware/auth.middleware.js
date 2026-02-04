const jwt = require("jsonwebtoken");

/**
 * Verify JWT Token Middleware
 */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing or invalid" });
    }

    const token = authHeader.split(" ")[1];
    
    // Validate JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: "Server configuration error" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    } else if (error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Token not active" });
    } else {
      return res.status(500).json({ message: "Internal server error during token verification" });
    }
  }
};

/**
 * Admin Role Middleware
 */
const isAdmin = (req, res, next) => {
  try {
    // Check if req.user exists (should be set by verifyToken middleware)
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    console.error('Admin role check error:', error.message);
    return res.status(500).json({ message: "Server error during admin check" });
  }
};

// Aliases for backward compatibility
const protect = verifyToken;
const adminOnly = isAdmin;

module.exports = {
  verifyToken,
  isAdmin,
  protect,
  adminOnly
};