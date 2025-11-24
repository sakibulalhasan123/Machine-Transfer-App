const mongoose = require("mongoose");
const Counter = require("./Counter"); // optional if you want auto ID

const machineIdleSchema = new mongoose.Schema(
  {
    idleId: {
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

    reason: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      default: null,
      index: true,
    },

    durationMinutes: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Machine Idle In-Progress", "Resolved"],
      default: "Machine Idle In-Progress",
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // History of status changes
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

// 🔹 Auto-generate Idle ID (optional, similar to Maintenance)
machineIdleSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const counterId = `idleId-${year}`;

      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const seqNumber = String(counter.seq).padStart(5, "0");
      this.idleId = `IDL-${year}-${seqNumber}`;
    } catch (err) {
      console.error("🔥 MachineIdle pre-save error:", err);
      next(err);
    }
  }
  next();
});

// 🔹 Calculate duration automatically before save if endTime exists
machineIdleSchema.pre("save", function (next) {
  if (this.endTime) {
    const diff = this.endTime - this.startTime;
    this.durationMinutes = Math.round(diff / (1000 * 60));
  }
  next();
});

const MachineIdle = mongoose.model("MachineIdle", machineIdleSchema);

module.exports = MachineIdle;
