const mongoose = require("mongoose");
const Machine = require("../models/Machine.js");
const Counter = require("../models/Counter.js");

// ✅ Validate required fields
const validateMachine = ({
  factoryId,
  machineCategory,
  machineGroup,
  machineCode,
}) => {
  return factoryId && machineCategory && machineGroup && machineCode;
};

// 🔹 Generate machine numbers inside a transaction
async function getNextMachineNumbers(count, session) {
  const year = new Date().getFullYear().toString().slice(-2);

  const counter = await Counter.findOneAndUpdate(
    { _id: `machine-${year}` },
    { $inc: { seq: count } },
    { new: true, upsert: true, session }
  );

  const startSeq = counter.seq - count + 1;
  const machineNumbers = [];
  for (let i = 0; i < count; i++) {
    const seqString = (startSeq + i).toString().padStart(5, "0");
    machineNumbers.push(`MAC-${year}-${seqString}`);
  }

  return machineNumbers;
}

// ➤ Add single machine (transaction-safe)
const addMachine = async (req, res) => {
  let session;
  try {
    const {
      factoryId,
      machineCategory,
      machineGroup,
      machineCode,
      purchaseDate,
    } = req.body;

    if (!validateMachine(req.body)) {
      return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    const existing = await Machine.findOne({ machineCode });
    if (existing) {
      return res
        .status(400)
        .json({ message: `⚠️ Machine code already exists: ${machineCode}` });
    }
    session = await mongoose.startSession();
    session.startTransaction();
    const [machineNumber] = await getNextMachineNumbers(1, session);

    const machine = new Machine({
      factoryId,
      originFactory: factoryId,
      machineCategory,
      machineGroup,
      machineCode,
      machineNumber,
      createdBy: req.user._id,
      status: "In-House",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
    });

    await machine.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "✅ Machine added successfully",
      machine,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        message: "❌ Error adding machine",
        error: error.message,
      });
    }
  }
};

// ➤ Bulk add machines (transaction-safe)
const bulkAddMachines = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let machines = Array.isArray(req.body?.machines)
      ? req.body.machines
      : req.body;
    if (!Array.isArray(machines) || machines.length === 0) {
      return res
        .status(400)
        .json({ message: "⚠️ Machines must be a non-empty array" });
    }

    const invalidMachine = machines.find((m) => !validateMachine(m));
    if (invalidMachine) {
      return res.status(400).json({
        message:
          "⚠️ Each machine must have factoryId, machineCategory, machineGroup, and machineCode",
      });
    }

    const codes = machines.map((m) => m.machineCode);
    const duplicatesInRequest = codes.filter(
      (code, idx) => codes.indexOf(code) !== idx
    );
    if (duplicatesInRequest.length) {
      return res.status(400).json({
        message: `⚠️ Duplicate codes in request: ${[
          ...new Set(duplicatesInRequest),
        ].join(", ")}`,
      });
    }

    const existingMachines = await Machine.find({ machineCode: { $in: codes } })
      .lean()
      .session(session);
    if (existingMachines.length) {
      return res.status(400).json({
        message: `⚠️ Machine code(s) already exist in DB: ${existingMachines
          .map((m) => m.machineCode)
          .join(", ")}`,
      });
    }

    const machineNumbers = await getNextMachineNumbers(
      machines.length,
      session
    );
    machines = machines.map((m, idx) => ({
      ...m,
      machineNumber: machineNumbers[idx],
      createdBy: req.user._id,
      status: "In-House",
      originFactory: m.factoryId,
      purchaseDate: m.purchaseDate ? new Date(m.purchaseDate) : undefined,
    }));

    const inserted = await Machine.insertMany(machines, {
      session,
      ordered: true,
    });
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: `✅ Successfully added ${inserted.length} machines`,
      count: inserted.length,
      machineCodes: inserted.map((m) => m.machineCode),
      machines: inserted,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      message: "❌ Error bulk adding machines",
      error: error.message,
    });
  }
};

// ➤ Check duplicates (for preview)
const checkDuplicates = async (req, res) => {
  try {
    const { machineCodes } = req.body;
    if (!Array.isArray(machineCodes))
      return res.status(400).json({ duplicates: [] });

    const existing = await Machine.find({
      machineCode: { $in: machineCodes },
    }).lean();
    return res.json({ duplicates: existing.map((m) => m.machineCode) });
  } catch (err) {
    return res.status(500).json({ duplicates: [], error: err.message });
  }
};

// ➤ Get all machines grouped by factory
const getMachinesByFactory = async (req, res) => {
  try {
    const machines = await Machine.find({
      isDeleted: { $ne: true }, // deleted না হলে সব দেখাবে
    })
      .populate("factoryId", "factoryName factoryLocation")
      .populate("originFactory", "factoryName factoryLocation")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const machinesByFactory = machines.reduce((acc, machine) => {
      const factory = machine.factoryId || {};
      const factoryName = factory.factoryName || "Unknown Factory";
      const factoryLocation = factory.factoryLocation || "—";
      const key = `${factoryName} | ${factoryLocation}`;

      if (!acc[key]) acc[key] = [];
      acc[key].push(machine);
      return acc;
    }, {});

    return res.status(200).json({ machinesByFactory });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error fetching machines by factory",
      error: error.message,
    });
  }
};

