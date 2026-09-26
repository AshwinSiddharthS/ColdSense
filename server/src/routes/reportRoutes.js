const router = require('express').Router();
const { downloadCSV, downloadPDF } = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/:shipmentId/csv', downloadCSV);
router.get('/:shipmentId/pdf', downloadPDF);

module.exports = router;
