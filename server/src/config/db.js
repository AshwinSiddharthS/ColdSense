const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Reads MONGO_URI from environment.
 * If MongoDB is unreachable or unconfigured, gracefully falls back
 * to the persistent local disk storage (data/readings.json) without crashing the server.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('[DB] MONGO_URI is not set. Operating in persistent local storage mode (data/readings.json).');
    return;
  }

  try {
    // 5-second timeout to avoid blocking when network or IP is restricted
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Warning: Could not connect to MongoDB (${err.message}).`);
    console.warn('[DB] Operating in resilient persistent storage mode (data/readings.json). Server remains fully functional.');
  }
}

module.exports = connectDB;
