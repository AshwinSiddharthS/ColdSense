const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, 'Device ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Device name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'disabled'],
      default: 'offline',
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    assignedShipmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shipment',
      default: null,
    },
  },
  { timestamps: true }
);

// Virtual: derive online/offline based on lastSeenAt (> 2 min = offline)
deviceSchema.virtual('isOnline').get(function () {
  if (!this.lastSeenAt) return false;
  return (Date.now() - this.lastSeenAt.getTime()) < 2 * 60 * 1000;
});

module.exports = mongoose.model('Device', deviceSchema);
