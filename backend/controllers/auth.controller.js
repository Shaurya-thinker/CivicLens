const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../utils/email");

const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_REQUIRED = process.env.REQUIRE_EMAIL_VERIFICATION === "true";

const createEmailVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  return {
    rawToken,
    hashedToken,
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS),
  };
};

const getFrontendBaseUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const buildVerificationUrl = (rawToken) => `${getFrontendBaseUrl()}/verify-email?token=${rawToken}`;

// Input validation helper
const validateInput = (data, requiredFields) => {
  const errors = [];
  
  for (const field of requiredFields) {
    // Explicit type check to prevent NoSQL injection
    if (!data[field] || typeof data[field] !== 'string' || data[field].trim() === '') {
      errors.push(`${field} is required and must be a valid string`);
    }
  }
  
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.password && data.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
};

// Additional security check for NoSQL injection prevention
const sanitizeForMongo = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Invalid input type');
  }
  return value.toString().toLowerCase().trim();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate input types and content
    const errors = validateInput({ name, email, password }, ['name', 'email', 'password']);
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    // Validate role parameter
    const validRoles = ['citizen', 'admin'];
    if (role && (typeof role !== 'string' || !validRoles.includes(role.toLowerCase()))) {
      return res.status(400).json({ message: 'Invalid role value' });
    }
    
    // Sanitize all inputs with additional type safety
    const sanitizedName = sanitizeForMongo(name);
    const sanitizedEmail = sanitizeForMongo(email);
    const sanitizedRole = role ? role.toLowerCase() : 'citizen';
    
    // Check if user exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    const verification = createEmailVerificationToken();
    
    const user = new User({ 
      name: sanitizedName, 
      email: sanitizedEmail, 
      password: hashedPassword, 
      role: sanitizedRole,
      emailVerificationToken: verification.hashedToken,
      emailVerificationExpires: verification.expiresAt,
      isEmailVerified: false,
    });
    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: buildVerificationUrl(verification.rawToken),
      });
    } catch (emailError) {
      console.error("Verification email send failed:", emailError.message);
      return res.status(500).json({
        message: "Registration succeeded but verification email could not be sent. Please try resending verification email.",
      });
    }

    res.status(201).json({
      message: EMAIL_VERIFICATION_REQUIRED
        ? "Registration successful. Please verify your email before logging in."
        : "Registration successful. You can now log in.",
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Server error" });
  }
};

// Generic login helper function
const performLogin = async (email, password, requireRole = null) => {
  // Explicit type check to prevent NoSQL injection
  if (typeof email !== 'string' || typeof password !== 'string') {
    throw { status: 400, message: 'Invalid input types' };
  }
  
  // Validate input types and content
  const errors = validateInput({ email, password }, ['email', 'password']);
  if (errors.length > 0) {
    throw { status: 400, message: 'Validation failed', errors };
  }
  
  // Validate JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    throw { status: 500, message: "Server configuration error" };
  }
  
  // Sanitize email only (password must remain unchanged for bcrypt comparison)
  const sanitizedEmail = email.toString().toLowerCase().trim();
  
  const user = await User.findOne({ email: sanitizedEmail });
  if (!user) {
    throw { status: 400, message: "Invalid credentials" };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw { status: 400, message: "Invalid credentials" };
  }

  if (EMAIL_VERIFICATION_REQUIRED && !user.isEmailVerified) {
    throw {
      status: 403,
      message: "Please verify your email address before logging in.",
      code: "EMAIL_NOT_VERIFIED",
    };
  }

  // Role validation if specified
  if (requireRole && user.role !== requireRole) {
    const roleMessage = requireRole === 'admin' 
      ? 'Admin access required. Please use admin login.' 
      : 'Citizen account required. Please use citizen login.';
    throw { status: 403, message: roleMessage };
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await performLogin(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// Citizen-specific login
exports.citizenLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await performLogin(email, password, 'citizen');
    res.json(result);
  } catch (error) {
    console.error('Citizen login error:', error);
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

// Admin-specific login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await performLogin(email, password, 'admin');
    res.json(result);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(error.status || 500).json({ message: error.message || "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Verification link is invalid or expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const sanitizedEmail = email.toString().toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const verification = createEmailVerificationToken();
    user.emailVerificationToken = verification.hashedToken;
    user.emailVerificationExpires = verification.expiresAt;
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: buildVerificationUrl(verification.rawToken),
    });

    return res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Resend verification email error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getVerificationStatus = async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "development") {
      return res.status(403).json({ message: "This endpoint is available only in development" });
    }

    const { email } = req.query;
    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email query parameter is required" });
    }

    const sanitizedEmail = email.toString().toLowerCase().trim();
    const user = await User.findOne({ email: sanitizedEmail }).select(
      "email isEmailVerified emailVerificationExpires createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      hasPendingVerificationToken: Boolean(user.emailVerificationExpires),
      emailVerificationExpires: user.emailVerificationExpires,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};