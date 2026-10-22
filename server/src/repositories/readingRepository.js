const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const SensorReading = require('../models/SensorReading');

// Persistent storage file path for local/offline fallback
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'readings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[REPO] Error creating data directory:', err.message);
  }
}

/**
 * Reads local persistent file synchronously.
 * @returns {Array} Array of reading records
 */
function readLocalFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('[REPO] Error reading data file:', err.message);
    return [];
  }
}

/**
 * Writes array of readings to local persistent file atomically.
 * @param {Array} records 
 */
function writeLocalFile(records) {
  try {
    const tempFile = `${DATA_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(records, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('[REPO] Error writing data file:', err.message);
  }
}

const readingRepository = {
  /**
   * Save a new sensor reading.
   * @param {Object} data - { deviceId, temperature, humidity, [timestamp], [id] }
   * @returns {Promise<Object>} Created reading
   */
  async save(data) {
    const id = data.id || crypto.randomUUID();
    const timestamp = data.timestamp || new Date().toISOString();

    const readingRecord = {
      id,
      deviceId: String(data.deviceId).trim(),
      temperature: Number(data.temperature),
      humidity: Number(data.humidity),
      timestamp,
    };

    // 1. Persist to local disk JSON file (guarantees durability across restarts)
    const localRecords = readLocalFile();
    localRecords.push(readingRecord);
    writeLocalFile(localRecords);

    // 2. Persist to MongoDB if connection is active
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await SensorReading.create({
          readingId: id,
          deviceId: readingRecord.deviceId,
          temperature: readingRecord.temperature,
          humidity: readingRecord.humidity,
          timestamp: new Date(timestamp),
        });
      } catch (mongoErr) {
        console.warn('[REPO] MongoDB save failed, persisted to local file:', mongoErr.message);
      }
    }

    return readingRecord;
  },

  /**
   * Find the most recent reading, optionally filtered by deviceId.
   * @param {Object} options - { deviceId }
   * @returns {Promise<Object|null>}
   */
  async findLatest({ deviceId } = {}) {
    // If MongoDB is connected, query MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (deviceId) {
          query.deviceId = deviceId.trim();
        }
        const doc = await SensorReading.findOne(query).sort({ timestamp: -1 });
        if (doc) {
          return {
            id: doc.readingId || doc._id.toString(),
            deviceId: doc.deviceId,
            temperature: doc.temperature,
            humidity: doc.humidity,
            timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : new Date(doc.timestamp).toISOString(),
          };
        }
      } catch (err) {
        console.warn('[REPO] MongoDB findLatest error, falling back to local file:', err.message);
      }
    }

    // Local file fallback
    const localRecords = readLocalFile();
    let filtered = localRecords;
    if (deviceId) {
      filtered = filtered.filter((r) => r.deviceId === deviceId.trim());
    }

    if (filtered.length === 0) {
      return null;
    }

    // Sort descending by timestamp
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered[0];
  },

  /**
   * Find historical readings with filtering and pagination.
   * @param {Object} options - { deviceId, from, to, page, limit, sort }
   * @returns {Promise<{ readings: Array, total: number, page: number, limit: number }>}
   */
  async findHistory({ deviceId, from, to, page = 1, limit = 20, sort = 'desc' } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortAsc = sort === 'asc';

    // If MongoDB is connected, query MongoDB
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (deviceId) {
          query.deviceId = deviceId.trim();
        }
        if (from || to) {
          query.timestamp = {};
          if (from) query.timestamp.$gte = new Date(from);
          if (to) query.timestamp.$lte = new Date(to);
        }

        const total = await SensorReading.countDocuments(query);
        const docs = await SensorReading.find(query)
          .sort({ timestamp: sortAsc ? 1 : -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum);

        const readings = docs.map((doc) => ({
          id: doc.readingId || doc._id.toString(),
          deviceId: doc.deviceId,
          temperature: doc.temperature,
          humidity: doc.humidity,
          timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : new Date(doc.timestamp).toISOString(),
        }));

        return { readings, total, page: pageNum, limit: limitNum };
      } catch (err) {
        console.warn('[REPO] MongoDB findHistory error, falling back to local file:', err.message);
      }
    }

    // Local file fallback
    const localRecords = readLocalFile();
    let filtered = localRecords;

    if (deviceId) {
      filtered = filtered.filter((r) => r.deviceId === deviceId.trim());
    }

    if (from) {
      const fromTime = new Date(from).getTime();
      filtered = filtered.filter((r) => new Date(r.timestamp).getTime() >= fromTime);
    }

    if (to) {
      const toTime = new Date(to).getTime();
      filtered = filtered.filter((r) => new Date(r.timestamp).getTime() <= toTime);
    }

    // Sort
    filtered.sort((a, b) => {
      const diff = new Date(a.timestamp) - new Date(b.timestamp);
      return sortAsc ? diff : -diff;
    });

    const total = filtered.length;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(startIndex, startIndex + limitNum);

    return {
      readings: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    };
  },

  /**
   * Clear all records (useful for testing).
   */
  async clearAll() {
    writeLocalFile([]);
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        await SensorReading.deleteMany({});
      } catch (err) {
        console.warn('[REPO] MongoDB clearAll error:', err.message);
      }
    }
  },
};

module.exports = readingRepository;
