// // const mongoose = require("mongoose");
// // const Machine = require("../models/Machine");
// // const Transfer = require("../models/Transfer");
// // const Maintenance = require("../models/Maintenance");
// // const MachineIdle = require("../models/MachineIdle");

// // const getMachineLiveStatus = async (req, res) => {
// //   try {
// //     const { id } = req.params;

// //     // ✅ Validate ID
// //     if (!id || !mongoose.Types.ObjectId.isValid(id)) {
// //       return res.status(400).json({ message: "Invalid or missing machine ID" });
// //     }

// //     const machine = await Machine.findById(id)
// //       .populate("factoryId", "factoryName")
// //       .lean();

// //     if (!machine) {
// //       return res.status(404).json({ message: "Machine not found" });
// //     }

// //     const [transfer, maintenance, idle] = await Promise.all([
// //       Transfer.findOne({ machineId: id, status: { $ne: "Completed" } }),
// //       Maintenance.findOne({ machineId: id, status: { $ne: "Completed" } }),
// //       MachineIdle.findOne({ machineId: id, status: { $ne: "Completed" } }),
// //     ]);

// //     let liveStatus = "In-House";
// //     let referenceId = null;

// //     if (transfer) {
// //       liveStatus = "Transfer";
// //       referenceId = transfer.transferId;
// //     } else if (maintenance) {
// //       liveStatus = "Maintenance";
// //       referenceId = maintenance.maintenanceId;
// //     } else if (idle) {
// //       liveStatus = "Idle";
// //       referenceId = idle.idleId;
// //     }

// //     res.json({
// //       machine,
// //       liveStatus,
// //       referenceId,
// //     });
// //   } catch (error) {
// //     console.error("Live status error:", error);
// //     res.status(500).json({
// //       message: "Failed to get machine live status",
// //     });
// //   }
// // };

// // module.exports = { getMachineLiveStatus };

// const mongoose = require("mongoose");
// const Machine = require("../models/Machine");
// const Transfer = require("../models/Transfer");
// const Maintenance = require("../models/Maintenance");
// const MachineIdle = require("../models/MachineIdle");

// const getMachineLiveStatus = async (req, res) => {
//   try {
//     const { machineCode } = req.params; // ✅ machineCode নাও

//     if (!machineCode) {
//       return res.status(400).json({ message: "Missing machine code" });
//     }

//     const machine = await Machine.findOne({ machineCode })
//       .populate("factoryId", "factoryName")
//       .populate("originFactory", "factoryName")
//       .lean();

//     if (!machine) {
//       return res.status(404).json({ message: "Machine not found" });
//     }

//     const [transfer, maintenance, idle] = await Promise.all([
//       Transfer.findOne({
//         machineId: machine._id,
//         status: {
//           $in: ["Transfer In-Progress", "Transferred", "Returned In-Progress"],
//         },
//       }).sort({ createdAt: -1 }),

//       Maintenance.findOne({
//         machineId: machine._id,
//         status: { $ne: "Maintenance Completed" },
//       }).sort({ createdAt: -1 }),

//       MachineIdle.findOne({
//         machineId: machine._id,
//         status: { $ne: "Resolved" },
//       }).sort({ createdAt: -1 }),
//     ]);

//     let liveStatus = "In-House";
//     let referenceId = null;

//     if (transfer && transfer.status === "Transfer In-Progress") {
//       liveStatus = transfer.status;
//       referenceId = transfer.transferId;
//     } else if (transfer && maintenance && transfer.status === "Transferred") {
//       liveStatus = transfer.status;
//       referenceId = transfer.transferId;
//     } else if (transfer && transfer.status === "Returned In-Progress") {
//       liveStatus = transfer.status;
//       referenceId = transfer.transferId;
//     } else if (maintenance) {
//       liveStatus = "Maintenance In-Progress";
//       referenceId = maintenance.maintenanceId;
//     } else if (idle) {
//       liveStatus = "Machine Idle In-Progress";
//       referenceId = idle.idleId;
//     }

//     res.json({
//       machine,
//       liveStatus,
//       referenceId,
//     });
//   } catch (error) {
//     console.error("Live status error:", error);
//     res.status(500).json({
//       message: "Failed to get machine live status",
//     });
//   }
// };

// module.exports = { getMachineLiveStatus };

const mongoose = require("mongoose");
const Machine = require("../models/Machine");
const Transfer = require("../models/Transfer");
const Maintenance = require("../models/Maintenance");
const MachineIdle = require("../models/MachineIdle");

const getMachineLiveStatus = async (req, res) => {
  try {
    const { machineCode } = req.params;

    if (!machineCode) {
      return res.status(400).json({ message: "Missing machine code" });
    }

    const machine = await Machine.findOne({ machineCode })
      .populate("factoryId", "factoryName")
      .populate("originFactory", "factoryName")
      .lean();

    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    const [transfer, maintenance, idle] = await Promise.all([
      Transfer.findOne({
        machineId: machine._id,
        status: {
          $in: [
            "Transfer In-Progress",
            "Transferred",
            "Returned In-Progress",
            "Returned",
          ],
        },
      }).sort({ createdAt: -1 }),

      Maintenance.findOne({
        machineId: machine._id,
        status: { $ne: "Maintenance Completed" },
      }).sort({ createdAt: -1 }),

      MachineIdle.findOne({
        machineId: machine._id,
        status: { $ne: "Resolved" },
      }).sort({ createdAt: -1 }),
    ]);

    // ✅ Multiple live statuses support
    let liveStatuses = [];
    let referenceIds = [];

    // Transfer
    if (transfer) {
      if (
        ["Transfer In-Progress", "Returned In-Progress"].includes(
          transfer.status,
        )
      ) {
        liveStatuses.push(transfer.status);
        referenceIds.push({ type: "Transfer", id: transfer.transferId });
      } else if (transfer.status === "Returned") {
        // Returned transfer = machine back in house
        liveStatuses.push("In-House");
        referenceIds.push(null);
      } else if (transfer.status === "Transferred" && !maintenance && !idle) {
        // Transfer finished + no active process
        liveStatuses.push("Transferred");
        referenceIds.push({ type: "Transfer", id: transfer.transferId });
      }
    }

    // Maintenance
    if (maintenance) {
      liveStatuses.push("Maintenance In-Progress");
      referenceIds.push({ type: "Maintenance", id: maintenance.maintenanceId });
    }

    // Idle
    if (idle) {
      liveStatuses.push("Machine Idle In-Progress");
      referenceIds.push({ type: "Idle", id: idle.idleId });
    }
    // যদি কোন active status না থাকে
    if (liveStatuses.length === 0) {
      liveStatuses.push("In-House");
      referenceIds.push(null);
    }
    // Response
    res.json({
      machine,
      liveStatuses,
      referenceIds,
    });
  } catch (error) {
    console.error("Live status error:", error);
    res.status(500).json({
      message: "Failed to get machine live status",
    });
  }
};
module.exports = { getMachineLiveStatus };
