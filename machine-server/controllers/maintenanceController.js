const Maintenance = require("../models/Maintenance");
const Machine = require("../models/Machine");
const Factory = require("../models/Factory");
const User = require("../models/User");
const NotificationService = require("./notificationController"); // or relative path
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

    // ---------------------------------------------------------
    // 🔔 Notification Section (Professional)
    // ---------------------------------------------------------
    // Fetch machine codes
    const machines = await Machine.find({ _id: { $in: machineIds } }).select(
      "machineCode"
    );
    const machineCodes = machines.map((m) => m.machineCode);

    // Fetch factory Name
    const factoryData = await Factory.findById(factoryId).select("factoryName");
    const factoryName = factoryData ? factoryData.factoryName : factoryId;
    const factoryUsers = await User.find({ factoryId }).select("_id");
    const admins = await User.find({ role: "admin" }).select("_id");

    let recipients = [
      ...factoryUsers.map((u) => u._id),
      ...admins.map((a) => a._id),
    ];
    recipients = [...new Set(recipients.map(String))];
    // Send Notification
    await NotificationService.createAndEmitNotification(req, {
      title: "Maintenance Initiation Created",
      message: `Maintenance Initiated: ${
        machineCodes.length
      } machine(s) (${machineCodes.join(
        ", "
      )}) have been successfully marked for "${maintenanceType}" maintenance at "${factoryName}" by ${
        req.user.name || "Someone"
      }.`,

      type: "maintenance",
      createdBy: req.user._id,
      recipients,
    });

    // ---------------------------------------------------------
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
    // if (newStatus === "Maintenance Completed") {
    //   await Machine.findByIdAndUpdate(maintenance.machineId, {
    //     status: "In-House",
    //   });
    // }
    if (newStatus === "Maintenance Completed") {
      // Step 1: Find the machine first
      const machine = await Machine.findById(maintenance.machineId);

      if (machine) {
        // Step 2: Determine new status based on factory IDs
        let updatedStatus = "In-House";
        if (machine.originFactory.toString() !== machine.factoryId.toString()) {
          updatedStatus = "Borrowed";
        }

        // Step 3: Update both previousStatus and status
        await Machine.findByIdAndUpdate(maintenance.machineId, {
          status: updatedStatus, // set new status conditionally
        });
      }
    }

    // ============================
    // 7️⃣ Fetch Machine & Factory Details for Notification
    // ============================
    const machineData = await Machine.findById(maintenance.machineId).select(
      "machineCode"
    );

    const factoryData = await Factory.findById(maintenance.factoryId).select(
      "factoryName"
    );

    const machineCode = machineData
      ? machineData.machineCode
      : maintenance.machineId;
    const factoryName = factoryData
      ? factoryData.factoryName
      : maintenance.factoryId;
    // ============================
    // 🔥 RECIPIENTS HERE
    // ============================
    const factoryUsers = await User.find({
      factoryId: maintenance.factoryId,
    }).select("_id");

    const admins = await User.find({ role: "admin" }).select("_id");

    let recipients = [
      ...factoryUsers.map((u) => u._id),
      ...admins.map((a) => a._id),
      req.user._id,
    ];

    recipients = [...new Set(recipients.map(String))]; // remove duplicates
    // ============================
    // 8️⃣ Send Notification
    // ============================
    await NotificationService.createAndEmitNotification(req, {
      title: `Maintenance Status Updated`,
      message: `Maintenance status for machine "${machineCode}" at "${factoryName}" has been updated from "${previousStatus}" to "${newStatus}" by ${
        req.user.name || "Someone"
      }.`,
      type: "maintenance",
      createdBy: req.user._id,
      recipients,
    });
    // ============================
    res
      .status(200)
      .json({ message: "Status updated successfully", maintenance });
  } catch (err) {
    console.error("❌ Update status error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
