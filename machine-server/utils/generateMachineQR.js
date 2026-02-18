const QRCode = require("qrcode");

const generateMachineQR = async (machineCode) => {
  const data = machineCode;

  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });
};

module.exports = generateMachineQR;
