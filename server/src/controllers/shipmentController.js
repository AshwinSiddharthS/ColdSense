const Shipment = require('../models/Shipment');
const { validationResult } = require('express-validator');

/** GET /api/shipments */
async function getShipments(req, res, next) {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
    res.json({ success: true, data: shipments });
  } catch (err) { next(err); }
}

/** GET /api/shipments/:id */
async function getShipmentById(req, res, next) {
  try {
    const shipment = await Shipment.findOne({ shipmentId: req.params.id }).populate('createdBy', 'name email');
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
}

/** POST /api/shipments */
async function createShipment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { shipmentId, origin, destination, vaccineType, tempRange, deviceId } = req.body;
    const shipment = await Shipment.create({
      shipmentId,
      origin,
      destination,
      vaccineType,
      tempRange,
      deviceId: deviceId || null,
      createdBy: req.user.userId,
    });
    res.status(201).json({ success: true, data: shipment });
  } catch (err) { next(err); }
}

/** PATCH /api/shipments/:id */
async function updateShipment(req, res, next) {
  try {
    const allowed = ['origin', 'destination', 'vaccineType', 'tempRange', 'status', 'deviceId'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const shipment = await Shipment.findOneAndUpdate(
      { shipmentId: req.params.id },
      updates,
      { new: true, runValidators: true }
    );
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (err) { next(err); }
}

/** DELETE /api/shipments/:id  (admin only) */
async function deleteShipment(req, res, next) {
  try {
    const shipment = await Shipment.findOneAndDelete({ shipmentId: req.params.id });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, message: 'Shipment deleted' });
  } catch (err) { next(err); }
}

module.exports = { getShipments, getShipmentById, createShipment, updateShipment, deleteShipment };
