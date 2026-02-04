const express = require("express");
const {
  createComplaint,
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
