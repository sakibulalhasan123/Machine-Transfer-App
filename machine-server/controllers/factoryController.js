const Factory = require("../models/Factory.js");
const Notification = require("../models/Notification.js");
const NotificationService = require("./notificationController"); // or relative path
// Add new factory
const addFactory = async (req, res) => {
  try {
    const { factoryName, factoryLocation } = req.body;

    if (!factoryName?.trim() || !factoryLocation?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Factory name and Factory location are required",
      });
    }

    // ✅ Check duplicate by name (case-insensitive)
    const existingFactory = await Factory.findOne({
      factoryName: { $regex: new RegExp("^" + factoryName + "$", "i") },
    });

    if (existingFactory) {
      return res.status(400).json({
        success: false,
        message: "❌ Factory with this name already exists",
      });
    }
    const newFactory = new Factory({
      factoryName: factoryName.trim(),
      factoryLocation: factoryLocation.trim(),
      createdBy: req.user._id,
    });
    await newFactory.save();

    // ✅ Create notification
    await NotificationService.createAndEmitNotification(req, {
      title: "New factory added",
      message: `🏭 New Factory Name: ${newFactory.factoryName} added by ${
        req.user.name || "someone"
      }`,
      type: "factory",
      createdBy: req.user._id,
    });
    res.status(201).json({
      message: "✅ Factory created successfully",
      factory: newFactory,
    });
  } catch (error) {
    console.error("🔥 Error creating factory:", error);

    // Handle duplicate key error from MongoDB
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "❌ Factory name or code already exists" });
    }
    res.status(500).json({
      success: false,
      message: "❌ Server error",
      error: error.message,
    });
  }
};
// Get all factories
const getFactories = async (req, res) => {
  try {
    const factories = await Factory.find({
      isDeleted: { $ne: true }, // deleted না হলে সব দেখাবে
    })
      .populate("createdBy", "name role") // populate name + role
      .sort({ createdAt: -1 }); // newest first

    res.json(factories);
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};
// Get Factory By ID
const getFactoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const factory = await Factory.findById(id);

    if (!factory) {
      return res.status(404).json({
        success: false,
        message: "Factory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: factory,
    });
  } catch (error) {
    console.error("Error fetching factory:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Update Factory Status (active/inactive)
const updateFactoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const factory = await Factory.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!factory) {
      return res.json({ success: false, message: "Factory not found" });
    }

    return res.json({
      success: true,
      message: "Factory status updated successfully",
      data: factory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error while updating factory status",
    });
  }
};
// Update Factory Details
const updateFactory = async (req, res) => {
  try {
    const { id } = req.params;
    const { factoryName, factoryLocation } = req.body;

    const factory = await Factory.findById(id);
    if (!factory) {
      return res
        .status(404)
        .json({ success: false, message: "Factory not found" });
    }

    // Store old values
    const oldName = factory.factoryName;
    const oldLocation = factory.factoryLocation;

    let changes = [];

    // Detect NAME change
    if (factoryName && factoryName.trim() !== oldName) {
      changes.push(`name changed from "${oldName}" to "${factoryName.trim()}"`);
      factory.factoryName = factoryName.trim();
    }

    // Detect LOCATION change
    if (factoryLocation && factoryLocation.trim() !== oldLocation) {
      changes.push(
        `location changed from "${oldLocation}" to "${factoryLocation.trim()}"`
      );
      factory.factoryLocation = factoryLocation.trim();
    }

    // If nothing changed — return
    if (changes.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No changes detected",
      });
    }

    factory.updatedBy = req.user._id;
    factory.updatedAt = Date.now();
    await factory.save();

    // Build dynamic message
    const finalMessage = `🏭 Factory ${changes.join(" & ")} by ${
      req.user.name || "someone"
    }`;

    // Send notification
    await NotificationService.createAndEmitNotification(req, {
      title: "Factory updated",
      message: finalMessage,
      type: "factory",
      createdBy: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Factory updated successfully",
      data: factory,
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Soft Delete Factory
const deleteFactory = async (req, res) => {
  try {
    const { id } = req.params;

    const factory = await Factory.findById(id);

    if (!factory || factory.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Factory not found",
      });
    }

    factory.isDeleted = true;
    factory.updatedBy = req.user._id;
    factory.updatedAt = Date.now();
    await factory.save();

    // Notification
    await NotificationService.createAndEmitNotification(req, {
      title: "factory soft-deleted",
      message: `🏭 Factory:${factory.factoryName} soft deleted by ${
        req.user.name || "someone"
      }`,
      type: "factory",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Factory soft-deleted successfully",
    });
  } catch (error) {
    console.error("Error soft-deleting factory:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  addFactory,
  getFactories,
  getFactoryById,
  updateFactoryStatus,
  updateFactory,
  deleteFactory,
};
