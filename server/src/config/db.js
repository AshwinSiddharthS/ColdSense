const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * Reads MONGO_URI from environment (set in .env via dotenv).
 * Exits the process on failure so the server doesn't start in a broken state.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('[DB] MONGO_URI is not set in environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log(`[DB] Connected to MongoDB: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
