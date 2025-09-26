const mongoose = require("mongoose");
const Counter = require("./Counter");
const factorySchema = new mongoose.Schema(
  {
    factoryName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    factoryLocation: {
      type: String,
      required: true,
      trim: true,
    },
    factoryNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);
// 🔹 Pre-save hook: auto-generate Factory Code + default remarks
factorySchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Last 2 digits of year
      const year = new Date().getFullYear().toString().slice(-2);
      const counterId = `factoryId-${year}`;

      // Increment counter
      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      // Format factory code: FAC-23-00001
      const seqNumber = String(counter.seq).padStart(5, "0");
      this.factoryNumber = `FAC-${year}-${seqNumber}`;

      next();
    } catch (err) {
      console.error("🔥 Factory pre-save error:", err);
      next(err);
    }
  } else {
    next();
  }
});
const Factory = mongoose.model("Factory", factorySchema);

module.exports = Factory;
