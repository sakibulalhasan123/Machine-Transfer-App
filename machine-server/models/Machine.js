const mongoose = require("mongoose");

const machineSchema = new mongoose.Schema(
  {
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true, // current factory
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
  },
  { timestamps: true }
);

const Machine = mongoose.model("Machine", machineSchema);
module.exports = Machine;
