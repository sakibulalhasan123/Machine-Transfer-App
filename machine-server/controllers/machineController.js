const Machine = require("../models/Machine.js");

// ✅ Validate required fields
const validateMachine = ({
  factoryId,
  machineCategory,
  machineGroup,
  machineCode,
}) => {
  return factoryId && machineCategory && machineGroup && machineCode;
};

// ➤ Add single machine
const addMachine = async (req, res) => {
  try {
    const { factoryId, machineCategory, machineGroup, machineCode } = req.body;

    if (!validateMachine(req.body)) {
      return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    const existing = await Machine.findOne({ machineCode });
    if (existing) {
      return res.status(400).json({
        message: `⚠️ Machine code already exists: ${machineCode}`,
      });
    }

    const machine = new Machine({
      factoryId,
      originFactory: factoryId,
      machineCategory,
      machineGroup,
      machineCode,
      createdBy: req.user._id,
      status: "In-House",
    });

    await machine.save();

    return res.status(201).json({
      message: "✅ Machine added successfully",
      machine,
    });
  } catch (error) {
    return res.status(500).json({
      message: "❌ Error adding machine",
      error: error.message,
    });
  }
};

// ➤ Bulk add machines
const bulkAddMachines = async (req, res) => {
  try {
    let machines = Array.isArray(req.body?.machines)
      ? req.body.machines
      : req.body;

    if (!Array.isArray(machines) || machines.length === 0) {
      return res
        .status(400)
        .json({ message: "⚠️ Machines must be a non-empty array" });
    }

    // Validate each machine
    const invalidMachine = machines.find((m) => !validateMachine(m));
    if (invalidMachine) {
      return res.status(400).json({
        message:
          "⚠️ Each machine must have factoryId, machineCategory, machineGroup, and machineCode",
      });
    }

    // ✅ Check duplicates within request
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

    // ✅ Check duplicates in DB
    const existingMachines = await Machine.find({
      machineCode: { $in: codes },
    }).lean();
    if (existingMachines.length) {
      return res.status(400).json({
        message: `⚠️ Machine code(s) already exist in DB: ${existingMachines
          .map((m) => m.machineCode)
          .join(", ")}`,
      });
    }

    // Add extra fields
    machines = machines.map((m) => ({
      ...m,
      createdBy: req.user._id,
      status: "In-House",
      originFactory: m.factoryId,
    }));

    const inserted = await Machine.insertMany(machines, { ordered: true });

    return res.status(201).json({
      message: `✅ Successfully added ${inserted.length} machines`,
      count: inserted.length,
      machineCodes: inserted.map((m) => m.machineCode),
      machines: inserted,
    });
  } catch (error) {
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
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation")
      .populate("originFactory", "factoryName factoryLocation")
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

module.exports = {
  addMachine,
  bulkAddMachines,
  checkDuplicates,
  getMachinesByFactory,
};
