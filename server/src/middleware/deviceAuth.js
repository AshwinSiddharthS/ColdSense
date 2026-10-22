const crypto = require('crypto');

/**
 * Middleware to authenticate ESP32 sensor ingestion requests.
 * Uses the X-Device-Token header (or Bearer Authorization token).
 * 
 * Authentication is enforced when:
 *  - process.env.DEVICE_AUTH_ENABLED === 'true', OR
 *  - process.env.DEVICE_AUTH_TOKEN is defined and non-empty
 */
function deviceAuth(req, res, next) {
  const isAuthEnabled = process.env.DEVICE_AUTH_ENABLED === 'true' || Boolean(process.env.DEVICE_AUTH_TOKEN);

  if (!isAuthEnabled) {
    // Auth is disabled (e.g. initial dev mode)
    return next();
  }

  const expectedToken = process.env.DEVICE_AUTH_TOKEN;
  if (!expectedToken) {
    // Auth was enabled but no token configured on server
    return res.status(500).json({
      error: 'Server Misconfiguration',
      message: 'Device authentication is enabled but DEVICE_AUTH_TOKEN is not configured.',
    });
  }

  // Extract token from X-Device-Token or Authorization: Bearer <token>
  let providedToken = req.headers['x-device-token'];

  if (!providedToken && req.headers['authorization']) {
    const parts = req.headers['authorization'].split(' ');
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      providedToken = parts[1];
    }
  }

  if (!providedToken) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required. Missing X-Device-Token header.',
    });
  }

  // Constant-time comparison to prevent timing attacks
  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);

  const isValid =
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);

  if (!isValid) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid device authentication token.',
    });
  }

  // Never log the token; proceed to handler
  next();
}

module.exports = deviceAuth;
