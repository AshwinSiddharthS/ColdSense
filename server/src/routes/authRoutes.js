const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, logout, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerRules, register);
router.post('/login',    loginRules,    login);
router.post('/logout',   authMiddleware, logout);
router.get('/me',        authMiddleware, me);

module.exports = router;
