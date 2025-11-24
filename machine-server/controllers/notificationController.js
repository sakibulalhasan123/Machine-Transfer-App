const Notification = require("../models/Notification");
const User = require("../models/User");
// Create + Emit helper (use inside other controllers)
const createAndEmitNotification = async (req, messageObj) => {
  // messageObj: { message, title, type, link, meta }
  const io = req.app.get("io");
  const { recipients = [], ...rest } = messageObj;
  const payload = {
    // ...messageObj,
    ...rest, // messageObj এর বাকি সব property
    createdBy: req.user._id,
    recipients, // recipients save
  };
  const saved = await Notification.create(payload);
  // populate createdBy (optional)
  const populated = await Notification.findById(saved._id).populate(
    "createdBy",
    "name role"
  );

  // if (io) io.emit("newNotification", populated); // broadcast to everyone

  // Emit only to recipients + all admins
  if (io) {
    // Fetch admins
    const admins = await User.find({ role: "superadmin" }).select("_id");
    const adminIds = admins.map((a) => a._id.toString());

    // Combine recipients + admins, remove duplicates
    const emitTo = [...new Set([...recipients.map(String), ...adminIds])];

    emitTo.forEach((userId) => {
      io.to(userId).emit("newNotification", populated);
    });
  }

  return populated;
};

// GET notifications (paged) - shows newest first; includes seen flag per current user
const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    let filter = {};

    // admin sees everything
    if (req.user.role !== "superadmin") {
      filter = { recipients: req.user._id };
    }
    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "name role"),
      Notification.countDocuments(filter),
    ]);

    // attach seen boolean for current user
    // const userId = req.user?._id?.toString();
    // const data = items.map((n) => ({
    //   ...n.toObject(),
    //   seen: userId ? n.seenBy.map(String).includes(userId) : false,
    // }));

    // সরাসরি items পাঠাও, seen boolean ছাড়াই
    const data = items.map((n) => n.toObject());
    res.json({ success: true, data, pagination: { total, page, limit } });
  } catch (err) {
    console.error("getNotifications:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// MARK single notification as seen by current user
const markAsSeen = async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user._id;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { $addToSet: { seenBy: userId } }, // add only if not exists
      { new: true }
    ).populate("createdBy", "name role");

    // emit update to clients so they can update UI in real-time
    const io = req.app.get("io");
    if (io) io.emit("notificationSeen", { notificationId: id, userId });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("markAsSeen:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// MARK all visible notifications as seen for this user
const markAllSeen = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ filter per role
    let filter = {};
    if (req.user.role !== "superadmin") {
      filter = { recipients: userId, seenBy: { $ne: userId } }; // normal user
    } else {
      filter = { seenBy: { $ne: userId } }; // admin sees all
    }

    // await Notification.updateMany(
    //   { seenBy: { $ne: userId } },
    //   { $addToSet: { seenBy: userId } }
    // );

    await Notification.updateMany(filter, { $addToSet: { seenBy: userId } });
    const io = req.app.get("io");
    if (io) io.emit("allNotificationsSeen", { userId }); // optional
    res.json({ success: true, message: "All marked as seen" });
  } catch (err) {
    console.error("markAllSeen:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = {
  createAndEmitNotification,
  getNotifications,
  markAsSeen,
  markAllSeen,
};
