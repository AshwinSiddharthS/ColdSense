const Alert = require('../models/Alert');

/** GET /api/alerts  (optional ?shipmentId=, ?resolved=false) */
async function getAlerts(req, res, next) {
  try {
    const filter = {};
    if (req.query.shipmentId) filter.shipmentId = req.query.shipmentId;
    if (req.query.resolved !== undefined) filter.resolved = req.query.resolved === 'true';

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
}

/** PATCH /api/alerts/:id  — mark resolved */
async function resolveAlert(req, res, next) {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date(), resolvedBy: req.user.userId },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
}

module.exports = { getAlerts, resolveAlert };
