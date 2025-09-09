const express = require("express");
const router = express.Router(); // Create a new router instance
const { protect } = require("../middleware/auth"); // JWT auth
// Import controller functions for machines
const {
  addMachine,
  bulkAddMachines,
  getMachinesByFactory,
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

// ➤ Get all machines grouped by factory
// GET /api/machines
router.get("/", getMachinesByFactory);
// Export the router so it can be used in app.js
module.exports = router;
