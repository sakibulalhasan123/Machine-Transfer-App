const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const Transfer = require("../models/Transfer");
const Maintenance = require("../models/Maintenance");
const MachineIdle = require("../models/MachineIdle");

const getMachineLiveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid or missing machine ID" });
    }

    const machine = await Machine.findById(id)
      .populate("factoryId", "factoryName")
      .lean();

    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    const [transfer, maintenance, idle] = await Promise.all([
      Transfer.findOne({ machineId: id, status: { $ne: "Completed" } }),
      Maintenance.findOne({ machineId: id, status: { $ne: "Completed" } }),
      MachineIdle.findOne({ machineId: id, status: { $ne: "Completed" } }),
    ]);

    let liveStatus = "In-House";
    let referenceId = null;

    if (transfer) {
      liveStatus = "Transfer";
      referenceId = transfer.transferId;
    } else if (maintenance) {
      liveStatus = "Maintenance";
      referenceId = maintenance.maintenanceId;
    } else if (idle) {
      liveStatus = "Idle";
      referenceId = idle.idleId;
    }

    res.json({
      machine,
      liveStatus,
      referenceId,
    });
  } catch (error) {
    console.error("Live status error:", error);
    res.status(500).json({
      message: "Failed to get machine live status",
    });
  }
};

module.exports = { getMachineLiveStatus };
