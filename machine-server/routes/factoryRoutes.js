const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addFactory,
  getFactories,
  getFactoryById,
  updateFactory,
  updateFactoryStatus,
  deleteFactory,
} = require("../controllers/factoryController");
const transferController = require("../controllers/transferController");
// ==========================
// Factory Routes
// ==========================

// ➤ Route to add a new factory
// POST request to /api/factories/add
// Calls the addFactory controller function
router.post("/", protect, addFactory); // only authenticated users can add

// ➤ Route to get all factories
// GET request to /api/factories
// Calls the getFactories controller function
router.get("/", protect, getFactories);

router.get("/factory/:id", protect, getFactoryById);
router.put("/factory/:id/status", protect, updateFactoryStatus);
router.put("/factory/:id", protect, updateFactory);
router.delete("/factory/:id", protect, deleteFactory); // Soft delete

// GET machines by factory
router.get(
  "/:factoryId/machines",
  protect,
  transferController.getMachinesByFactory
);
// Export the router so it can be used in app.js
module.exports = router;
