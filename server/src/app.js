require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes    = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const deviceRoutes  = require('./routes/deviceRoutes');
const sensorRoutes  = require('./routes/sensorRoutes');
const alertRoutes   = require('./routes/alertRoutes');
const auditRoutes   = require('./routes/auditRoutes');
const reportRoutes  = require('./routes/reportRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security & Logging ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/shipments',   shipmentRoutes);
app.use('/api/devices',     deviceRoutes);
app.use('/api/sensor-data', sensorRoutes);
app.use('/api/alerts',      alertRoutes);
app.use('/api/audit-log',   auditRoutes);
app.use('/api/reports',     reportRoutes);

// ── Error Handling ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
