const QRCode = require('qrcode');

async function generatePatientQrDataUrl(payload) {
  const text = JSON.stringify(payload);
  return QRCode.toDataURL(text, { width: 320, margin: 2 });
}

module.exports = { generatePatientQrDataUrl };
