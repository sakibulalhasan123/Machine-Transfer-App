const Factory = require("../models/Factory.js");

// @desc    Add new factory
// @route   POST /api/factories
// @access  Private (Logged-in users only)
const addFactory = async (req, res) => {
  try {
    const { factoryName, factoryLocation } = req.body;

    if (!factoryName || !factoryLocation) {
      return res
        .status(400)
        .json({ message: "Factory name and location are required" });
    }

    // ✅ Check duplicate by name (case-insensitive)
    const existingFactory = await Factory.findOne({
      factoryName: { $regex: new RegExp("^" + factoryName + "$", "i") },
    });

    if (existingFactory) {
      return res
        .status(400)
        .json({ message: "❌ Factory with this name already exists" });
    }
    const newFactory = new Factory({
      factoryName,
      factoryLocation,
      createdBy: req.user._id, // logged-in user ID
    });
    await newFactory.save();

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
      message: "❌ Server error",
      error: error.message,
    });
  }
};

// Update factory by ID
const updateFactory = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedFactory = await Factory.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true } // নতুন ডেটা রিটার্ন করবে
    );

    if (!updatedFactory) {
      return res.status(404).json({ message: "Factory not found" });
    }

    res.json(updatedFactory);
  } catch (err) {
    console.error("Error updating factory:", err);
    res.status(500).json({ message: err.message });
  }
};
// @desc    Get all factories
// @route   GET /api/factories
// @access  Public
const getFactories = async (req, res) => {
  try {
    const factories = await Factory.find()
      .populate("createdBy", "name role") // populate name + role
      .sort({ createdAt: -1 }); // newest first

    res.json(factories);
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};

module.exports = {
  addFactory,
  getFactories,
  updateFactory,
};
