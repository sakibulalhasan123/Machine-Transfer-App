const mongoose = require("mongoose");
const Counter = require("./Counter");

const maintenanceSchema = new mongoose.Schema(
  {
    maintenanceId: {
      type: String,
      unique: true,
      index: true,
    },

    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
      index: true,
    },

    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },

    maintenanceType: {
      type: String,
      enum: [
        "Preventive",
        "Corrective",
        "Breakdown",
        "Inspection",
        "Calibration",
      ],
      required: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ Spare parts: শুধুমাত্র নাম
    spareParts: [
      {
        type: String, // শুধু partName
        required: true,
      },
    ],
    maintenanceDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["In-Progress", "Completed"],
      default: "In-Progress",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // 🔹 History field
    history: [
      {
        previousStatus: String,
        newStatus: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// 🔹 Auto-generate Maintenance ID
maintenanceSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const counterId = `maintenanceId-${year}`;

      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const seqNumber = String(counter.seq).padStart(5, "0");
      this.maintenanceId = `MTN-${year}-${seqNumber}`;
    } catch (err) {
      console.error("🔥 Maintenance pre-save error:", err);
      next(err);
    }
  }
  next();
});

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

module.exports = Maintenance;
