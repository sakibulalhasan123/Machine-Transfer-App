const Factory = require("../models/Factory");
const Machine = require("../models/Machine");
const Transfer = require("../models/Transfer");
const Maintenance = require("../models/Maintenance");
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
/**
 * Create Transfer
 * Rule: A → B transfer er por B theke onno factory te transfer kora jabe na
 * jokhon porjonto machine return hoy A te
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

    // Check if machines are already borrowed
    const blockedMachines = await Promise.all(
      machineIds.map(async (machineId) => {
        const lastTransfer = await Transfer.findOne({ machineId })
          .sort({ transferDate: -1 })
          .lean();
        if (lastTransfer && lastTransfer.status !== "Returned")
          return machineId;
        return null;
      })
    );
    const blocked = blockedMachines.filter(Boolean);
    if (blocked.length)
      return res.status(400).json({
        error: `Cannot transfer machine(s) [${blocked.join(
          ", "
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
          status: "Transferred",
          remarks: remarks || "",
        })
      )
    );

    // Update machines
    await Machine.updateMany(
      { _id: { $in: machineIds } },
      { $set: { factoryId: toFactory, status: "Borrowed" } }
    );

    return res.status(201).json({
      message: "Transfer(s) completed successfully",
      transfers,
    });
  } catch (error) {
    console.error("Error creating transfer:", error);
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

    const returnedMachines = [];

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
          status: "Returned",
          transferedBy: req.user._id,
          transferDate: new Date(),
          remarks: "Returned to origin factory",
        });

        await returnTransfer.save();

        // Machine update
        machine.factoryId = originFactory;
        machine.status = "In-House";
        await machine.save();

        returnedMachines.push(machine);
      } catch (innerErr) {
        console.error(`[Return] Failed machine ${machineId}:`, innerErr);
      }
    }
    const skipped = machineIds.length - returnedMachines.length;
    return res.status(200).json({
      message: `✅ Successfully returned ${returnedMachines.length} machine(s)`,
      returned: returnedMachines,
      skipped,
    });
  } catch (err) {
    console.error("[Return] Error:", err);
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
        select: "machineCode machineCategory machineGroup originFactory",
        populate: {
          path: "originFactory",
          select: "factoryName factoryLocation",
        },
      })
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .populate("transferedBy", "name email")
      .sort({ transferDate: -1 })
      .lean();

    return res.json({ transfers });
  } catch (err) {
    console.error("Error fetching transfers:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get full machine history with factory-aware + return-aware status
 * @route GET /api/transfers/machine/history
 */
