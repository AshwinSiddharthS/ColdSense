require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

const authRoutes           = require('./routes/authRoutes');
const shipmentRoutes       = require('./routes/shipmentRoutes');
const deviceRoutes         = require('./routes/deviceRoutes');
const sensorRoutes         = require('./routes/sensorRoutes');
const sensorReadingsRoutes = require('./routes/sensorReadingsRoutes');
const alertRoutes          = require('./routes/alertRoutes');
const auditRoutes          = require('./routes/auditRoutes');
const reportRoutes         = require('./routes/reportRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Security & Logging ────────────────────────────────────────
app.use(helmet());

// Configure production CORS to allow specific known origins
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, ESP32 HTTP requests)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin denied by policy: ${origin}`));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Body Parsing with size limits ─────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Handle malformed JSON safely with HTTP 400
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Malformed JSON payload: please verify syntax',
    });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum allowed size of 100kb',
    });
  }
  next(err);
});

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────
// Cold-Chain ESP32 sensor readings API contract
app.use('/api/sensors', sensorReadingsRoutes);

// Existing application routes
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
