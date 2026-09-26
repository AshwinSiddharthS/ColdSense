const router = require('express').Router();
const { body } = require('express-validator');
const { ingestReading, getReadings } = require('../controllers/sensorController');
const { authMiddleware } = require('../middleware/authMiddleware');

const ingestRules = [
  body('deviceId').trim().notEmpty().withMessage('deviceId is required'),
  body('shipmentId').trim().notEmpty().withMessage('shipmentId is required'),
  body('temperature').isNumeric().withMessage('temperature must be a number'),
  body('humidity').isNumeric().withMessage('humidity must be a number'),
];

// ESP32 posts sensor data — device key auth could be added later
// For now same JWT auth is used; simulator passes the token
router.post('/', authMiddleware, ingestRules, ingestReading);
router.get('/:shipmentId', authMiddleware, getReadings);

module.exports = router;
