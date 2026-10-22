const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    readingId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    gps: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    previousHash: {
      type: String,
      required: false,
      default: null,
    },
    currentHash: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
    // keep readings lean — no lean() needed in queries
  }
);

// Compound indexes for efficient history queries
sensorReadingSchema.index({ shipmentId: 1, timestamp: 1 });
sensorReadingSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
