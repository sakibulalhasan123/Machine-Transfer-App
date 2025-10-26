const express = require("express");
const router = express.Router(); // Create a new router instance
const { protect } = require("../middleware/authMiddleware"); // JWT auth
// Import controller functions for machines
const {
  addMachine,
  bulkAddMachines,
  getMachinesByFactory,
  checkDuplicates,
  getAllMachineStatus,
} = require("../controllers/machineController");

// ==========================
// 🏭 Machine Routes
// ==========================

// ➤ Route to add a single machine
// POST request to /api/machines
// Calls the addMachine controller function
router.post("/", protect, addMachine);

// ➤ Route to bulk add multiple machines
// POST request to /api/machines/bulk
// Calls the bulkAddMachines controller function
router.post("/bulk", protect, bulkAddMachines);

// Duplicate check (for Excel preview)
router.post("/check-duplicates", protect, checkDuplicates);
// ➤ Get all machines grouped by factory
// GET /api/machines
router.get("/", protect, getMachinesByFactory);

router.get("/machine-status", getAllMachineStatus);
// Export the router so it can be used in app.js
module.exports = router;
