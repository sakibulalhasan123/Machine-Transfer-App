const Machine = require("../models/Machine");
const generateMachineQR = require("../utils/generateMachineQR");

const getMachineQR = async (req, res) => {
  try {
    const { machineCode } = req.params; // ✅ machineCode নাও

    const machine = await Machine.findOne({ machineCode }); // ✅ machineCode দিয়ে খোঁজা
    if (!machine) {
      return res.status(404).json({ message: "Machine not found" });
    }

    const qrCode = await generateMachineQR(machine.machineCode);

    res.json({
      success: true,
      machineCode: machine.machineCode,
      qrCode,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "QR generation failed" });
  }
};

module.exports = { getMachineQR };
