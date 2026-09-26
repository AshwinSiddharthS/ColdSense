const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authMiddleware – verifies Bearer JWT on protected routes.
 * Attaches decoded user payload to req.user.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = header.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionally re-fetch user to catch deactivation (skip for performance if not needed)
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

/**
 * roleMiddleware – restricts route to specific roles.
 * Must be used AFTER authMiddleware.
 *
 * @param {...string} roles – allowed roles, e.g. roleMiddleware('admin')
 */
function roleMiddleware(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  };
}

module.exports = { authMiddleware, roleMiddleware };
