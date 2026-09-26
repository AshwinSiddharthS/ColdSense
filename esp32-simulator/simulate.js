/**
 * ESP32 Simulator
 * ───────────────
 * Mimics an ESP32 + DHT22 device by POSTing fake sensor readings
 * to the backend every N seconds.
 *
 * Usage:
 *   node simulate.js
 *
 * Environment (optional, falls back to defaults):
 *   API_URL     – backend base URL  (default: http://localhost:5000)
 *   EMAIL       – operator login    (default: operator@coldchain.in)
 *   PASSWORD    – operator password (default: password123)
 *   DEVICE_ID   – registered deviceId in DB (default: ESP32-A1B2)
 *   SHIPMENT_ID – active shipment   (default: SHIP-001)
 *   INTERVAL_MS – reading interval  (default: 10000 = 10s)
 */

const https = require('https');
const http  = require('http');

const API_URL     = process.env.API_URL     || 'http://localhost:5000';
const EMAIL       = process.env.EMAIL       || 'operator@coldchain.in';
const PASSWORD    = process.env.PASSWORD    || 'password123';
const DEVICE_ID   = process.env.DEVICE_ID   || 'ESP32-A1B2';
const SHIPMENT_ID = process.env.SHIPMENT_ID || 'SHIP-001';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '10000', 10);

let token = null;

// ── Helpers ───────────────────────────────────────────────────

function request(method, path, body, authToken) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const lib = url.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;

    const opts = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === 'https:' ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/** Simulate realistic cold-chain temperature (−20 ± 3°C with occasional spikes) */
function fakeTemperature() {
  const base = -20;
  const drift = (Math.random() - 0.5) * 6; // ±3°C normal drift
  const spike = Math.random() < 0.05 ? (Math.random() * 15) : 0; // 5% chance of spike
  return parseFloat((base + drift + spike).toFixed(1));
}

/** Simulate humidity (45 ± 10%) */
function fakeHumidity() {
  return parseFloat((45 + (Math.random() - 0.5) * 20).toFixed(1));
}

// ── Login ─────────────────────────────────────────────────────

async function login() {
  console.log(`[SIM] Logging in as ${EMAIL}…`);
  const res = await request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD });
  if (res.status !== 200 || !res.body.success) {
    throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  }
  token = res.body.data.token;
  console.log('[SIM] Logged in ✓');
}

// ── Send Reading ──────────────────────────────────────────────

async function sendReading() {
  const payload = {
    deviceId:    DEVICE_ID,
    shipmentId:  SHIPMENT_ID,
    temperature: fakeTemperature(),
    humidity:    fakeHumidity(),
    timestamp:   new Date().toISOString(),
    gps:         { lat: 12.9716 + (Math.random() - 0.5) * 0.05, lng: 77.5946 + (Math.random() - 0.5) * 0.05 },
  };

  try {
    const res = await request('POST', '/api/sensor-data', payload, token);
    if (res.status === 201) {
      console.log(`[SIM] ✓ Sent: temp=${payload.temperature}°C  hum=${payload.humidity}%  ts=${payload.timestamp}`);
    } else if (res.status === 401) {
      console.warn('[SIM] Token expired — re-logging in…');
      await login();
    } else {
      console.warn(`[SIM] Unexpected response ${res.status}:`, res.body);
    }
  } catch (err) {
    console.error('[SIM] Send error:', err.message);
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log(`[SIM] ESP32 Simulator starting`);
  console.log(`[SIM] Target:  ${API_URL}`);
  console.log(`[SIM] Device:  ${DEVICE_ID}  →  Shipment: ${SHIPMENT_ID}`);
  console.log(`[SIM] Interval: ${INTERVAL_MS}ms`);

  await login();
  await sendReading(); // immediate first reading

  setInterval(sendReading, INTERVAL_MS);
}

main().catch((err) => {
  console.error('[SIM] Fatal error:', err);
  process.exit(1);
});
