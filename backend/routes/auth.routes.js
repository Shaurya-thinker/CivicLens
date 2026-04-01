const express = require("express");
const {
	register,
	login,
	citizenLogin,
	adminLogin,
	verifyEmail,
	resendVerificationEmail,
	getVerificationStatus,
} = require("../controllers/auth.controller");

const router = express.Router();

// Authentication endpoints
router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.get("/verification-status", getVerificationStatus); // Dev-only diagnostic endpoint
router.post("/login", login); // Generic login (for backward compatibility)
router.post("/login/citizen", citizenLogin); // Citizen-specific login
router.post("/login/admin", adminLogin); // Admin-specific login

module.exports = router;