const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferController");
const { protect } = require("../middleware/authMiddleware"); // JWT auth
const factoryAuth = require("../middleware/factoryAuth");

//Create Transfer
router.post("/", protect, factoryAuth, transferController.createTransfer);
//Transfer Receive
router.post("/:id/receive", protect, transferController.receiveTransfer);
//Get Borrowed Machine
router.get(
  "/machine/borrowed/:factoryId",
  protect,
  transferController.getBorrowedMachines
);
//Return Machine
router.post(
  "/machine/return/initiate",
  protect,
  factoryAuth,
  transferController.returnToOriginFactory
);
// GET /api/transfers/machine/pending-receive
router.get(
  "/machine/pending-receive",
  protect,
  transferController.getPendingReceiveMachines
);

//Return Receive
router.post(
  "/machine/return/receive",
  protect,
  transferController.receiveReturn
);
//Get All Transfers
router.get("/", protect, transferController.getTransfers);
//Get Machine History
router.get("/machine/history", transferController.getMachineHistory);
//Get Machine Summary
router.get(
  "/reports/origin-factory-summary",
  protect,
  transferController.getOriginFactorySummary
);
module.exports = router;
