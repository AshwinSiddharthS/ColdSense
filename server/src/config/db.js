const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Reads MONGO_URI from environment (set in .env via dotenv).
 * In development, if MongoDB is unreachable (e.g. Atlas IP not whitelisted or no local mongod),
 * falls back to the resilient local persistent file database without crashing.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[DB] MONGO_URI is not set. Operating in persistent local storage mode (data/readings.json).');
    return;
  }

  try {
    // 5 second timeout to avoid blocking server boot when network is restricted
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Warning: Could not connect to MongoDB (${err.message}).`);
    console.warn('[DB] Operating in resilient persistent local storage mode (data/readings.json). Sensor readings will persist across restarts.');
    if (process.env.NODE_ENV === 'production' && process.env.STRICT_DB === 'true') {
      console.error('[DB] STRICT_DB is enabled in production. Exiting process.');
      process.exit(1);
    }
  }
}

module.exports = connectDB;
