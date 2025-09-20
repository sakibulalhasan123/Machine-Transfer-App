const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    // ✅ Current location of the machine (transfer/update hobe)
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },

    // ✅ Origin factory (creation point, never changes)
    originFactory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },

    machineCategory: {
      type: String,
      required: true,
      index: true,
    },

    machineGroup: {
      type: String,
      required: true,
    },

    machineCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Current status of the machine
    status: {
      type: String,
      enum: ["In-House", "Borrowed", "Transferred"],
      default: "In-House",
      index: true,
    },
    // Purchase Date
    purchaseDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

// Optional: always update updatedAt
machineSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Machine = mongoose.model("Machine", machineSchema);
module.exports = Machine;
