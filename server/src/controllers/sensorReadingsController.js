const readingRepository = require('../repositories/readingRepository');
const Device = require('../models/Device');
const mongoose = require('mongoose');

/**
 * Ingest a sensor reading from an ESP32 device.
 * POST /api/sensors/readings
 */
async function ingestReading(req, res, next) {
  try {
    const { deviceId, temperature, humidity } = req.sanitizedReading || req.body;

    // Server-authoritative timestamp in UTC ISO 8601
    const serverTimestamp = new Date().toISOString();

    // Persist reading
    const saved = await readingRepository.save({
      deviceId,
      temperature,
      humidity,
      timestamp: serverTimestamp,
    });

    // Best-effort update of device heartbeat if Mongoose is connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      Device.findOneAndUpdate(
        { deviceId: deviceId.toUpperCase() },
        { lastSeenAt: new Date(serverTimestamp), status: 'online' }
      ).catch((err) => {
        // Device might not be pre-registered in DB yet; log and proceed safely
        console.debug('[INGEST] Device heartbeat update skipped:', err.message);
      });
    }

    return res.status(201).json({
      message: 'Reading received',
      reading: {
        id: saved.id,
        deviceId: saved.deviceId,
        temperature: saved.temperature,
        humidity: saved.humidity,
        timestamp: saved.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve the latest sensor reading, optionally filtered by deviceId.
 * GET /api/sensors/readings/latest?deviceId=...
 */
async function getLatestReading(req, res, next) {
  try {
    const { deviceId } = req.query;
    const reading = await readingRepository.findLatest({ deviceId });

    if (!reading) {
      const msg = deviceId
        ? `No reading found for device: ${deviceId}`
        : 'No readings found in the database';
      return res.status(404).json({
        message: msg,
        reading: null,
      });
    }

    return res.status(200).json({
      reading: {
        id: reading.id,
        deviceId: reading.deviceId,
        temperature: reading.temperature,
        humidity: reading.humidity,
        timestamp: reading.timestamp,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieve paginated historical sensor readings with optional filters.
 * GET /api/sensors/readings?deviceId=...&from=...&to=...&page=...&limit=...
 */
async function getReadingsHistory(req, res, next) {
  try {
    const { deviceId, from, to, page = 1, limit = 20, sort = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    const result = await readingRepository.findHistory({
      deviceId,
      from,
      to,
      page: pageNum,
      limit: limitNum,
      sort,
    });

    const totalPages = Math.ceil(result.total / limitNum);

    return res.status(200).json({
      readings: result.readings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ingestReading,
  getLatestReading,
  getReadingsHistory,
};
