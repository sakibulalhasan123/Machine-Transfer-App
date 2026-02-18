const Factory = require("../models/Factory");
const Machine = require("../models/Machine");
const Transfer = require("../models/Transfer");
const Maintenance = require("../models/Maintenance");
const User = require("../models/User");
const NotificationService = require("./notificationController"); // or relative path
/**
 * Get all machines of a factory
 * @route GET /api/factories/:factoryId/machines
 */

exports.getMachinesByFactory = async (req, res) => {
  try {
    const { factoryId } = req.params;
    const machines = await Machine.find({
      factoryId,
      status: "In-House",
    }).lean();
    return res.json({ machines });
  } catch (error) {
    console.error("Error fetching machines:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/machines/code/:machineCode
exports.getMachineByCode = async (req, res) => {
  try {
    const { machineCode } = req.params;

    const machine = await Machine.findOne({ machineCode })
      .populate("factoryId", "factoryName")
      .lean();

    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    return res.json(machine);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Create Transfer
 * @route POST /api/transfers
 * @body { fromFactory, toFactory, machineIds, remarks }
 */
exports.createTransfer = async (req, res) => {
  try {
    const { fromFactory, toFactory, machineIds, remarks } = req.body;

    if (!fromFactory || !toFactory || !machineIds?.length) {
      return res.status(400).json({
        error: "fromFactory, toFactory, and machineIds are required",
      });
    }
    // ✅ Validate machines belong to fromFactory and are In-House
    const validMachines = await Machine.find({
      _id: { $in: machineIds },
      factoryId: fromFactory,
      status: "In-House",
    });
    if (validMachines.length !== machineIds.length) {
      return res.status(400).json({
        error: "One or more machines are not valid for this transfer",
      });
    }
    // Check if machines are already borrowed
    const blockedMachines = await Promise.all(
      machineIds.map(async (machineId) => {
        const lastTransfer = await Transfer.findOne({ machineId })
          .sort({ transferDate: -1 })
          .lean();
        if (lastTransfer && lastTransfer.status !== "Returned")
          return machineId;
        return null;
      }),
    );
    const blocked = blockedMachines.filter(Boolean);
    if (blocked.length)
      return res.status(400).json({
        error: `Cannot transfer machine(s) [${blocked.join(
          ", ",
        )}] before return to origin factory`,
      });

    // Create Transfer records
    const transfers = await Promise.all(
      machineIds.map((machineId) =>
        Transfer.create({
          machineId,
          fromFactory,
          toFactory,
          transferedBy: req.user._id,
          transferDate: new Date(),
          status: "Transfer In-Progress",
          remarks: remarks || "",
        }),
      ),
    );

    // ✅ Update machines safely
    const updateResult = await Machine.updateMany(
      { _id: { $in: machineIds }, factoryId: fromFactory, status: "In-House" },
      { $set: { status: "Transfer Initiated" } },
    );

    if (updateResult.matchedCount !== machineIds.length) {
      return res.status(500).json({
        error: "Some machines could not be updated. Please check again.",
      });
    }
    // Fetch machine codes For Notifications
    const machines = await Machine.find({ _id: { $in: machineIds } }).select(
      "machineCode",
    );
    const machineCodes = machines.map((m) => m.machineCode);

    // Fetch factory names
    const fromFactoryData =
      await Factory.findById(fromFactory).select("factoryName");
    const toFactoryData =
      await Factory.findById(toFactory).select("factoryName");

    const fromFactoryName = fromFactoryData
      ? fromFactoryData.factoryName
      : fromFactory;
    const toFactoryName = toFactoryData ? toFactoryData.factoryName : toFactory;
    // Determine recipients
    const factoryUsers = await User.find({
      factoryId: { $in: [fromFactory, toFactory] },
    }).select("_id");
    const admins = await User.find({ role: "admin" }).select("_id");

    let recipients = [
      ...factoryUsers.map((u) => u._id),
      ...admins.map((a) => a._id),
    ];
    recipients = [...new Set(recipients.map(String))];
    // Send Notification
    await NotificationService.createAndEmitNotification(req, {
      title: "New Transfer Initiation Created",
      message: `Transfer Initiated: ${
        machineCodes.length
      } machine(s) (${machineCodes.join(
        ", ",
      )}) have been successfully transfer Initiated from "${fromFactoryName}" to "${toFactoryName}" by ${
        req.user.name || "Someone"
      }.`,

      type: "transfer",
      createdBy: req.user._id,
      recipients, // 🔹 এটা add করতে হবে
    });

    return res.status(201).json({
      message: "Transfer(s) Initiated successfully",
      transfers,
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

// POST /api/transfers/:id/receive
exports.receiveTransfer = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await Transfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    // Authorization: superadmin can receive all, normal user only own factory
    if (
      req.user.role !== "superadmin" &&
      transfer.toFactory.toString() !== req.user.factoryId.toString()
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    transfer.status = "Transferred";
    transfer.approvedBy = req.user._id; // যে ইউজার confirm করছে
    transfer.approvedDate = new Date(); // <-- local approve time
    await transfer.save();

    // Move machine to new factory
    const machine = await Machine.findById(transfer.machineId);
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    machine.factoryId = transfer.toFactory;
    machine.status = "Borrowed";
    await machine.save();
    // ----------------------------------------
    // ✅ Add Notification Here
    // ----------------------------------------

    // Machine Code fetch
    const machineData = await Machine.findById(transfer.machineId).select(
      "machineCode",
    );

    // Factory Names fetch
    const fromFactory = await Factory.findById(transfer.fromFactory).select(
      "factoryName",
    );
    const toFactory = await Factory.findById(transfer.toFactory).select(
      "factoryName",
    );

    // ----------------------------------------
    // 🔥 SAME Recipients logic from createTransfer
    // ----------------------------------------

    // Find all relevant users
    const factoryUsers = await User.find({
      factoryId: { $in: [transfer.fromFactory, transfer.toFactory] },
    }).select("_id");

    const admins = await User.find({ role: "admin" }).select("_id");

    // Combine + remove duplicates
    let recipients = [
      ...factoryUsers.map((u) => u._id),
      ...admins.map((a) => a._id),
    ];

    recipients = [...new Set(recipients.map(String))];
    await NotificationService.createAndEmitNotification(req, {
      title: "Transfer Received",
      message: `Machine ${
        machineData.machineCode
      } has been successfully transfer received by "${
        toFactory.factoryName
      }" from "${fromFactory.factoryName}". Confirmed by ${
        req.user.name || "Someone"
      }.`,
      type: "transfer",
      createdBy: req.user._id,
      recipients, // 🔹 EXACTLY like createTransfer
    });

    // ----------------------------------------

    return res.status(200).json({ message: "Transfer received", transfer });
  } catch (err) {
    console.error("🔥 receiveTransfer error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ✅ Get Borrowed Machines of a Factory
 * @route GET /api/transfers/machine/borrowed/:factoryId
 */
exports.getBorrowedMachines = async (req, res) => {
  try {
    const { factoryId } = req.params;

    if (!factoryId) {
      return res.status(400).json({ error: "Factory ID is required" });
    }

    // সব borrowed machine ওই factory থেকে আনবে
    const machines = await Machine.find({
      factoryId,
      status: "Borrowed",
    })
      .populate("factoryId", "factoryName factoryLocation")
      .lean();
    // 🔹 Filter out machines which have In-Progress maintenance
    const filteredMachines = [];
    for (const machine of machines) {
      const inProgressMaintenance = await Maintenance.findOne({
        machineId: machine._id,
        status: "In-Progress",
      }).lean();

      if (!inProgressMaintenance) {
        filteredMachines.push(machine);
      }
    }
    return res.status(200).json({ machines: filteredMachines });
  } catch (err) {
    console.error("[Borrowed] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * ✅ Return Machine to Origin Factory
 * @route POST /api/transfers/return
 * @body { machineIds: [String] }
 */
exports.returnToOriginFactory = async (req, res) => {
  try {
    const { machineIds } = req.body;

    if (!Array.isArray(machineIds) || machineIds.length === 0) {
      return res.status(400).json({ error: "machineIds are required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized: user missing" });
    }

    const initiatedMachines = [];

    for (const machineId of machineIds) {
      try {
        const machine = await Machine.findById(machineId);
        if (!machine) {
          console.warn(`[Return] Machine not found: ${machineId}`);
          continue;
        }

        // শেষ transfer খুঁজে বের করো
        const lastTransfer = await Transfer.findOne({ machineId })
          .sort({ transferDate: -1 })
          .lean();

        if (!lastTransfer || lastTransfer.status === "Returned") {
          console.info(`[Return] Already returned / no transfer: ${machineId}`);
          continue;
        }

        if (machine.status !== "Borrowed") {
          console.info(`[Return] Not borrowed, skip: ${machineId}`);
          continue;
        }
        if (machine.status === "Return Initiated") {
          console.info(`[Return] Already return initiated: ${machineId}`);
          continue;
        }
        const originFactory = lastTransfer.fromFactory || machine.originFactory;
        if (!originFactory) {
          console.warn(`[Return] Origin factory missing: ${machineId}`);
          continue;
        }

        // নতুন return transfer তৈরি করো
        const returnTransfer = new Transfer({
          machineId: machine._id,
          fromFactory: machine.factoryId,
          toFactory: originFactory,
          status: "Returned In-Progress", // ট্রান্সফার এখনও চলতেছে
          transferedBy: req.user._id,
          transferDate: new Date(),
          remarks: "Returned Initiated to origin factory",
        });

        await returnTransfer.save();

        // Machine update
        // machine.factoryId = originFactory;
        machine.status = "Return Initiated";
        await machine.save();

        initiatedMachines.push(machine);

        // ------------------------------------------
        // ✅ Notification Logic
        // ------------------------------------------

        // Machine Code fetch
        const machineData = await Machine.findById(machine._id).select(
          "machineCode",
        );

        // Factory names fetch (from current and origin)
        const fromFactoryData = await Factory.findById(
          machine.factoryId,
        ).select("factoryName");
        const toFactoryData =
          await Factory.findById(originFactory).select("factoryName");
        // ======================================================
        // 🔥 SAME RECIPIENT SYSTEM LIKE OTHER FUNCTIONS
        // ======================================================

        const factoryUsers = await User.find({
          factoryId: { $in: [machine.factoryId, originFactory] },
        }).select("_id");

        const admins = await User.find({ role: "admin" }).select("_id");

        let recipients = [
          ...factoryUsers.map((u) => u._id.toString()),
          ...admins.map((a) => a._id.toString()),
        ];

        recipients = [...new Set(recipients)];
        await NotificationService.createAndEmitNotification(req, {
          title: "Return To Origin Initiated",
          message: `Return process started for machine ${
            machineData.machineCode
          }. Sending back from "${fromFactoryData?.factoryName}" to "${
            toFactoryData?.factoryName
          }". Initiated by ${req.user.name || "Someone"}.`,
          type: "transfer",
          createdBy: req.user._id,
          recipients,
        });

        // ------------------------------------------
      } catch (innerErr) {
        console.error(`[Return] Failed machine ${machineId}:`, innerErr);
      }
    }
    const skipped = machineIds.length - initiatedMachines.length;
    return res.status(200).json({
      message: `✅ Successfully initiated return for ${initiatedMachines.length} machine(s)`,
      initiated: initiatedMachines,
      skipped,
    });
  } catch (err) {
    console.error("[Return] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getPendingReceiveMachines = async (req, res) => {
  try {
    let query = { status: "Returned In-Progress" };

    // 🔹 যদি superadmin না হয় → শুধু নিজের factory filter হবে
    if (req.user.role !== "superadmin") {
      if (!req.user.factoryId) {
        return res.status(400).json({ error: "User factory not found" });
      }
      query.toFactory = req.user.factoryId;
    }

    // সব ট্রান্সফার খুঁজে বের করো
    const transfers = await Transfer.find(query)
      .populate("toFactory", "factoryName factoryLocation")
      .lean();

    const machineIds = transfers.map((t) => t.machineId);

    const machines = await Machine.find({ _id: { $in: machineIds } }).lean();

    // machine + transferId attach করা (frontend select করার জন্য)
    const machinesWithTransferId = machines.map((m) => {
      const t = transfers.find(
        (tr) => tr.machineId.toString() === m._id.toString(),
      );
      return {
        ...m,
        transferId: t?._id,
        toFactory: t?.toFactory || null, // superadmin UI তে দেখানোর জন্য
      };
    });

    return res.status(200).json({ machines: machinesWithTransferId });
  } catch (err) {
    console.error("[PendingReceive] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.receiveReturn = async (req, res) => {
  try {
    const { transferId } = req.body;

    if (!transferId) {
      return res.status(400).json({ error: "transferId is required" });
    }

    if (!req.user?._id) {
      return res.status(401).json({ error: "Unauthorized: user missing" });
    }

    // find transfer
    const transfer = await Transfer.findById(transferId);
    if (!transfer || transfer.status !== "Returned In-Progress") {
      return res
        .status(400)
        .json({ error: "Invalid transfer or already returned" });
    }

    // find machine
    const machine = await Machine.findById(transfer.machineId);
    if (!machine) {
      return res.status(404).json({ error: "Machine not found" });
    }

    // ✅ update transfer
    transfer.status = "Returned";
    transfer.approvedBy = req.user._id; // যে ইউজার confirm করছে
    transfer.approvedDate = new Date(); // <-- local approve time
    transfer.remarks = "Return received at origin factory";
    // transfer.receivedBy = req.user._id;
    // transfer.receivedDate = new Date();
    await transfer.save();

    // ✅ update machine
    machine.factoryId = transfer.toFactory; // origin factory
    machine.status = "In-House";

    await machine.save();
    // ------------------------------------------
    // 🔔 Notification Added (same style as returnToOriginFactory)
    // ------------------------------------------

    // Fetch machine code
    const machineData = await Machine.findById(machine._id).select(
      "machineCode",
    );

    // Fetch factory names
    const originFactory = await Factory.findById(transfer.toFactory).select(
      "factoryName",
    );
    const fromFactory = await Factory.findById(transfer.fromFactory).select(
      "factoryName",
    );
    // ----------------------------------------------------
    // 🔥 SAME RECIPIENT LOGIC AS OTHER CONTROLLERS
    // ----------------------------------------------------

    const factoryUsers = await User.find({
      factoryId: { $in: [transfer.fromFactory, transfer.toFactory] },
    }).select("_id");

    const admins = await User.find({ role: "admin" }).select("_id");

    let recipients = [
      ...factoryUsers.map((u) => u._id.toString()),
      ...admins.map((a) => a._id.toString()),
    ];

    recipients = [...new Set(recipients)];
    await NotificationService.createAndEmitNotification(req, {
      title: "Return Completed",
      message: `Machine ${
        machineData.machineCode
      } has been successfully returned from "${
        fromFactory?.factoryName
      }" to the origin factory "${originFactory?.factoryName}". Confirmed by ${
        req.user.name || "Someone"
      }.`,
      type: "transfer",
      createdBy: req.user._id,
      recipients,
      meta: {
        machineId: machine._id,
        transferId: transfer._id,
        from: transfer.fromFactory,
        to: transfer.toFactory,
      },
    });

    // ------------------------------------------
    return res.status(200).json({
      message: "✅ Return received successfully",
      machine,
      transfer,
    });
  } catch (err) {
    console.error("[ReceiveReturn] Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get all transfers
 * @route GET /api/transfers
 */
exports.getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate({
        path: "machineId",
        select:
          "machineCode machineCategory machineGroup originFactory factoryId machineNumber purchaseDate status createdBy",
        populate: [
          {
            path: "originFactory",
            select: "factoryName factoryLocation",
          },
          {
            path: "factoryId",
            select: "factoryName factoryLocation",
          },
          {
            path: "createdBy",
            select: "name email",
          },
        ],
      })
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .populate("transferedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ transferId: -1 })
      .lean();

    return res.json({ transfers });
  } catch (err) {
    console.error("Error fetching transfers:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getMachineHistory = async (req, res) => {
  try {
    // 1️⃣ সব মেশিন বের করো
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation factoryNumber")
      .populate("originFactory", "factoryName factoryLocation factoryNumber")
      .populate("createdBy", "name email")
      .sort({ machineNumber: 1 })
      .lean();

    // 2️⃣ সব ট্রান্সফার বের করো (date ASC)
    const allTransfers = await Transfer.find()
      .populate("fromFactory", "factoryName factoryLocation factoryNumber")
      .populate("toFactory", "factoryName factoryLocation factoryNumber")
      .populate("transferedBy", "name email")
      .populate("approvedBy", "name email")
      .sort({ transferDate: 1 })
      .lean();

    // 3️⃣ প্রতিটা মেশিনের history বানাও
    const machinesWithHistory = machines.map((machine) => {
      const transfers = allTransfers.filter(
        (t) => t.machineId.toString() === machine._id.toString(),
      );

      const factoryHistoryMap = {};
      const latestStatusMap = {};

      // ➤ Origin Entry
      const origin = machine.originFactory || {
        _id: null,
        factoryName: "-",
        factoryLocation: "-",
      };

      factoryHistoryMap[origin._id] = [
        {
          type: "Machine Creation",
          status: "In-House",
          factory: origin.factoryName,
          location: origin.factoryLocation,
          factoryNumber: origin.factoryNumber || "-",
          transferedBy: "-",
          date: machine.createdAt,
          remarks: "Machine Created",
          transferId: null,
          _id: null,
        },
      ];
      latestStatusMap[origin._id] = "In-House";

      // ➤ Process Transfers
      transfers.forEach((t) => {
        const fromId = t.fromFactory?._id?.toString();
        const toId = t.toFactory?._id?.toString();

        if (!factoryHistoryMap[fromId]) factoryHistoryMap[fromId] = [];
        if (!factoryHistoryMap[toId]) factoryHistoryMap[toId] = [];

        // 🔹 Return flow
        if (t.status === "Returned In-Progress") {
          factoryHistoryMap[fromId].push({
            type: "Return Initiated",
            status: "Return Initiated",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Return Initiated",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[fromId] = "Return Initiated";

          factoryHistoryMap[toId].push({
            type: "Return In-Progress",
            status: "Return In-Progress",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Return In-Progress",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[toId] = "Return In-Progress";
        } else if (t.status === "Returned") {
          factoryHistoryMap[fromId].push({
            type: "Return Dispatched",
            status: "In Return Transit",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.approvedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine returned back to origin",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[fromId] = "In Return Transit";

          factoryHistoryMap[toId].push({
            type: "Return Received",
            status: "In-House",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.approvedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Return received",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[toId] = "In-House";
        }

        // 🔹 Transfer flow
        else if (t.status === "Transfer In-Progress") {
          factoryHistoryMap[fromId].push({
            type: "Transfer Initiated",
            status: "Transfer Initiated",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[fromId] = "Transfer Initiated";

          factoryHistoryMap[toId].push({
            type: "Transfer In-Progress",
            status: "Transfer In-Progress",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Transfer In-Progress",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[toId] = "Transfer In-Progress";
        } else if (t.status === "Transferred") {
          factoryHistoryMap[fromId].push({
            type: "Transfer Out",
            status: "Transferred",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.approvedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Transfer completed from Origin",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[fromId] = "Transferred";

          factoryHistoryMap[toId].push({
            type: "Transfer In",
            status: "Borrowed",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.approvedBy?.name || "-",
            date: t.transferDate,
            remarks: "Machine Transfer received at borrowing factory",
            id: t._id,
            transferId: t.transferId,
            approvedDate: t.approvedDate,
          });
          latestStatusMap[toId] = "Borrowed";
        }
      });

      // ➤ Final history merge + sort (with priority)
      const history = Object.values(factoryHistoryMap)
        .flat()
        .sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          if (dateDiff !== 0) return dateDiff;

          // Priority order
          const priority = {
            "Machine Creation": 1,
            "Transfer Initiated": 2,
            "Transfer In-Progress": 3,
            "Transfer Out": 4,
            "Transfer In": 5,
            "Return Initiated": 6,
            "Return In-Progress": 7,
            "Return Dispatched": 8,
            "Return Received": 9,
          };

          return (priority[a.type] || 99) - (priority[b.type] || 99);
        });

      return {
        ...machine,
        history,
        factoryHistoryMap,
        latestStatusMap,
      };
    });

    return res.status(200).json({ machines: machinesWithHistory });
  } catch (err) {
    console.error("❌ Error fetching full machine history:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.getOriginFactorySummary = async (req, res) => {
  try {
    // 🔹 1. সব Factory একবারে নিয়ে map তৈরি
    const factories = await Factory.find().lean();
    const factoryMapById = {};
    factories.forEach((f) => {
      factoryMapById[f._id.toString()] = f;
    });

    // 🔹 2. Machines + populate
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation factoryNumber")
      .populate("originFactory", "factoryName factoryLocation factoryNumber")
      .lean();

    // 🔹 3. Transfers + populate
    const allTransfers = await Transfer.find()
      .populate("fromFactory", "factoryName factoryLocation factoryNumber")
      .populate("toFactory", "factoryName factoryLocation factoryNumber")
      .populate("transferedBy", "name email")
      .sort({ transferDate: 1 })
      .lean();

    const factoryMap = {};

    // ✅ Helper: ensureFactory
    const ensureFactory = (factory) => {
      if (!factory) return null;
      const id = factory._id.toString();
      if (!factoryMap[id]) {
        factoryMap[id] = {
          factoryId: id,
          factoryName: factory.factoryName || "Unknown",
          factoryLocation: factory.factoryLocation || "-",
          factoryNumber: factory.factoryNumber || "-",
          machines: [],
          totalCreated: 0,
          counts: {
            "In-House": 0,
            Transferred: 0,
            Borrowed: 0,
            "In Return Transit": 0,
            "Transfer Initiated": 0,
            "Transfer In-Progress": 0,
            "Return Initiated": 0,
            "Return In-Progress": 0,
          },
        };
      }
      return factoryMap[id];
    };

    // 🔹 4. Process Machines
    machines.forEach((machine) => {
      // ✅ Fallback to factoryMapById if populate missing
      let origin =
        machine.originFactory ||
        machine.factoryId ||
        factoryMapById[machine.originFactory?._id?.toString()] ||
        factoryMapById[machine.factoryId?._id?.toString()];

      if (!origin) return; // একদম না পেলে skip

      const originFactoryObj = ensureFactory(origin);
      originFactoryObj.totalCreated += 1;

      const transfers = allTransfers.filter(
        (t) => t.machineId?.toString() === machine._id.toString(),
      );

      const factoryHistoryMap = {};
      const latestStatusMap = {};

      // 🔹 Initial creation history
      factoryHistoryMap[origin._id] = [
        {
          type: "Machine Creation",
          status: "In-House",
          factory: origin.factoryName,
          location: origin.factoryLocation,
          factoryNumber: origin.factoryNumber || "-",
          transferedBy: "-",
          date: machine.createdAt,
          remarks: "Machine created",
          transferId: null,
          _id: null,
        },
      ];
      latestStatusMap[origin._id] = "In-House";

      // 🔹 Process transfers
      transfers.forEach((t) => {
        const fromId = t.fromFactory?._id?.toString();
        const toId = t.toFactory?._id?.toString();

        if (!factoryHistoryMap[fromId]) factoryHistoryMap[fromId] = [];
        if (!factoryHistoryMap[toId]) factoryHistoryMap[toId] = [];

        if (t.status === "Returned In-Progress") {
          factoryHistoryMap[fromId].push({
            type: "Return Initiated",
            status: "Return Initiated",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[fromId] = "Return Initiated";

          factoryHistoryMap[toId].push({
            type: "Return In-Progress",
            status: "Return In-Progress",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[toId] = "Return In-Progress";
        } else if (t.status === "Returned") {
          factoryHistoryMap[fromId].push({
            type: "Return Dispatched",
            status: "In Return Transit",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.updatedAt,
            remarks: "Machine returned back to origin",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[fromId] = "In Return Transit";

          factoryHistoryMap[toId].push({
            type: "Return Received",
            status: "In-House",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.updatedAt,
            remarks: "Return received",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[toId] = "In-House";
        } else if (t.status === "Transfer In-Progress") {
          factoryHistoryMap[fromId].push({
            type: "Transfer Initiated",
            status: "Transfer Initiated",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[fromId] = "Transfer Initiated";

          factoryHistoryMap[toId].push({
            type: "Transfer In-Progress",
            status: "Transfer In-Progress",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[toId] = "Transfer In-Progress";
        } else if (t.status === "Transferred") {
          factoryHistoryMap[fromId].push({
            type: "Transfer Out",
            status: "Transferred",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.updatedAt,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[fromId] = "Transferred";

          factoryHistoryMap[toId].push({
            type: "Transfer In",
            status: "Borrowed",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.updatedAt,
            remarks: t.remarks || "",
            transferId: t.transferId,
            _id: t._id,
          });
          latestStatusMap[toId] = "Borrowed";
        }
      });

      const machineHistory = Object.values(factoryHistoryMap)
        .flat()
        .sort((a, b) => {
          const dateDiff = new Date(a.date) - new Date(b.date);
          if (dateDiff !== 0) return dateDiff;

          const priority = {
            "Machine Creation": 1,
            "Transfer Initiated": 2,
            "Transfer In-Progress": 3,
            "Transfer Out": 4,
            "Transfer In": 5,
            "Return Initiated": 6,
            "Return In-Progress": 7,
            "Return Dispatched": 8,
            "Return Received": 9,
          };
          return (priority[a.type] || 99) - (priority[b.type] || 99);
        });

      Object.keys(latestStatusMap).forEach((fid) => {
        const status = latestStatusMap[fid];
        const fObj =
          factoryMap[fid] ||
          ensureFactory(
            factoryMapById[fid] || {
              _id: fid,
              factoryName: "-",
              factoryLocation: "-",
              factoryNumber: "-",
            },
          );

        fObj.machines.push({
          machineId: machine._id,
          machineCode: machine.machineCode,
          machineCategory: machine.machineCategory,
          machineGroup: machine.machineGroup,
          purchaseDate: machine.purchaseDate,
          machineNumber: machine.machineNumber,
          originFactory: machine.originFactory,
          currentFactory: machine.factoryId,
          finalStatus: status,
          history: machineHistory,
        });

        // ✅ Update counts per status
        if (!fObj.counts[status]) fObj.counts[status] = 0;
        fObj.counts[status] += 1;
      });
    });

    const summary = Object.values(factoryMap);
    return res.status(200).json({ summary });
  } catch (err) {
    console.error("❌ Error generating factory summary:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
