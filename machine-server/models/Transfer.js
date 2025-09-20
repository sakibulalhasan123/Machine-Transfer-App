const mongoose = require("mongoose");
const Counter = require("./Counter");

const transferSchema = new mongoose.Schema(
  {
    transferId: {
      type: String,
      unique: true,
      index: true, // SQL style auto-increment
    },
    machineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
      index: true,
    },
    fromFactory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },
    toFactory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    transferedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["Borrowed", "Transferred", "Returned"],
      default: "Transferred",
      index: true,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// 🔹 Pre-save hook: auto-generate TRN ID + default remarks
transferSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Last 2 digits of year
      const year = new Date().getFullYear().toString().slice(-2);
      const counterId = `transferId-${year}`;

      // Increment counter
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // Format TRN
      const seqNumber = String(counter.seq).padStart(5, "0");
      console.log(seqNumber);
      const transferNumber = (this.transferId = `TRN-${year}-${seqNumber}`);
      console.log(transferNumber);
      // Default remarks for Returned
      if (!this.remarks && this.status === "Returned") {
        this.remarks = "Returned to origin factory";
      }

      next();
    } catch (err) {
      console.error("🔥 Transfer pre-save error:", err);
      next(err);
    }
  } else {
    next();
  }
});

const Transfer = mongoose.model("Transfer", transferSchema);

module.exports = Transfer;
