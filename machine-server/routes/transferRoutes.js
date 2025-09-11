const express = require("express");
const router = express.Router();
const transferController = require("../controllers/transferController");
const { protect } = require("../middleware/auth"); // JWT auth
router.post("/transfers", protect, transferController.createTransfer);
router.get("/transfers", transferController.getTransfers);
// GET transfer history
router.get("/transfer-history", transferController.getTransferHistory);

module.exports = router;
