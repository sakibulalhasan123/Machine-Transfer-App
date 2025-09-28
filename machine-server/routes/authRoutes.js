// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/authMiddleware");
const { updatePassword } = require("../controllers/userController");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, role = "user", factoryId } = req.body;
    // Normalize inputs
    email = email?.trim().toLowerCase();
    role = role?.toLowerCase();
    // 1️⃣ Mandatory fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }
    //  2️⃣ Business rule: factory required for admin/user
    if (role === "superadmin" && factoryId) {
      return res
        .status(400)
        .json({ message: "Superadmin should not have a factory" });
    }
    if (role !== "superadmin" && !factoryId) {
      return res
        .status(400)
        .json({ message: "Factory is required for admin and user roles" });
    }

    // 3️⃣ Duplicate check
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }
    // 4️⃣ Build user data dynamically
    const userData = { name: name.trim(), email, password, role };
    if (role !== "superadmin" && factoryId) {
      userData.factoryId = factoryId; // only assign if needed
    }

    const user = await User.create(userData);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        factoryId: user.factoryId || null, // return factory info
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
      { id: user._id, role: user.role, factoryId: user.factoryId },
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
    const users = await User.find()
      .populate("factoryId", "factoryName factoryLocation")
      .select("name email role factoryId createdAt");
    res.json({ users });
  } catch (err) {
    console.error("❌ Fetch Users Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-password", protect, updatePassword);

module.exports = router;
