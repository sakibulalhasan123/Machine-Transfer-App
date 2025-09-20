const MachineIdle = require("../models/MachineIdle");
const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");

// ✅ Get machines available for idle
exports.getAvailableMachines = async (req, res) => {
  try {
    const { factoryId } = req.params;

    const allMachines = await Machine.find({ factoryId });

    const maintenanceInProgress = await Maintenance.find({
      factoryId,
      status: "In-Progress",
    }).select("machineId");

    const maintenanceIds = maintenanceInProgress.map((m) =>
      m.machineId.toString()
    );

    const idleInProgress = await MachineIdle.find({
      factoryId,
      status: "In-Progress",
    }).select("machineId");

    const idleIds = idleInProgress.map((i) => i.machineId.toString());

    // Filter out machines already in maintenance or idle
    const availableMachines = allMachines.filter(
      (m) =>
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
      status: "In-Progress",
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
      status: "In-Progress",
    });
    if (maintenance)
      return res.status(400).json({ error: "Machine under maintenance" });

    // Check if already idle
    const idleExist = await MachineIdle.findOne({
      machineId,
      status: "In-Progress",
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
      status: "In-Progress",
    });

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
      .populate("machineId", "machineCode machineCategory")
      .populate("factoryId", "factoryName factoryLocation")
      .populate("createdBy", "name email")
      .sort({ startTime: -1 });

    const formattedIdles = idles.map((i) => ({
      _id: i._id,
      idleId: i.idleId,
      machineCode: i.machineId.machineCode,
      machineCategory: i.machineId.machineCategory,
      factoryName: i.factoryId.factoryName,
      factoryLocation: i.factoryId.factoryLocation,
      reason: i.reason,
      description: i.description,
      startTime: i.startTime,
      endTime: i.endTime,
      durationMinutes: i.durationMinutes,
      status: i.status,
      createdBy: i.createdBy.name,
      history: i.history,
    }));

    res.status(200).json({ idles: formattedIdles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
