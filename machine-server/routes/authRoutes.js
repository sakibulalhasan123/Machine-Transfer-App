// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  const { name, email, password, role, factoryId } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role, factoryId });
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        factoryId: user.factoryId, // return factory info
      },
    });
  } catch (err) {
    console.error("❌ Register Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        factoryId: user.factoryId, // return factory info
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🔹 Get All Users
router.get("/users", protect, allowRoles("superadmin"), async (req, res) => {
  try {
    const users = await User.find({}, "name email role createdAt"); // only return safe fields
    res.json({ users });
  } catch (err) {
    console.error("❌ Fetch Users Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
