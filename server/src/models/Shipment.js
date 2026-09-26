const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: [true, 'Shipment ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    vaccineType: {
      type: String,
      required: [true, 'Vaccine type is required'],
      trim: true,
    },
    tempRange: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'in-transit', 'delivered', 'alert'],
      default: 'pending',
    },
    deviceId: {
      type: String,
      ref: 'Device',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
