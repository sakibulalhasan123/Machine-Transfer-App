const express = require("express");
const router = express.Router();
const factoryAuth = require("../middleware/factoryAuth");
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
router.post("/", protect, factoryAuth, createMaintenance);

// 🔹 GET all maintenances (with optional filters)
router.get("/", protect, getMaintenances);

// Update Maintenace status
router.patch("/:maintenanceId/status", protect, updateMaintenanceStatus);
module.exports = router;
