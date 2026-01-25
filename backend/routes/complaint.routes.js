const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  updateComplaintStatus
} = require("../controllers/complaint.controller");

const { protect, adminOnly } = require("../middleware/auth.middleware");

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint
 * @access  Private (Citizen)
 */
router.post("/", protect, createComplaint);

/**
 * @route   GET /api/complaints/my
 * @desc    Get complaints created by logged-in user
 * @access  Private (Citizen)
 */
router.get("/my", protect, getMyComplaints);

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints
 * @access  Private (Admin)
 */
router.get("/", protect, adminOnly, getAllComplaints);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Admin)
 */
router.patch("/:id/status", protect, adminOnly, updateComplaintStatus);

module.exports = router;
