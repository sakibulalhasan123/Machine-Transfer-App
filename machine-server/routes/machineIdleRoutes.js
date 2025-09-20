const express = require("express");
const router = express.Router();
const {
  getAvailableMachines,
  getInProgressIdles,
  createIdle,
  endIdle,
  getAllMachineIdles,
} = require("../controllers/machineIdleController");
const { protect } = require("../middleware/authMiddleware"); // JWT auth

// ✅ Get machines available for idle in a factory
router.get("/available/:factoryId", protect, getAvailableMachines);

// ✅ Get in-progress idles for a factory (optional)
router.get("/in-progress/:factoryId", protect, getInProgressIdles);

// ✅ Create a new idle record
router.post("/", protect, createIdle);

// ✅ End an idle (update endTime)
router.patch("/:idleId/end", protect, endIdle);

// ✅ Get all MachineIdle records (with optional filters)
router.get("/", getAllMachineIdles);

module.exports = router;
