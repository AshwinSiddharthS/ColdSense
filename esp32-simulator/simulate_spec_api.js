/**
 * Cold-Chain Device Ingestion Simulator
 * ──────────────────────────────────────
 * Directly simulates an ESP32 sending DHT22 readings to POST /api/sensors/readings
 * using the project specification API contract.
 *
 * Usage:
 *   node simulate_spec_api.js
 *
 * Environment variables (optional):
 *   API_URL      - Backend base URL (default: http://localhost:5000)
 *   DEVICE_ID    - Identifier for device (default: cold-chain-01)
 *   DEVICE_TOKEN - X-Device-Token auth header (default: dev_device_token_123)
 *   INTERVAL_MS  - Send interval in ms (default: 5000)
 */

const http = require('http');
const https = require('https');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const DEVICE_ID = process.env.DEVICE_ID || 'cold-chain-01';
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || 'dev_device_token_123';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '5000', 10);

function sendReading(payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}/api/sensors/readings`);
    const lib = url.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify(payload);

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr),
          'X-Device-Token': DEVICE_TOKEN,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );

    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function getRandomTemp() {
  // Cold-chain target: 2°C to 8°C (centered around 4.5°C)
  return parseFloat((4.5 + (Math.random() - 0.5) * 4.0).toFixed(1));
}

function getRandomHumidity() {
  // Humidity: 50% to 65%
  return parseFloat((55.0 + (Math.random() - 0.5) * 15.0).toFixed(1));
}

async function runCycle() {
  const payload = {
    deviceId: DEVICE_ID,
    temperature: getRandomTemp(),
    humidity: getRandomHumidity(),
  };

  try {
    const res = await sendReading(payload);
    if (res.status === 201) {
      console.log(`[SIM] ✓ HTTP 201 Created | Device: ${payload.deviceId} | Temp: ${payload.temperature} °C | Hum: ${payload.humidity} %RH | Server ID: ${res.data.reading.id} | TS: ${res.data.reading.timestamp}`);
    } else {
      console.warn(`[SIM] ✗ HTTP ${res.status}:`, res.data);
    }
  } catch (err) {
    console.error(`[SIM] ✗ Request failed:`, err.message);
  }
}

console.log('====================================================');
console.log(' ESP32 Sensor Ingestion Simulator');
console.log(` Target Endpoint: ${API_URL}/api/sensors/readings`);
console.log(` Device ID:       ${DEVICE_ID}`);
console.log(` Interval:        ${INTERVAL_MS} ms`);
console.log('====================================================');

runCycle();
setInterval(runCycle, INTERVAL_MS);
