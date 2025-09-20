const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferController");
const { protect } = require("../middleware/authMiddleware"); // JWT auth
const factoryAuth = require("../middleware/factoryAuth");

//Create Transfer
router.post("/", protect, factoryAuth, transferController.createTransfer);
//Get Borrowed Machine
router.get(
  "/machine/borrowed/:factoryId",
  transferController.getBorrowedMachines
);
//Return Machine
router.post(
  "/machine/return",
  protect,
  transferController.returnToOriginFactory
);
//Get All Transfers
router.get("/", transferController.getTransfers);
//Get Machine History
router.get("/machine/history", transferController.getMachineHistory);
//Get Machine Summary
router.get(
  "/reports/origin-factory-summary",
  transferController.getOriginFactorySummary
);
module.exports = router;
