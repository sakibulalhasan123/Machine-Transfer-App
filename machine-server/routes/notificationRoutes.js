const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const notifCtrl = require("../controllers/notificationController");
// Notification Routes
router.post("/", protect, notifCtrl.createAndEmitNotification);
router.get("/", notifCtrl.getNotifications);
router.patch("/seen/:id", protect, notifCtrl.markAsSeen);
router.patch("/seen-all", protect, notifCtrl.markAllSeen);

module.exports = router;
