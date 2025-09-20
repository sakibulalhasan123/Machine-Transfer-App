const express = require("express");
const router = express.Router(); // Create a new router instance
const { protect } = require("../middleware/authMiddleware"); // JWT auth
// Import controller functions for factories
const {
  addFactory,
  updateFactory,
  getFactories,
} = require("../controllers/factoryController");
const transferController = require("../controllers/transferController");
// ==========================
// Factory Routes
// ==========================

// ➤ Route to add a new factory
// POST request to /api/factories/add
// Calls the addFactory controller function
router.post("/add", protect, addFactory); // only authenticated users can add

// ➤ Route to get all factories
// GET request to /api/factories
// Calls the getFactories controller function
router.get("/", getFactories);

// PUT /api/factories/:id/update
router.put("/:id/update", updateFactory);
// GET machines by factory
router.get("/:factoryId/machines", transferController.getMachinesByFactory);
// Export the router so it can be used in app.js
module.exports = router;
