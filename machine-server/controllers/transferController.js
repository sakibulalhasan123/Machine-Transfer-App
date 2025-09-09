const Transfer = require("../models/Transfer");
const Machine = require("../models/Machine");

/**
 * Get all machines of a factory
 * @route GET /api/factories/:factoryId/machines
 */
exports.getMachinesByFactory = async (req, res) => {
  try {
    const { factoryId } = req.params;

    // ✅ Fetch machines where 'factory' field matches
    const machines = await Machine.find({ factoryId: factoryId });

    // Always return JSON (even if empty)
    return res.json({ machines });
  } catch (error) {
    console.error("Error fetching machines:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Transfer one or multiple machines from one factory to another
 * @route POST /api/transfers
 * @body { fromFactory, toFactory, machineIds }
 */
exports.createTransfer = async (req, res) => {
  try {
    const { fromFactory, toFactory, machineIds } = req.body;

    if (!fromFactory || !toFactory || !machineIds?.length) {
      return res.status(400).json({
        error: "fromFactory, toFactory, and machineIds are required",
      });
    }

    // Create Transfer records
    const transfers = await Promise.all(
      machineIds.map((machineId) =>
        Transfer.create({
          machineId,
          fromFactory,
          toFactory,
          transferedBy: req.user._id, // logged-in user ID
          transferDate: new Date(),
        })
      )
    );

    // ✅ Update the machines' current factory
    await Machine.updateMany(
      { _id: { $in: machineIds } },
      { $set: { factoryId: toFactory } } // <-- fixed
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
 * Get transfer history
 * @route GET /api/transfers
 */
exports.getTransfers = async (req, res) => {
  try {
    const transfers = await Transfer.find()
      .populate("machineId", "machineCode machineCategory")
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .sort({ createdAt: -1 });

    return res.json({ transfers });
  } catch (error) {
    console.error("Error fetching transfers:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

/**
 * Get machine transfer history
 * @route GET /api/transfer/transfer-history
 */
exports.getTransferHistory = async (req, res) => {
  try {
    // Fetch all machines
    const machines = await Machine.find()
      .populate("factoryId", "factoryName factoryLocation")
      .lean();

    // Fetch all transfers
    const transfers = await Transfer.find()
      .populate("fromFactory", "factoryName factoryLocation")
      .populate("toFactory", "factoryName factoryLocation")
      .populate(
        "machineId",
        "machineCode machineCategory machineGroup factoryId"
      )
      .populate("transferedBy", "name email") // populate the user who transferred
      .sort({ transferDate: -1 })
      .lean();

    // Map transfers to machines
    const machineMap = machines.map((m) => {
      const machineTransfers = transfers.filter(
        (t) => t.machineId._id.toString() === m._id.toString()
      );
      return {
        ...m,
        transfers: machineTransfers,
      };
    });

    res.json(machineMap);
  } catch (err) {
    console.error("Error fetching transfer history:", err);
    res.status(500).json({ message: "Server error" });
  }
};
