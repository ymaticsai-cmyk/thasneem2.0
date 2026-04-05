const PDFDocument = require('pdfkit');

function buildPrescriptionPdfBuffer({
  hospitalName = 'CITY HEALTH HOSPITAL',
  doctorName,
  specialty,
  regNo,
  dateStr,
  patientName,
  patientId,
  age,
  bloodGroup,
  medicines,
  notes,
  nextVisit,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(hospitalName, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .text(`Dr. ${doctorName || '—'} | ${specialty || 'General'}`, { align: 'center' });
    doc.text(`Date: ${dateStr} | Reg No: ${regNo || '—'}`, { align: 'center' });
    doc.moveTo(50, doc.y + 8).lineTo(545, doc.y + 8).stroke();
    doc.moveDown(1);

    doc.fontSize(11).text(`PATIENT: ${patientName} | ID: ${patientId}`);
    doc.text(`Age: ${age ?? '—'} | Blood: ${bloodGroup ?? '—'}`);
    doc.moveDown(0.8);
    doc.fontSize(12).text('Rx', { underline: true });
    doc.moveDown(0.3);

    (medicines || []).forEach((m, i) => {
      doc
        .fontSize(10)
        .text(
          `${i + 1}. ${m.medicine || '—'} ${m.dosage || ''}`,
          { continued: false }
        );
      doc.text(
        `   ${m.frequency || '—'} | ${m.duration || '—'}`,
        { indent: 12 }
      );
      doc.moveDown(0.3);
    });

    doc.moveDown(0.5);
    doc.text(`Notes: ${notes || '—'}`);
    doc.text(`Next Visit: ${nextVisit || '—'}`);
    doc.moveDown(2);
    doc.text('Digital Signature', { align: 'right' });

    doc.end();
  });
}

module.exports = { buildPrescriptionPdfBuffer };
