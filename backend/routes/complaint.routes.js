const express = require("express");
const {
  createComplaint,
  getPublicComplaints,
  upvoteComplaint,
  getMyUpvotedComplaintIds,
  getAllComplaints,
  getComplaintsByUser,
  updateComplaintStatus
} = require("../controllers/complaint.controller");
const { verifyToken, isAdmin } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint
 * @access  Private (Citizen)
 */
router.post("/", verifyToken, createComplaint);

/**
 * @route   GET /api/complaints/my
 * @desc    Get complaints created by logged-in user
 * @access  Private (Citizen)
 */
router.get("/my", verifyToken, getComplaintsByUser);

/**
 * @route   GET /api/complaints/public
 * @desc    Get public complaint feed
 * @access  Public
 */
router.get("/public", getPublicComplaints);

/**
 * @route   GET /api/complaints/upvotes/me
 * @desc    Get complaint IDs upvoted by logged-in citizen
 * @access  Private (Citizen)
 */
router.get("/upvotes/me", verifyToken, getMyUpvotedComplaintIds);

/**
 * @route   POST /api/complaints/:id/upvote
 * @desc    Upvote a complaint
 * @access  Private (Citizen)
 */
router.post("/:id/upvote", verifyToken, upvoteComplaint);

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints
 * @access  Private (Admin)
 */
router.get("/", verifyToken, isAdmin, getAllComplaints);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Admin)
 */
router.patch("/:id/status", verifyToken, isAdmin, updateComplaintStatus);

module.exports = router;
