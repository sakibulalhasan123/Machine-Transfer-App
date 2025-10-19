const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");

/**
 * Get available machines for a factory
 * Rule:
 * - Only In-House or Borrowed
 * - Exclude machines with In-Progress maintenance
 * @route GET /api/maintenances/machines/factory/:factoryId
 * @auth required
 */
exports.getFactoryMachines = async (req, res) => {
  try {
    const { factoryId } = req.params;
    if (!factoryId)
      return res.status(400).json({ error: "factoryId required" });

    // 1️⃣ Fetch machines In-House or Borrowed
    let machines = await Machine.find({
      factoryId,
      status: { $in: ["In-House", "Borrowed"] },
    }).select("_id machineCode machineCategory status");

    // 2️⃣ Fetch machines with In-Progress maintenance
    const inProgressMaint = await Maintenance.find({
      factoryId,
      status: "In-Progress",
    }).select("machineId");

    const inProgressIds = inProgressMaint.map((m) => String(m.machineId));

    // 3️⃣ Exclude In-Progress machines
    machines = machines.filter((m) => !inProgressIds.includes(String(m._id)));

    res.json({ machines });
  } catch (err) {
    console.error("Error fetching machines:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * @desc Create maintenance for multiple machines
 * @route POST /api/maintenances
 * @access Private
 */
exports.createMaintenance = async (req, res) => {
  try {
    const {
      factoryId,
      machineIds,
      maintenanceType,
      description,
      spareParts,
      remarks,
      maintenanceDate,
    } = req.body;

    if (!factoryId || !machineIds?.length || !maintenanceType || !description) {
      return res.status(400).json({
        error:
          "factoryId, machineIds, maintenanceType, and description are required",
      });
    }

    // ✅ Check machines exist and status
    const invalidMachines = [];
    for (let id of machineIds) {
      const machine = await Machine.findById(id);
      if (!machine || !["In-House", "Borrowed"].includes(machine.status)) {
        invalidMachines.push(id);
      }
    }

    if (invalidMachines.length > 0) {
      return res.status(400).json({
        error: `Maintenance cannot be done on machine(s) [${invalidMachines.join(
          ", "
        )}] due to invalid status or not found`,
      });
    }

    // ✅ Create maintenance records
    const maintenances = await Promise.all(
      machineIds.map((machineId) =>
        Maintenance.create({
          factoryId,
          machineId,
          maintenanceType,
          description,
          spareParts,
          remarks: remarks || "",
          createdBy: req.user._id,
          maintenanceDate: maintenanceDate
            ? new Date(maintenanceDate)
            : undefined, // ✅ user-provided
        })
      )
    );
    // ✅ Update machine status to "Maintenance In-Progress"
    await Machine.updateMany(
      { _id: { $in: machineIds } },
      { $set: { status: "Maintenance In-Progress" } }
    );
    res.status(201).json({
      message: "Maintenance record(s) created successfully",
      maintenances,
    });
  } catch (err) {
    console.error("Error creating maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Get all maintenances (with filters)
exports.getMaintenances = async (req, res) => {
  try {
    const { factoryId, status, machineId } = req.query;

    const filter = {};

    //if (factoryId) filter.factoryId = factoryId;
    if (status) filter.status = status;
    if (machineId) filter.machineId = machineId;

    // Role check
    if (req.user.role !== "superadmin") {
      // Normal user শুধু নিজের factory
      filter.factoryId = req.user.factoryId;
    } else if (factoryId) {
      filter.factoryId = factoryId;
    }
    const maintenances = await Maintenance.find(filter)
      .populate("machineId", "machineCode machineCategory status")
      .populate("factoryId", "factoryName factoryLocation")
      .populate("createdBy", "name email")
      .populate({
        path: "history.changedBy",
        select: "name role email", // show only what you need
      })
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({ maintenances });
  } catch (err) {
    console.error("❌ Error fetching maintenances:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 🔹 Update maintenance status
exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { maintenanceId } = req.params; // URL: /api/maintenances/:maintenanceId/status
    const { newStatus } = req.body; // newStatus = "Completed", userId = যিনি update করছেন

    // 1️⃣ Find maintenance
    const maintenance = await Maintenance.findById(maintenanceId);
    if (!maintenance)
      return res.status(404).json({ error: "Maintenance not found" });

    // 2️⃣ Save previous status
    const previousStatus = maintenance.status;

    // 3️⃣ Update status
    maintenance.status = newStatus;

    // 4️⃣ Push to history
    maintenance.history.push({
      previousStatus,
      newStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    // 5️⃣ Save
    await maintenance.save();

    // 6️⃣ যদি Completed হয় → machine status আবার In-House করে দাও
    if (newStatus === "Completed") {
      await Machine.findByIdAndUpdate(maintenance.machineId, {
        status: "In-House",
      });
    }
    res
      .status(200)
      .json({ message: "Status updated successfully", maintenance });
  } catch (err) {
    console.error("❌ Update status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
