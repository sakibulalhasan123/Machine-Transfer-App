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
  getMachineById,
  updateMachineStatus,
  updateMachine,
  softDeleteMachine,
} = require("../controllers/machineController");
const { getMachineQR } = require("../controllers/machineQRController");
const {
  getMachineLiveStatus,
} = require("../controllers/machineStatusController");
const { getMachineByCode } = require("../controllers/transferController");
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
router.get("/code/:machineCode", getMachineByCode);
router.get("/code/:machineCode/live-status", getMachineLiveStatus);
router.get("/code/:machineCode/qr", getMachineQR);

// ➤ Get all machines grouped by factory
// GET /api/machines
router.get("/", protect, getMachinesByFactory);

router.get("/machine-status", getAllMachineStatus);

router.get("/:id", protect, getMachineById);
router.put("/:id/status", protect, updateMachineStatus);
router.put("/:id", protect, updateMachine);
router.delete("/:id", protect, softDeleteMachine);

// Export the router so it can be used in app.js
module.exports = router;
