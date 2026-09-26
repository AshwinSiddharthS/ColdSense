const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      // e.g. 'sensor_reading', 'status_change', 'alert_raised', 'alert_resolved', 'shipment_created'
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = system/device (not a human action)
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    hash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
