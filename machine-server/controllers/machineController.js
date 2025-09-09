const Machine = require("../models/Machine.js");

// ✅ Helper: Validate a machine object
const validateMachine = ({
  factoryId,
  machineCategory,
  machineGroup,
  machineCode,
}) => {
  return factoryId && machineCategory && machineGroup && machineCode;
};

// ➤ Add a single machine
const addMachine = async (req, res) => {
  try {
    if (!validateMachine(req.body)) {
      return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    const { factoryId, machineCategory, machineGroup, machineCode } = req.body;

    const machine = new Machine({
      factoryId,
      machineCategory,
      machineGroup,
      machineCode,
      createdBy: req.user._id, // logged-in user ID
    });

    await machine.save();

    return res.status(201).json({
      message: "✅ Machine added successfully",
      machine,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "⚠️ Machine code already exists" });
    }
    return res.status(500).json({
      message: "❌ Error adding machine",
      error: error.message,
    });
  }
};

// ➤ Bulk add machines
const bulkAddMachines = async (req, res) => {
  // console.log("Logged-in user:", req.user); // check req.user
  try {
    let machines = Array.isArray(req.body?.machines)
      ? req.body.machines
      : req.body;
    // console.log("Incoming machines:", machines);
    if (!Array.isArray(machines) || machines.length === 0) {
      return res
        .status(400)
        .json({ message: "⚠️ Machines must be a non-empty array" });
    }

    const invalidMachine = machines.find((m) => !validateMachine(m));
    if (invalidMachine) {
      // console.log("Invalid machine found:", invalidMachine);
      return res.status(400).json({
        message:
          "⚠️ Each machine must have factoryId, machineCategory, machineGroup, and machineCode",
      });
    }
    // ➤ এখানে প্রতিটা মেশিনে createdBy যোগ করা হচ্ছে
    machines = machines.map((m) => ({
      ...m,
      createdBy: req.user._id, // লগged-in ইউজারের ID
    }));
    // console.log("Machines to insert:", machines);
    const inserted = await Machine.insertMany(machines, { ordered: true });
    // console.log("Inserted machines:", inserted);
    return res.status(201).json({
      message: `✅ Successfully added ${inserted.length} machines`,
      count: inserted.length,
      machineCodes: inserted.map((m) => m.machineCode),
      machines: inserted,
    });
  } catch (error) {
    console.error("Bulk Add Error:", error);
    const isDuplicate =
      error.code === 11000 || error?.writeErrors?.some((e) => e.code === 11000);
    if (isDuplicate) {
      return res.status(400).json({
        message: "⚠️ Machine code already exists",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "❌ Error bulk adding machines",
      error: error.message,
    });
  }
};
// ➤ Get all machines grouped by factory
const getMachinesByFactory = async (req, res) => {
  try {
    // Populate factory details
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation name location")
      .sort({ createdAt: -1 });

    // Group machines by factory
    const machinesByFactory = machines.reduce((acc, machine) => {
      const factory = machine.factoryId || {};
      const factoryName =
        factory.factoryName || factory.name || "Unknown Factory";
      const factoryLocation =
        factory.factoryLocation || factory.location || "—";
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
  getMachinesByFactory,
};