exports.getMachineHistory = async (req, res) => {
  try {
    // 1️⃣ সব মেশিন বের করো
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation")
      .populate("originFactory", "factoryName factoryLocation")
      .lean();

    // 2️⃣ সব ট্রান্সফার বের করো (date ASC)
    const allTransfers = await Transfer.find()
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .populate("transferedBy", "name email")
      .sort({ transferDate: 1 })
      .lean();

    // 3️⃣ প্রতিটা মেশিনের history বানাও
    const machinesWithHistory = machines.map((machine) => {
      const transfers = allTransfers.filter(
        (t) => t.machineId.toString() === machine._id.toString()
      );

      const factoryHistoryMap = {};
      const latestStatusMap = {};

      // ➤ Origin Entry
      const origin = machine.originFactory || {
        _id: machine._id,
        factoryName: "-",
        factoryLocation: "-",
      };

      factoryHistoryMap[origin._id] = [
        {
          type: "Creation",
          status: "In-House",
          factory: origin.factoryName,
          location: origin.factoryLocation,
          transferedBy: "-",
          date: machine.createdAt,
          remarks: "Machine created",
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

        // 🔹 যদি return transfer হয় → Return Dispatched + Return Received add করো
        if (t.status === "Returned") {
          factoryHistoryMap[fromId].push({
            type: "Return Dispatched",
            status: "In Return Transit",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.updatedAt,
            remarks: "Machine returned back to origin",
            transferId: t.transferId || null,
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
            transferId: t.transferId || null,
            _id: t._id,
          });
          latestStatusMap[toId] = "In-House";
        } else {
          // 🔹 Normal Transfer হলে Transfer Out + Transfer In add করো
          factoryHistoryMap[fromId].push({
            type: "Transfer Out",
            status: "Transferred",
            factory: t.fromFactory?.factoryName || "-",
            location: t.fromFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId || null,
            _id: t._id,
          });
          latestStatusMap[fromId] = "Transferred";

          factoryHistoryMap[toId].push({
            type: "Transfer In",
            status: "Borrowed",
            factory: t.toFactory?.factoryName || "-",
            location: t.toFactory?.factoryLocation || "-",
            transferedBy: t.transferedBy?.name || "-",
            date: t.transferDate,
            remarks: t.remarks || "",
            transferId: t.transferId || null,
            _id: t._id,
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

          // Priority order if same date
          const priority = {
            Creation: 1,
            "Transfer Out": 2,
            "Transfer In": 3,
            "Return Dispatched": 4,
            "Return Received": 5,
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

/**
 * Get full machine transaction history grouped by factory with counts
 * @route GET /api/transfers/reports/origin-factory-summary
 */
exports.getOriginFactorySummary = async (req, res) => {
  try {
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation")
      .populate("originFactory", "factoryName factoryLocation")
      .lean();

    const allTransfers = await Transfer.find()
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .populate("transferedBy", "name email")
      .sort({ transferDate: 1 })
      .lean();

    // --- Collect all known factories ---
    const allFactories = {};
    machines.forEach((m) => {
      if (m.factoryId?._id)
        allFactories[m.factoryId._id.toString()] = m.factoryId;
      if (m.originFactory?._id)
        allFactories[m.originFactory._id.toString()] = m.originFactory;
    });
    allTransfers.forEach((t) => {
      if (t.fromFactory?._id)
        allFactories[t.fromFactory._id.toString()] = t.fromFactory;
      if (t.toFactory?._id)
        allFactories[t.toFactory._id.toString()] = t.toFactory;
    });

    // --- Factory map store ---
    const factoryMap = {};
    const ensureFactory = (factory) => {
      if (!factoryMap[factory._id]) {
        factoryMap[factory._id] = {
          factoryId: factory._id,
          factoryName: factory.factoryName || "Unknown",
          factoryLocation: factory.factoryLocation || "-",
          totalCreated: 0,
          counts: {
            "In-House": 0,
            Transferred: 0,
            Borrowed: 0,
            "In Return Transit": 0,
          },
          machines: [],
        };
      }
      return factoryMap[factory._id];
    };

    const getFactoryInfo = (factory, fallbackId) => {
      if (factory && factory._id) return factory;
      if (fallbackId && allFactories[fallbackId.toString()])
        return allFactories[fallbackId.toString()];
      return {
        _id: fallbackId || "unknown",
        factoryName: "Unknown",
        factoryLocation: "-",
      };
    };

    // --- Process all machines ---
    machines.forEach((machine) => {
      const originFactory = machine.originFactory || machine.factoryId;
      const originEntry = ensureFactory(originFactory);
      originEntry.totalCreated += 1;

      const transfers = allTransfers.filter(
        (t) => t.machineId?.toString() === machine._id.toString()
      );

      const history = [
        {
          type: "Creation",
          status: "In-House",
          factory: originFactory,
          date: machine.createdAt,
          remarks: "Machine created at origin factory",
          _id: null,
        },
      ];

      const factoryStatusMap = {};
      factoryStatusMap[originFactory._id] = "In-House";

      transfers.forEach((t) => {
        const fromFactory = getFactoryInfo(t.fromFactory, t.fromFactoryId);
        const toFactory = getFactoryInfo(t.toFactory, t.toFactoryId);
        const fromId = fromFactory._id.toString();
        const toId = toFactory._id.toString();

        // --- Handle Returned ---
        if (t.status && t.status.toLowerCase() === "returned") {
          history.push({
            type: "Return Dispatched",
            status: "In Return Transit",
            factory: fromFactory,
            date: t.updatedAt,
            transferedBy: t.transferedBy?.name || "-",
            remarks: "Machine returned back to origin",
            _id: t._id,
          });
          factoryStatusMap[fromId] = "In Return Transit";

          history.push({
            type: "Return Received",
            status: "In-House",
            factory: toFactory,
            date: t.updatedAt,
            transferedBy: t.transferedBy?.name || "-",
            remarks: "Machine returned to origin factory",
            _id: t._id,
          });
          factoryStatusMap[toId] = "In-House";
        } else {
          // --- Normal Transfer ---
          history.push({
            type: "Transfer Out",
            status: "Transferred",
            factory: fromFactory,
            date: t.transferDate,
            transferedBy: t.transferedBy?.name || "-",
            remarks: t.remarks || "",
            _id: t._id,
          });
          factoryStatusMap[fromId] = "Transferred";

          history.push({
            type: "Transfer In",
            status: "Borrowed",
            factory: toFactory,
            date: t.transferDate,
            transferedBy: t.transferedBy?.name || "-",
            remarks: t.remarks || "",
            _id: t._id,
          });
          factoryStatusMap[toId] = "Borrowed";
        }
      });

      // --- Update counts per factory ---
      Object.keys(factoryStatusMap).forEach((fid) => {
        const status = factoryStatusMap[fid];
        const fObj = getFactoryInfo(null, fid);
        const fEntry = ensureFactory(fObj);

        fEntry.counts[status] = (fEntry.counts[status] || 0) + 1;
        fEntry.machines.push({
          machineId: machine._id,
          machineCode: machine.machineCode,
          machineCategory: machine.machineCategory,
          machineGroup: machine.machineGroup,
          finalStatus: status,
          history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
        });
      });
    });

    const summary = Object.values(factoryMap);
    return res.status(200).json({ summary });
  } catch (err) {
    console.error("❌ Error generating factory summary:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
