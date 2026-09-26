const SensorReading = require('../models/SensorReading');
const Shipment = require('../models/Shipment');
const Alert = require('../models/Alert');

/**
 * GET /api/reports/:shipmentId/csv
 * Streams a CSV of all sensor readings for the shipment.
 */
async function downloadCSV(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const readings = await SensorReading.find({ shipmentId }).sort({ timestamp: 1 });

    // Build CSV manually — no external lib needed for simple cases
    const headers = ['timestamp', 'temperature', 'humidity', 'lat', 'lng', 'currentHash'];
    const rows = readings.map((r) => [
      new Date(r.timestamp).toISOString(),
      r.temperature,
      r.humidity,
      r.gps?.lat ?? '',
      r.gps?.lng ?? '',
      r.currentHash,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${shipmentId}-report.csv"`);
    res.send(csvContent);
  } catch (err) { next(err); }
}

/**
 * GET /api/reports/:shipmentId/pdf
 * Generates a PDF summary using pdfkit and streams it.
 */
async function downloadPDF(req, res, next) {
  try {
    const PDFDocument = require('pdfkit');
    const { shipmentId } = req.params;

    const [shipment, readings, alerts] = await Promise.all([
      Shipment.findOne({ shipmentId }),
      SensorReading.find({ shipmentId }).sort({ timestamp: 1 }),
      Alert.find({ shipmentId }).sort({ createdAt: -1 }),
    ]);

    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${shipmentId}-report.pdf"`);
    doc.pipe(res);

    // ── Title ─────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text('Cold Chain Shipment Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Shipment Details ──────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('Shipment Details');
    doc.moveDown(0.4);
    const details = [
      ['Shipment ID', shipment.shipmentId],
      ['Vaccine Type', shipment.vaccineType],
      ['Origin', shipment.origin],
      ['Destination', shipment.destination],
      ['Status', shipment.status],
      ['Temp Range', `${shipment.tempRange.min}°C – ${shipment.tempRange.max}°C`],
      ['Device ID', shipment.deviceId || '—'],
      ['Created At', new Date(shipment.createdAt).toLocaleString()],
    ];
    details.forEach(([k, v]) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${k}: `, { continued: true }).font('Helvetica').text(v);
    });
    doc.moveDown(1.5);

    // ── Sensor Summary ────────────────────────────────────────
    if (readings.length > 0) {
      const temps = readings.map((r) => r.temperature);
      const hums  = readings.map((r) => r.humidity);
      doc.fontSize(14).font('Helvetica-Bold').text('Sensor Summary');
      doc.moveDown(0.4);
      [
        ['Total Readings', readings.length],
        ['Temp Min / Max / Avg', `${Math.min(...temps)}°C / ${Math.max(...temps)}°C / ${(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)}°C`],
        ['Humidity Min / Max / Avg', `${Math.min(...hums)}% / ${Math.max(...hums)}% / ${(hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1)}%`],
        ['First Reading', new Date(readings[0].timestamp).toLocaleString()],
        ['Last Reading', new Date(readings[readings.length - 1].timestamp).toLocaleString()],
      ].forEach(([k, v]) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${k}: `, { continued: true }).font('Helvetica').text(String(v));
      });
      doc.moveDown(1.5);
    }

    // ── Alerts ────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').text('Alerts');
    doc.moveDown(0.4);
    if (alerts.length === 0) {
      doc.fontSize(10).font('Helvetica').text('No alerts for this shipment.');
    } else {
      alerts.forEach((a, i) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${i + 1}. [${a.type.toUpperCase()}] `, { continued: true })
          .font('Helvetica').text(`${a.message} — ${new Date(a.createdAt).toLocaleString()} ${a.resolved ? '(Resolved)' : '(Open)'}`);
      });
    }

    doc.end();
  } catch (err) { next(err); }
}

module.exports = { downloadCSV, downloadPDF };