// controllers/machineStatusController.js

const Transfer = require("../models/Transfer");
const Maintenance = require("../models/Maintenance");
const MachineIdle = require("../models/MachineIdle");

const getAllMachineStatus = async (req, res) => {
  try {
    // Step 1: সব মেশিন নিয়ে আসা
    const machines = await Machine.find()
      .populate("factoryId", "factoryName")
      .populate("originFactory", "factoryName")
      .populate("createdBy", "name email")
      .lean(); // faster query result

    // Step 2: সব relation একবারে নিয়ে আসা (performance-friendly)
    const [transfers, maintenances, idles] = await Promise.all([
      Transfer.find().select("machineId transferId status").lean(),
      Maintenance.find().select("machineId maintenanceId status").lean(),
      MachineIdle.find().select("machineId idleId status").lean(),
    ]);

    // Step 3: প্রতিটা মেশিনে related IDs attach করা
    const machinesWithRelations = machines.map((machine) => {
      const relatedTransfer = transfers.find(
        (t) => t.machineId.toString() === machine._id.toString()
      );
      const relatedMaintenance = maintenances.find(
        (m) => m.machineId.toString() === machine._id.toString()
      );
      const relatedIdle = idles.find(
        (i) => i.machineId.toString() === machine._id.toString()
      );

      return {
        ...machine,
        transferId: relatedTransfer ? relatedTransfer.transferId : null,
        transferStatus: relatedTransfer ? relatedTransfer.status : null,

        maintenanceId: relatedMaintenance
          ? relatedMaintenance.maintenanceId
          : null,
        maintenanceStatus: relatedMaintenance
          ? relatedMaintenance.status
          : null,

        idleId: relatedIdle ? relatedIdle.idleId : null,
        idleStatus: relatedIdle ? relatedIdle.status : null,
      };
    });

    // Step 4: Final Response
    res.status(200).json({
      success: true,
      totalMachines: machinesWithRelations.length,
      machines: machinesWithRelations,
    });
  } catch (err) {
    console.error("🔥 getAllMachineStatus error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ➤ Get machine by ID with populated fields
const getMachineById = async (req, res) => {
  try {
    const { id } = req.params;
    const machine = await Machine.findById(id)
      .populate("factoryId", "factoryName factoryLocation")
      .populate("originFactory", "factoryName factoryLocation")
      .populate("createdBy", "name email")
      .lean();

    if (!machine) {
      return res.status(404).json({ message: "❌ Machine not found" });
    }

    res.status(200).json({ success: true, machine });
  } catch (err) {
    console.error("🔥 getMachineById error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ➤ Update machine status (isActive)
const updateMachineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const machine = await Machine.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    if (!machine) {
      return res
        .status(404)
        .json({ success: false, message: "Machine not found" });
    }

    res.status(200).json({
      success: true,
      message: "Machine status updated",
      data: machine,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// ➤ Update machine details
const updateMachine = async (req, res) => {
  const { id } = req.params;
  const { machineCode, machineCategory, machineGroup, purchaseDate, status } =
    req.body;

  if (!machineCode || !machineCategory || !machineGroup) {
    return res.status(400).json({
      message: "⚠️ factoryId, machineCategory, machineGroup required",
    });
  }

  try {
    const machine = await Machine.findById(id);
    if (!machine) {
      return res.status(404).json({ message: "❌ Machine not found" });
    }

    // Update fields
    machine.machineCode = machineCode;
    machine.machineCategory = machineCategory;
    machine.machineGroup = machineGroup;
    if (purchaseDate) machine.purchaseDate = new Date(purchaseDate);
    if (status) machine.status = status;

    await machine.save();
    res
      .status(200)
      .json({ success: true, message: "✅ Machine updated", machine });
  } catch (err) {
    console.error("🔥 updateMachine error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// ➤ Soft delete machine
const softDeleteMachine = async (req, res) => {
  const { id } = req.params;
  try {
    const machine = await Machine.findById(id);
    if (!machine) {
      return res.status(404).json({ message: "❌ Machine not found" });
    }

    machine.isDeleted = true;
    await machine.save();

    res.status(200).json({ success: true, message: "✅ Machine soft deleted" });
  } catch (err) {
    console.error("🔥 softDeleteMachine error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  addMachine,
  bulkAddMachines,
  checkDuplicates,
  getMachinesByFactory,
  getAllMachineStatus,
  getMachineById,
  updateMachineStatus,
  updateMachine,
  softDeleteMachine,
};
