const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");

const VALID_CATEGORIES = ["Garbage", "Road", "Street Light", "Water", "Electricity", "Other"];
const VALID_STATUSES = ["Pending", "In Progress", "Resolved"];
const ALLOWED_STATUS_TRANSITIONS = {
  Pending: ["In Progress", "Resolved"],
  "In Progress": ["Resolved"],
  Resolved: ["In Progress"],
};
const MAX_REOPEN_COUNT = 1; // Allow reopening from Resolved to In Progress only once

const ensureCitizen = (req, res) => {
  if (!req.user || req.user.role !== "citizen") {
    res.status(403).json({
      success: false,
      message: "Only citizen accounts can upvote complaints",
    });
    return false;
  }
  return true;
};

// Input validation helper
const validateComplaintInput = (data) => {
  const errors = [];
  const { title, description, location, category, locationLat, locationLng, images } = data;
  
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a valid string');
  }
  
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a valid string');
  }

  if (!location || typeof location !== 'string' || location.trim().length < 3) {
    errors.push('Location is required and must be at least 3 characters long');
  }
  
  if (!category || !VALID_CATEGORIES.includes(category)) {
    errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }

  if (!Array.isArray(images) || images.length === 0) {
    errors.push('At least one complaint image is required');
  } else {
    if (images.length > 3) {
      errors.push('You can upload up to 3 images per complaint');
    }

    const invalidImage = images.find((img) => typeof img !== 'string' || !img.startsWith('data:image/'));
    if (invalidImage) {
      errors.push('Images must be valid image files');
    }
  }

  const hasLat = locationLat !== undefined && locationLat !== null && locationLat !== "";
  const hasLng = locationLng !== undefined && locationLng !== null && locationLng !== "";
  if (hasLat !== hasLng) {
    errors.push('Both latitude and longitude are required when sharing exact location');
  }

  if (hasLat && hasLng) {
    const lat = Number(locationLat);
    const lng = Number(locationLng);

    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }

    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
  }
  
  return errors;
};

/**
 * Get public complaints feed (sanitized fields only)
 */
const getPublicComplaints = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find({}, {
      title: 1,
      description: 1,
      location: 1,
      locationLat: 1,
      locationLng: 1,
      images: 1,
      category: 1,
      status: 1,
      upvotes: 1,
      comments: 1,
      createdAt: 1,
    })
      .populate('comments.user', 'name')
      .sort({ upvotes: -1, createdAt: -1 })
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
    console.error('Get public complaints error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch public complaints",
    });
  }
};

/**
 * Create a new complaint (Citizen)
 */
const createComplaint = async (req, res) => {
  try {
    const { title, description, location, category, locationLat, locationLng, images } = req.body;
    
    // Validate input
    const errors = validateComplaintInput({ title, description, location, category, locationLat, locationLng, images });
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
      location: location.trim(),
      locationLat: locationLat !== undefined && locationLat !== null && locationLat !== "" ? Number(locationLat) : null,
      locationLng: locationLng !== undefined && locationLng !== null && locationLng !== "" ? Number(locationLng) : null,
      images,
      category,
      createdBy: req.user.id,
    });

    if (req.io) {
      req.io.emit('newComplaint', complaint);
    }

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
 * Upvote a complaint (Citizen)
 */
const upvoteComplaint = async (req, res) => {
  try {
    if (!ensureCitizen(req, res)) {
      return;
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }

    const complaint = await Complaint.findById(id, { _id: 1, upvotes: 1, upvotedBy: 1 });
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    const userId = req.user.id;
    const voterIds = Array.isArray(complaint.upvotedBy) ? complaint.upvotedBy : [];
    const hasUpvoted = voterIds.some((voterId) => voterId.toString() === userId);
    if (hasUpvoted) {
      return res.status(400).json({
        success: false,
        message: "You have already upvoted this complaint",
      });
    }

    // Use an atomic update to avoid validating unrelated legacy fields.
    const updatedComplaint = await Complaint.findOneAndUpdate(
      { _id: id, upvotedBy: { $ne: userId } },
      {
        $addToSet: { upvotedBy: userId },
        $inc: { upvotes: 1 },
      },
      {
        new: true,
        projection: { _id: 1, upvotes: 1 },
      }
    );

    if (!updatedComplaint) {
      return res.status(400).json({
        success: false,
        message: "You have already upvoted this complaint",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint upvoted successfully",
      complaintId: updatedComplaint._id,
      upvotes: updatedComplaint.upvotes,
    });
  } catch (error) {
    console.error("Upvote complaint error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upvote complaint",
    });
  }
};

/**
 * Get complaint IDs upvoted by logged-in citizen
 */
const getMyUpvotedComplaintIds = async (req, res) => {
  try {
    if (!ensureCitizen(req, res)) {
      return;
    }

    const userId = req.user.id;
    const complaints = await Complaint.find({ upvotedBy: userId }, { _id: 1 }).lean();

    return res.status(200).json({
      success: true,
      complaintIds: complaints.map((item) => item._id.toString()),
    });
  } catch (error) {
    console.error("Get user upvotes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upvoted complaints",
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
      .populate('comments.user', 'name email')
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
    const { status, reason } = req.body;
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint ID",
      });
    }
    
    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found",
      });
    }

    if (complaint.status === status) {
      return res.status(400).json({
        success: false,
        message: `Complaint is already in ${status} status`,
      });
    }

    const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[complaint.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${complaint.status} to ${status}`,
      });
    }

    const isReopenFlow = complaint.status === "Resolved" && status === "In Progress";
    
    // Check reopen limit
    if (isReopenFlow && complaint.reopenCount >= MAX_REOPEN_COUNT) {
      return res.status(400).json({
        success: false,
        message: `Complaint can only be reopened once. This complaint has already been reopened.`,
      });
    }
    
    if (isReopenFlow && (!reason || typeof reason !== 'string' || reason.trim().length < 5)) {
      return res.status(400).json({
        success: false,
        message: "Reopening a resolved complaint requires a reason of at least 5 characters",
      });
    }

    complaint.statusHistory.push({
      fromStatus: complaint.status,
      toStatus: status,
      changedBy: req.user.id,
      reason: typeof reason === 'string' ? reason.trim() : '',
    });

    complaint.status = status;
    
    // Increment reopen count if reopening from Resolved
    if (isReopenFlow) {
      complaint.reopenCount += 1;
    }
    
    await complaint.save();
    
    // Populate createdBy so the frontend has details for the notification
    await complaint.populate('createdBy', 'name email');

    if (req.io) {
      req.io.emit('statusUpdate', complaint);
    }

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

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint ID" });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    const newComment = {
      user: req.user.id,
      text: text.trim().slice(0, 1000)
    };

    complaint.comments.push(newComment);
    await complaint.save();

    await complaint.populate('comments.user', 'name');

    const addedComment = complaint.comments[complaint.comments.length - 1];

    if (req.io) {
      req.io.emit('newComment', { complaintId: complaint._id, comment: addedComment });
    }

    res.status(201).json({
      success: true,
      message: "Comment added",
      comment: addedComment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

module.exports = {
  createComplaint,
  getPublicComplaints,
  upvoteComplaint,
  getMyUpvotedComplaintIds,
  getAllComplaints,
  getComplaintsByUser,
  updateComplaintStatus,
  addComment
};