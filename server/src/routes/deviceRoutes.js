const router = require('express').Router();
const { body } = require('express-validator');
const { getDevices, getDeviceStatus, createDevice, updateDevice } = require('../controllers/deviceController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/',            getDevices);
router.get('/:id/status',  getDeviceStatus);
router.post('/',  roleMiddleware('admin'), [
  body('deviceId').trim().notEmpty().withMessage('deviceId is required'),
  body('name').trim().notEmpty().withMessage('name is required'),
], createDevice);
router.patch('/:id', updateDevice);

module.exports = router;
