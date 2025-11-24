const MachineIdle = require("../models/MachineIdle");
const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");
const Factory = require("../models/Factory");
const NotificationService = require("./notificationController"); // or relative path
// ✅ Get machines available for idle
exports.getAvailableMachines = async (req, res) => {
  try {
    const { factoryId } = req.params;

    const allMachines = await Machine.find({ factoryId });

    const maintenanceInProgress = await Maintenance.find({
      factoryId,
      status: "Maintenance In-Progress",
    }).select("machineId");

    const maintenanceIds = maintenanceInProgress.map((m) =>
      m.machineId.toString()
    );

    const idleInProgress = await MachineIdle.find({
      factoryId,
      status: "Machine Idle In-Progress",
    }).select("machineId");

    const idleIds = idleInProgress.map((i) => i.machineId.toString());

    const availableMachines = allMachines.filter(
      (m) =>
        ["In-House", "Borrowed"].includes(m.status) && // ✅ status filter
        !maintenanceIds.includes(m._id.toString()) &&
        !idleIds.includes(m._id.toString())
    );

    res.status(200).json({ machines: availableMachines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get in-progress idle machines for a factory
exports.getInProgressIdles = async (req, res) => {
  try {
    const { factoryId } = req.params;

    const idles = await MachineIdle.find({
      factoryId,
      status: "Machine Idle In-Progress",
    }).populate("machineId", "machineCode machineCategory");

    // Return in format suitable for frontend
    const formattedIdles = idles.map((i) => ({
      _id: i._id,
      machineCode: i.machineId.machineCode,
      machineCategory: i.machineId.machineCategory,
    }));

    res.status(200).json({ idles: formattedIdles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Create new idle
exports.createIdle = async (req, res) => {
  try {
    const { machineId, factoryId, reason, description, startTime } = req.body;
    const createdBy = req.user._id;

    // Check maintenance conflict
    const maintenance = await Maintenance.findOne({
      machineId,
      status: "Maintenance In-Progress",
    });
    if (maintenance)
      return res.status(400).json({ error: "Machine under maintenance" });

    // Check if already idle
    const idleExist = await MachineIdle.findOne({
      machineId,
      status: "Machine Idle In-Progress",
    });
    if (idleExist)
      return res.status(400).json({ error: "Machine already idle" });

    const idle = await MachineIdle.create({
      machineId,
      factoryId,
      reason,
      description,
      startTime,
      createdBy,
      status: "Machine Idle In-Progress",
    });
    // ✅ Update machine status to "Machine Idle In-Progress"
    await Machine.updateOne(
      { _id: { $in: machineId } },
      { $set: { status: "Machine Idle In-Progress" } }
    );

    // ===============================
    // 5️⃣ Fetch Machine & Factory Data
    // ===============================
    const machineData = await Machine.findById(machineId).select("machineCode");
    const factoryData = await Factory.findById(factoryId).select("factoryName");

    const machineCode = machineData ? machineData.machineCode : machineId;
    const factoryName = factoryData ? factoryData.factoryName : factoryId;

    // ===============================
    // 6️⃣ Send Notification
    // ===============================
    await NotificationService.createAndEmitNotification(req, {
      title: "Machine Idle Initiated",
      message: `Machine "${machineCode}" at "${factoryName}" has been marked as idle due to "${reason}". Initiated by ${
        req.user.name || "Someone"
      }.`,
      type: "machineIdle",
      createdBy: req.user._id,
    });

    // ===============================
    res.status(201).json({ idle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ End an idle
exports.endIdle = async (req, res) => {
  try {
    const { idleId } = req.params;
    const userId = req.user._id; // protect middleware থেকে আসে

    const idle = await MachineIdle.findById(idleId);
    if (!idle) return res.status(404).json({ error: "Idle record not found" });
    // Machine বের করো
    const machine = await Machine.findById(idle.machineId);
    if (!machine) return res.status(404).json({ error: "Machine not found" });

    // ✅ Factory check (যদি superadmin না হয়)
    if (req.user.role !== "superadmin") {
      if (String(req.user.factoryId) !== String(machine.factoryId)) {
        return res
          .status(403)
          .json({ error: "Not authorized for this factory" });
      }
    }
    if (idle.status === "Resolved")
      return res.status(400).json({ error: "Idle already resolved" });

    // Push to history
    idle.history.push({
      previousStatus: idle.status,
      newStatus: "Resolved",
      changedBy: userId,
      changedAt: new Date(),
    });

    // Update status and endTime
    idle.status = "Resolved";
    idle.endTime = new Date();

    // Calculate duration
    idle.durationMinutes = Math.round(
      (idle.endTime - idle.startTime) / (1000 * 60)
    );

    await idle.save();

    // 6️⃣ যদি Completed হয় → machine status আবার In-House করে দাও
    // if (idle.status === "Resolved") {
    //   await Machine.findByIdAndUpdate(idle.machineId, {
    //     status: "In-House",
    //   });
    // }
    if (idle.status === "Resolved") {
      // Step 1: Find the machine first
      const machine = await Machine.findById(idle.machineId);

      if (machine) {
        // Step 2: Determine new status based on factory IDs
        let updatedStatus = "In-House";
        if (machine.originFactory.toString() !== machine.factoryId.toString()) {
          updatedStatus = "Borrowed";
        }

        // Step 3: Update machine status
        await Machine.findByIdAndUpdate(idle.machineId, {
          status: updatedStatus, // set new status conditionally
        });
      }
    }
    // -----------------------------------------------------
    // 🔹 Fetch names for Notification
    // -----------------------------------------------------
    const machineData = await Machine.findById(idle.machineId).select(
      "machineCode"
    );
    const factoryData = await Factory.findById(idle.factoryId).select(
      "factoryName"
    );

    const machineCode = machineData ? machineData.machineCode : idle.machineId;
    const factoryName = factoryData ? factoryData.factoryName : idle.factoryId;

    // -----------------------------------------------------
    // 🔹 Send Notification
    // -----------------------------------------------------
    await NotificationService.createAndEmitNotification(req, {
      title: "Idle Resolved",
      message: `Machine "${machineCode}" at "${factoryName}" has been resolved from idle state after ${
        idle.durationMinutes
      } minutes. Resolved by ${req.user.name || "Someone"}.`,
      type: "machineIdle",
      createdBy: req.user._id,
    });

    // -----------------------------------------------------
    res.status(200).json({ idle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
// ✅ Get all MachineIdle records (optionally filter by factory, status, date)
exports.getAllMachineIdles = async (req, res) => {
  try {
    const { factoryId, status, startDate, endDate } = req.query;

    let filter = {};

    if (factoryId) filter.factoryId = factoryId;
    if (status) filter.status = status; // "In-Progress" or "Resolved"
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }

    const idles = await MachineIdle.find(filter)
      .populate("machineId", "machineCode machineCategory machineGroup")
      .populate("factoryId", "factoryName factoryLocation")
      .populate("createdBy", "name email")
      .populate("history.changedBy", "name email")
      .sort({ startTime: -1 });

    const formattedIdles = idles.map((i) => ({
      _id: i._id,
      idleId: i.idleId,
      machineCode: i.machineId.machineCode,
      machineCategory: i.machineId.machineCategory,
      machineGroup: i.machineId.machineGroup,
      factoryName: i.factoryId.factoryName,
      factoryLocation: i.factoryId.factoryLocation,
      reason: i.reason,
      description: i.description,
      startTime: i.startTime,
      endTime: i.endTime,
      durationMinutes: i.durationMinutes,
      status: i.status,
      createdBy: i.createdBy.name,
      changedBy: i.history.map((h) => h.changedBy.name),
      history: i.history,
    }));

    res.status(200).json({ idles: formattedIdles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
