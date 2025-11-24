const mongoose = require("mongoose");
const Counter = require("./Counter");
const machineSchema = new mongoose.Schema(
  {
    factoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Factory",
      required: true,
      index: true,
    },

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

    status: {
      type: String,
      enum: [
        "In-House",
        "Transfer Initiated",
        "Borrowed",
        "Return Initiated",
        "Maintenance In-Progress",
        "Machine Idle In-Progress",
      ],
      default: "In-House",
      index: true,
    },

    purchaseDate: {
      type: Date,
      required: false,
    },

    machineNumber: {
      type: String,
      unique: true,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

const Machine = mongoose.model("Machine", machineSchema);
module.exports = Machine;
