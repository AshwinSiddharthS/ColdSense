/**
 * Global error-handling middleware.
 * Must be registered LAST in Express (4 args signature).
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR]', err.message || err);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation Error', message: messages.join('; ') });
  }

  // Mongoose duplicate key (unique index)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] ?? 'field';
    return res.status(409).json({ error: 'Conflict', message: `Duplicate value for ${field}` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  // Database or CastError
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Bad Request', message: `Invalid identifier format for ${err.path}` });
  }

  // Default server error
  const status = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  return res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : 'Request Error',
    message: isProduction && status >= 500 ? 'An unexpected error occurred. Please try again later.' : (err.message || 'Internal server error'),
  });
}

/**
 * 404 handler — catches any unmatched routes.
 */
function notFound(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { errorHandler, notFound };
