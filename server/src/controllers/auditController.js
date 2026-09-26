const AuditLog = require('../models/AuditLog');
const SensorReading = require('../models/SensorReading');
const { verifyChain } = require('../utils/sha256');

/** GET /api/audit-log/:shipmentId */
async function getAuditLog(req, res, next) {
  try {
    const logs = await AuditLog.find({ shipmentId: req.params.shipmentId })
      .sort({ createdAt: -1 })
      .populate('performedBy', 'name email');
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
}

/**
 * GET /api/audit-log/:shipmentId/verify
 * Re-walks the full hash chain for a shipment.
 * Returns { valid, totalReadings, firstBadIndex }.
 */
async function verifyAuditChain(req, res, next) {
  try {
    const readings = await SensorReading
      .find({ shipmentId: req.params.shipmentId })
      .sort({ timestamp: 1 });

    const { valid, firstBadIndex } = verifyChain(readings);

    res.json({
      success: true,
      data: {
        valid,
        totalReadings: readings.length,
        firstBadIndex,
        firstBadTimestamp: firstBadIndex !== null ? readings[firstBadIndex]?.timestamp : null,
      },
    });
  } catch (err) { next(err); }
}

module.exports = { getAuditLog, verifyAuditChain };
