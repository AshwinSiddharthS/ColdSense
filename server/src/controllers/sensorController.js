const SensorReading = require('../models/SensorReading');
const Shipment = require('../models/Shipment');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const AuditLog = require('../models/AuditLog');
const { computeHash } = require('../utils/sha256');
const { validationResult } = require('express-validator');

/**
 * POST /api/sensor-data
 * Accepts readings from the ESP32 (or simulator).
 * Validates the device, chains the hash, checks thresholds, raises alerts.
 */
async function ingestReading(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    const { deviceId, shipmentId, temperature, humidity, gps, timestamp } = req.body;

    // 1. Check device exists and is enabled
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: 'Unknown device' });
    if (device.status === 'disabled') return res.status(403).json({ success: false, message: 'Device is disabled' });

    // 2. Update device heartbeat
    await Device.findOneAndUpdate({ deviceId }, { lastSeenAt: new Date(), status: 'online' });

    // 3. Get the last reading for this shipment to build the chain
    const lastReading = await SensorReading.findOne({ shipmentId }).sort({ timestamp: -1 });
    const previousHash = lastReading ? lastReading.currentHash : '0';

    // 4. Compute chain hash
    const ts = timestamp ? new Date(timestamp) : new Date();
    const currentHash = computeHash({ previousHash, temperature, humidity, timestamp: ts, deviceId, shipmentId });

    // 5. Save the reading
    const reading = await SensorReading.create({
      shipmentId,
      deviceId,
      temperature,
      humidity,
      gps: gps || { lat: null, lng: null },
      timestamp: ts,
      previousHash,
      currentHash,
    });

    // 6. Threshold check — raise alerts if needed
    const shipment = await Shipment.findOne({ shipmentId });
    if (shipment) {
      const alerts = [];
      const { min, max } = shipment.tempRange || {};

      if (max !== undefined && temperature > max) {
        alerts.push({ type: 'temp_high', message: `Temperature ${temperature}°C exceeds max ${max}°C`, value: temperature, threshold: max });
      } else if (min !== undefined && temperature < min) {
        alerts.push({ type: 'temp_low', message: `Temperature ${temperature}°C below min ${min}°C`, value: temperature, threshold: min });
      }

      if (humidity > 70) {
        alerts.push({ type: 'humidity_high', message: `Humidity ${humidity}% exceeds 70%`, value: humidity, threshold: 70 });
      } else if (humidity < 30) {
        alerts.push({ type: 'humidity_low', message: `Humidity ${humidity}% below 30%`, value: humidity, threshold: 30 });
      }

      if (alerts.length > 0) {
        await Alert.insertMany(alerts.map((a) => ({ ...a, shipmentId, deviceId })));
        // Update shipment status to alert
        if (shipment.status === 'in-transit') {
          await Shipment.findOneAndUpdate({ shipmentId }, { status: 'alert' });
        }
      }
    }

    // 7. Write audit log entry
    await AuditLog.create({
      shipmentId,
      action: 'sensor_reading',
      details: { temperature, humidity, currentHash },
      hash: currentHash,
    });

    res.status(201).json({ success: true, data: reading });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sensor-data/:shipmentId
 * Query params: from, to (ISO dates), latest=true
 */
async function getReadings(req, res, next) {
  try {
    const { shipmentId } = req.params;
    const { from, to, latest } = req.query;

    if (latest === 'true') {
      const reading = await SensorReading.findOne({ shipmentId }).sort({ timestamp: -1 });
      return res.json({ success: true, data: reading });
    }

    const filter = { shipmentId };
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to)   filter.timestamp.$lte = new Date(to);
    }

    const readings = await SensorReading.find(filter).sort({ timestamp: 1 });
    res.json({ success: true, data: readings });
  } catch (err) {
    next(err);
  }
}

module.exports = { ingestReading, getReadings };
