const crypto = require('crypto');

/**
 * Compute a SHA-256 hash for a sensor reading, chained to the previous hash.
 *
 * @param {object} params
 * @param {string} params.previousHash  – hash of the prior reading (or '0' for genesis)
 * @param {number} params.temperature
 * @param {number} params.humidity
 * @param {string|Date} params.timestamp
 * @param {string} params.deviceId
 * @param {string} params.shipmentId
 * @returns {string} 64-char hex SHA-256 hash
 */
function computeHash({ previousHash, temperature, humidity, timestamp, deviceId, shipmentId }) {
  const payload = [
    previousHash,
    temperature,
    humidity,
    new Date(timestamp).toISOString(),
    deviceId,
    shipmentId,
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Verify the integrity of a full chain of readings.
 *
 * @param {Array} readings  – sorted ascending by timestamp, each with { previousHash, currentHash, temperature, humidity, timestamp, deviceId, shipmentId }
 * @returns {{ valid: boolean, firstBadIndex: number|null }}
 */
function verifyChain(readings) {
  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const expectedPrevious = i === 0 ? '0' : readings[i - 1].currentHash;

    // Check previousHash link
    if (r.previousHash !== expectedPrevious) {
      return { valid: false, firstBadIndex: i };
    }

    // Recompute currentHash
    const recomputed = computeHash({
      previousHash: r.previousHash,
      temperature:  r.temperature,
      humidity:     r.humidity,
      timestamp:    r.timestamp,
      deviceId:     r.deviceId,
      shipmentId:   r.shipmentId,
    });

    if (recomputed !== r.currentHash) {
      return { valid: false, firstBadIndex: i };
    }
  }
  return { valid: true, firstBadIndex: null };
}

module.exports = { computeHash, verifyChain };
