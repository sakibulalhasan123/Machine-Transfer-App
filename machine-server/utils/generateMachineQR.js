const QRCode = require("qrcode");

const generateMachineQR = async (machineId) => {
  const data = `${process.env.FRONTEND_URL}/machines-details/${machineId}`;

  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });
};

module.exports = generateMachineQR;
