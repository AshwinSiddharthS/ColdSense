const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const {
  ingestReading,
  getLatestReading,
  getReadingsHistory,
} = require('../controllers/sensorReadingsController');
const {
  validateReadingPayload,
  validateHistoryQuery,
} = require('../middleware/sensorValidation');
const deviceAuth = require('../middleware/deviceAuth');

// Configurable rate limiter for ingestion endpoint to protect against spam / loops
const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000; // 1 minute
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10) || 120; // 120 requests per minute

const ingestionLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded for sensor readings ingestion. Please throttle device requests.',
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in tests to avoid false positives during stress tests
});

// POST /api/sensors/readings - Ingest ESP32 reading
router.post('/readings', ingestionLimiter, deviceAuth, validateReadingPayload, ingestReading);

// GET /api/sensors/readings/latest - Retrieve newest reading (optionally by deviceId)
router.get('/readings/latest', getLatestReading);

// GET /api/sensors/readings - Retrieve paginated history with optional filters
router.get('/readings', validateHistoryQuery, getReadingsHistory);

module.exports = router;
