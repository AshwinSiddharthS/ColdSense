const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
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
      required: true,
    },
    currentHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    // keep readings lean — no lean() needed in queries
  }
);

// Compound index for efficient history queries per shipment
sensorReadingSchema.index({ shipmentId: 1, timestamp: 1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
