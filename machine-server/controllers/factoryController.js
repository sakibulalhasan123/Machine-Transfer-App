const Factory = require("../models/Factory.js");
const Notification = require("../models/Notification.js");
// Add new factory
const addFactory = async (req, res) => {
  try {
    const { factoryName, factoryLocation } = req.body;

    if (!factoryName || !factoryLocation) {
      return res
        .status(400)
        .json({ message: "Factory name and Factory location are required" });
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
      createdBy: req.user._id,
    });
    await newFactory.save();

    // ✅ Create notification
    const io = req.app.get("io");
    const notification = await Notification.create({
      message: `🏭 New factory added: ${newFactory.factoryName}`,
      createdBy: req.user._id,
    });

    // ✅ Emit to all connected clients
    if (io) io.emit("factoryAdded", notification);
    //Close live notification

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
// Get all factories
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
