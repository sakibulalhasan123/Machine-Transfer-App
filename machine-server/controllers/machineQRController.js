const Machine = require("../models/Machine");
const generateMachineQR = require("../utils/generateMachineQR");

const getMachineQR = async (req, res) => {
  try {
    const { id } = req.params;

    const machine = await Machine.findById(id);
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    const qrCode = await generateMachineQR(machine._id);

    res.json({
      success: true,
      machineId: machine._id,
      qrCode,
    });
  } catch (err) {
    res.status(500).json({ message: "QR generation failed" });
  }
};

module.exports = { getMachineQR };
