const router = require('express').Router();
const { getAlerts, resolveAlert } = require('../controllers/alertController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/',       getAlerts);
router.patch('/:id',  resolveAlert);

module.exports = router;
