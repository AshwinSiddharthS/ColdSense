const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['temp_high', 'temp_low', 'humidity_high', 'humidity_low', 'disconnect', 'no_data'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      default: null,
    },
    threshold: {
      type: Number,
      default: null,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
