const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    locationLat: {
      type: Number,
      default: null,
      min: -90,
      max: 90,
    },

    locationLng: {
      type: Number,
      default: null,
      min: -180,
      max: 180,
    },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      required: true,
      enum: ["Garbage", "Road", "Street Light", "Water", "Electricity", "Other"],
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved"],
      default: "Pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    statusHistory: [
      {
        fromStatus: {
          type: String,
          enum: ["Pending", "In Progress", "Resolved"],
          required: true,
        },
        toStatus: {
          type: String,
          enum: ["Pending", "In Progress", "Resolved"],
          required: true,
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reason: {
          type: String,
          trim: true,
          default: "",
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reopenCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    upvotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: 1000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    upvotedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  }
);

complaintSchema.index({ upvotes: -1, createdAt: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);