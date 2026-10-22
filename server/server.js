require('dotenv').config();

const app       = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Global error handlers to log any crashes clearly on Render
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
});

// Bind immediately to 0.0.0.0 so Render port detection passes instantly
const server = app.listen(PORT, HOST, () => {
  console.log(`[SERVER] Listening on http://${HOST}:${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Connect to MongoDB asynchronously in the background
connectDB().catch((err) => {
  console.error('[DB] Background connection error:', err.message);
});

module.exports = server;
