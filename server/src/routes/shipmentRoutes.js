const router = require('express').Router();
const { body } = require('express-validator');
const { getShipments, getShipmentById, createShipment, updateShipment, deleteShipment } = require('../controllers/shipmentController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const createRules = [
  body('shipmentId').trim().notEmpty().withMessage('shipmentId is required'),
  body('origin').trim().notEmpty().withMessage('origin is required'),
  body('destination').trim().notEmpty().withMessage('destination is required'),
  body('vaccineType').trim().notEmpty().withMessage('vaccineType is required'),
  body('tempRange.min').isNumeric().withMessage('tempRange.min must be a number'),
  body('tempRange.max').isNumeric().withMessage('tempRange.max must be a number'),
];

router.use(authMiddleware); // all shipment routes require auth

router.get('/',     getShipments);
router.get('/:id',  getShipmentById);
router.post('/',    createRules, createShipment);
router.patch('/:id', updateShipment);
router.delete('/:id', roleMiddleware('admin'), deleteShipment);

module.exports = router;
