// controllers/userController.js
const User = require("../models/User");

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user._id; // logged-in user only
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "❌ User not found" });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "❌ Old password is incorrect" });
    }

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    res.json({
      message: "✅ Password updated successfully. Please login again.",
    });
  } catch (error) {
    res.status(500).json({ message: "❌ Server error", error: error.message });
  }
};
