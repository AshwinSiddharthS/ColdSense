const Device = require('../models/Device');
const { validationResult } = require('express-validator');

/** GET /api/devices */
async function getDevices(req, res, next) {
  try {
    const devices = await Device.find().sort({ createdAt: -1 });
    res.json({ success: true, data: devices });
  } catch (err) { next(err); }
}

/** GET /api/devices/:id/status */
async function getDeviceStatus(req, res, next) {
  try {
    const device = await Device.findOne({ deviceId: req.params.id });
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    const online = device.lastSeenAt
      ? (Date.now() - device.lastSeenAt.getTime()) < 2 * 60 * 1000
      : false;
    res.json({ success: true, data: { ...device.toObject(), isOnline: online } });
  } catch (err) { next(err); }
}

/** POST /api/devices  (admin only) */
async function createDevice(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { deviceId, name } = req.body;
    const device = await Device.create({ deviceId, name });
    res.status(201).json({ success: true, data: device });
  } catch (err) { next(err); }
}

/** PATCH /api/devices/:id  (enable/disable, rename) */
async function updateDevice(req, res, next) {
  try {
    const allowed = ['name', 'status', 'assignedShipmentId'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const device = await Device.findOneAndUpdate(
      { deviceId: req.params.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!device) return res.status(404).json({ success: false, message: 'Device not found' });
    res.json({ success: true, data: device });
  } catch (err) { next(err); }
}

module.exports = { getDevices, getDeviceStatus, createDevice, updateDevice };
