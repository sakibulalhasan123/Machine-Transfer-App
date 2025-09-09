const mongoose = require("mongoose");

const factorySchema = new mongoose.Schema(
  {
    factoryName: {
      type: String,
      required: true,
      trim: true,
    },
    factoryLocation: {
      type: String,
      required: true,
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

const Factory = mongoose.model("Factory", factorySchema);

module.exports = Factory;
