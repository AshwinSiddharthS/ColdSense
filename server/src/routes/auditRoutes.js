const router = require('express').Router();
const { getAuditLog, verifyAuditChain } = require('../controllers/auditController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/:shipmentId',        getAuditLog);
router.get('/:shipmentId/verify', verifyAuditChain);

module.exports = router;
