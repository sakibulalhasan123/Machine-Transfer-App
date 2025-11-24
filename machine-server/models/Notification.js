const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    // 🔹 Main notification content (required)
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // 🔹 Notification category
    type: {
      type: String,
      required: true,
      enum: [
        "factory",
        "machine",
        "transfer",
        "maintenance",
        "machineIdle",
        "user",
      ],
      index: true,
    },

    // 🔹 Who created this notification
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔹 Notification belongs to which user(s)
    // (for multi-user systems & role-based notifications)
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    // 🔹 Seen / read tracking
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// 🏎 Optimized indexes for large-scale performance
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1 });
notificationSchema.index({ seenBy: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
