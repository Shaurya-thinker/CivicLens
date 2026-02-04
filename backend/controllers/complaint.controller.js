const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");

// Input validation helper
const validateComplaintInput = (data) => {
  const errors = [];
  const { title, description, category } = data;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a valid string');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a valid string');
  }
  
  const validCategories = ["Garbage", "Road", "Street Light", "Water", "Other"];
  if (!category || !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }
  
  return errors;
};

/**
 * Create a new complaint (Citizen)
 */
const createComplaint = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    
    // Validate input
    const errors = validateComplaintInput({ title, description, category });
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const complaint = await Complaint.create({
      title: title.trim(),
      description: description.trim(),
      category,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Complaint registered successfully",
      complaint,
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to create complaint",
    });
  }
};

/**
 * Get all complaints (Admin)
 */
const getAllComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const complaints = await Complaint.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Complaint.countDocuments();

    res.status(200).json({
      success: true,
      count: complaints.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

/**
 * Get complaints of logged-in user (Citizen)
 */
const getComplaintsByUser = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      createdBy: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get user complaints error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user complaints",
    });
  }
};

/**
 * Update complaint status (Admin)
 */
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }
    
    // Validate status
    const validStatuses = ["Pending", "In Progress", "Resolved"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    complaint.status = status;
    await complaint.save();

    res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      complaint,
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update status",
    });
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getComplaintsByUser,
  updateComplaintStatus,
};