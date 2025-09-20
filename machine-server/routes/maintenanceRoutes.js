const express = require("express");
const router = express.Router();
const {
  getFactoryMachines,
  createMaintenance,
  getMaintenances,
  updateMaintenanceStatus,
} = require("../controllers/maintenanceController");
const { protect } = require("../middleware/authMiddleware"); // auth middleware

// Fetch available machines for a factory
router.get("/machines/factory/:factoryId", protect, getFactoryMachines);

// Create maintenance
router.post("/", protect, createMaintenance);

// 🔹 GET all maintenances (with optional filters)
router.get("/", getMaintenances);

// Update Maintenace status
router.patch("/:maintenanceId/status", updateMaintenanceStatus);
module.exports = router;
