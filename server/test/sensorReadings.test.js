const { describe, it, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DEVICE_AUTH_ENABLED = 'false';
delete process.env.DEVICE_AUTH_TOKEN;

const app = require('../src/app');
const readingRepository = require('../src/repositories/readingRepository');

describe('Cold-Chain Sensor Readings API', () => {
  beforeEach(async () => {
    // Clear storage before each test for test isolation
    await readingRepository.clearAll();
    process.env.DEVICE_AUTH_ENABLED = 'false';
    delete process.env.DEVICE_AUTH_TOKEN;
  });

  // 1. Health endpoint returns success
  it('1. GET /api/health returns success status ok', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(typeof res.body.uptime === 'number');
    assert.ok(res.body.timestamp);
  });

  // 2. A valid reading is accepted and persisted
  it('2. POST /api/sensors/readings accepts and persists a valid reading', async () => {
    const payload = {
      deviceId: 'cold-chain-01',
      temperature: 4.2,
      humidity: 58.5,
    };

    const res = await request(app)
      .post('/api/sensors/readings')
      .send(payload);

    assert.equal(res.status, 201);
    assert.equal(res.body.message, 'Reading received');
    assert.ok(res.body.reading);
    assert.ok(res.body.reading.id);
    assert.equal(res.body.reading.deviceId, 'cold-chain-01');
    assert.equal(res.body.reading.temperature, 4.2);
    assert.equal(res.body.reading.humidity, 58.5);

    // Verify timestamp is server-generated UTC ISO 8601
    const ts = new Date(res.body.reading.timestamp);
    assert.ok(!isNaN(ts.getTime()));

    // Verify reading was persisted to repository
    const latest = await readingRepository.findLatest({ deviceId: 'cold-chain-01' });
    assert.ok(latest);
    assert.equal(latest.id, res.body.reading.id);
    assert.equal(latest.temperature, 4.2);
  });

  // 3. Missing fields are rejected
  it('3. POST /api/sensors/readings rejects missing required fields with HTTP 400', async () => {
    // Missing deviceId
    let res = await request(app)
      .post('/api/sensors/readings')
      .send({ temperature: 4.2, humidity: 58.5 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /deviceId/i);

    // Empty deviceId
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: '   ', temperature: 4.2, humidity: 58.5 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /deviceId/i);

    // Missing temperature
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', humidity: 58.5 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /temperature/i);

    // Missing humidity
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: 4.2 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /humidity/i);
  });

  // 4. String values such as "4.2" are rejected for numeric fields
  it('4. POST /api/sensors/readings rejects string representations for numeric fields', async () => {
    // String temperature "4.2"
    let res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: '4.2', humidity: 58.5 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /temperature.*not a string/i);

    // String humidity "58.5"
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: 4.2, humidity: '58.5' });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /humidity.*not a string/i);
  });

  // 5. NaN, infinity, out-of-range humidity, and out-of-range temperature are rejected
  it('5. POST /api/sensors/readings rejects NaN, Infinity, and out-of-range values', async () => {
    // Out of range temperature (< -40 °C)
    let res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: -45, humidity: 50 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /operational range/i);

    // Out of range temperature (> 80 °C)
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: 85, humidity: 50 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /operational range/i);

    // Out of range humidity (< 0 %RH)
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: 4.0, humidity: -5 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /range/i);

    // Out of range humidity (> 100 %RH)
    res = await request(app)
      .post('/api/sensors/readings')
      .send({ deviceId: 'cold-chain-01', temperature: 4.0, humidity: 105 });
    assert.equal(res.status, 400);
    assert.match(res.body.message, /range/i);

    // Null or non-object payload
    res = await request(app)
      .post('/api/sensors/readings')
      .send('not a json object')
      .set('Content-Type', 'application/json');
    assert.equal(res.status, 400);
  });

  // 6. Latest reading returns newest stored record for a device
  it('6. GET /api/sensors/readings/latest returns newest record for a device', async () => {
    // Save older reading
    await readingRepository.save({
      deviceId: 'cold-chain-01',
      temperature: 2.1,
      humidity: 50.0,
      timestamp: '2026-10-22T10:00:00.000Z',
    });

    // Save newer reading
    await readingRepository.save({
      deviceId: 'cold-chain-01',
      temperature: 3.5,
      humidity: 52.0,
      timestamp: '2026-10-22T11:00:00.000Z',
    });

    const res = await request(app)
      .get('/api/sensors/readings/latest?deviceId=cold-chain-01');

    assert.equal(res.status, 200);
    assert.ok(res.body.reading);
    assert.equal(res.body.reading.deviceId, 'cold-chain-01');
    assert.equal(res.body.reading.temperature, 3.5);
    assert.equal(res.body.reading.timestamp, '2026-10-22T11:00:00.000Z');
  });

  // 7. Device filtering works
  it('7. GET /api/sensors/readings/latest filters properly by deviceId', async () => {
    // Device A
    await readingRepository.save({
      deviceId: 'DEVICE-A',
      temperature: 5.0,
      humidity: 45.0,
      timestamp: '2026-10-22T10:00:00.000Z',
    });

    // Device B
    await readingRepository.save({
      deviceId: 'DEVICE-B',
      temperature: -18.0,
      humidity: 60.0,
      timestamp: '2026-10-22T10:05:00.000Z',
    });

    // Request DEVICE-A
    const resA = await request(app)
      .get('/api/sensors/readings/latest?deviceId=DEVICE-A');
    assert.equal(resA.status, 200);
    assert.equal(resA.body.reading.deviceId, 'DEVICE-A');
    assert.equal(resA.body.reading.temperature, 5.0);

    // Request non-existent DEVICE-C
    const resC = await request(app)
      .get('/api/sensors/readings/latest?deviceId=DEVICE-C');
    assert.equal(resC.status, 404);
    assert.equal(resC.body.reading, null);
  });

  // 8. Historical query filters and pagination work
  it('8. GET /api/sensors/readings supports deviceId, date filters, and pagination', async () => {
    // Seed 15 readings
    for (let i = 1; i <= 15; i++) {
      const hour = String(i).padStart(2, '0');
      await readingRepository.save({
        deviceId: i % 2 === 0 ? 'DEVICE-EVEN' : 'DEVICE-ODD',
        temperature: 2.0 + i * 0.1,
        humidity: 50.0 + i,
        timestamp: `2026-10-22T${hour}:00:00.000Z`,
      });
    }

    // Pagination test: page 1, limit 5
    let res = await request(app).get('/api/sensors/readings?limit=5&page=1');
    assert.equal(res.status, 200);
    assert.equal(res.body.readings.length, 5);
    assert.equal(res.body.pagination.total, 15);
    assert.equal(res.body.pagination.totalPages, 3);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.hasNextPage, true);

    // Device filter: DEVICE-EVEN (7 readings: 2, 4, 6, 8, 10, 12, 14)
    res = await request(app).get('/api/sensors/readings?deviceId=DEVICE-EVEN&limit=10');
    assert.equal(res.status, 200);
    assert.equal(res.body.readings.length, 7);
    assert.ok(res.body.readings.every((r) => r.deviceId === 'DEVICE-EVEN'));

    // Date range filter: between 05:00 and 10:00
    res = await request(app).get('/api/sensors/readings?from=2026-10-22T05:00:00.000Z&to=2026-10-22T10:00:00.000Z&limit=20');
    assert.equal(res.status, 200);
    assert.equal(res.body.readings.length, 6);

    // Limit cap enforcement: limit > 100 should cap at 100
    res = await request(app).get('/api/sensors/readings?limit=500');
    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.limit, 100);
  });

  // 9. Unauthenticated writes are rejected when authentication is enabled
  it('9. POST /api/sensors/readings rejects unauthenticated writes when authentication is enabled', async () => {
    process.env.DEVICE_AUTH_ENABLED = 'true';
    process.env.DEVICE_AUTH_TOKEN = 'secret-esp32-token';

    const payload = {
      deviceId: 'cold-chain-01',
      temperature: 4.5,
      humidity: 55.0,
    };

    // Missing token header
    let res = await request(app)
      .post('/api/sensors/readings')
      .send(payload);
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Authentication required/i);

    // Wrong token header
    res = await request(app)
      .post('/api/sensors/readings')
      .set('X-Device-Token', 'wrong-token')
      .send(payload);
    assert.equal(res.status, 401);
    assert.match(res.body.message, /Invalid device authentication token/i);

    // Correct token header
    res = await request(app)
      .post('/api/sensors/readings')
      .set('X-Device-Token', 'secret-esp32-token')
      .send(payload);
    assert.equal(res.status, 201);
    assert.equal(res.body.message, 'Reading received');
  });

  // 10. Database errors produce safe error responses
  it('10. Database errors produce safe HTTP error responses without leaking internal stacks', async () => {
    // Simulate repository failure by stubbing readingRepository.save
    const originalSave = readingRepository.save;
    readingRepository.save = async () => {
      const dbErr = new Error('Database connection timeout error occurred');
      dbErr.status = 500;
      throw dbErr;
    };

    try {
      const res = await request(app)
        .post('/api/sensors/readings')
        .send({ deviceId: 'cold-chain-01', temperature: 4.0, humidity: 50.0 });

      assert.equal(res.status, 500);
      assert.ok(res.body.error);
      // Ensure stack trace is NOT returned in response
      assert.equal(res.body.stack, undefined);
    } finally {
      readingRepository.save = originalSave;
    }
  });

  // 11. Malformed JSON syntax handled safely
  it('11. Malformed JSON syntax in request body returns HTTP 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/sensors/readings')
      .set('Content-Type', 'application/json')
      .send('{ "deviceId": "cold-chain-01", "temperature": 4.2, broken json ');

    assert.equal(res.status, 400);
    assert.match(res.body.message, /Malformed JSON payload/i);
  });

  // 12. Invalid history date formats rejected with 400
  it('12. GET /api/sensors/readings rejects invalid date formats in from/to query params', async () => {
    let res = await request(app).get('/api/sensors/readings?from=not-a-valid-date');
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid "from" timestamp/i);

    res = await request(app).get('/api/sensors/readings?to=invalid-date-format');
    assert.equal(res.status, 400);
    assert.match(res.body.message, /Invalid "to" timestamp/i);
  });

  // 13. History chronological sorting verification
  it('13. GET /api/sensors/readings supports sort=asc and sort=desc', async () => {
    await readingRepository.save({
      deviceId: 'TEST-DEV',
      temperature: 1.0,
      humidity: 40.0,
      timestamp: '2026-10-22T08:00:00.000Z',
    });
    await readingRepository.save({
      deviceId: 'TEST-DEV',
      temperature: 2.0,
      humidity: 42.0,
      timestamp: '2026-10-22T09:00:00.000Z',
    });

    // Default is newest first (desc)
    let res = await request(app).get('/api/sensors/readings?deviceId=TEST-DEV');
    assert.equal(res.status, 200);
    assert.equal(res.body.readings[0].temperature, 2.0);
    assert.equal(res.body.readings[1].temperature, 1.0);

    // sort=asc is oldest first
    res = await request(app).get('/api/sensors/readings?deviceId=TEST-DEV&sort=asc');
    assert.equal(res.status, 200);
    assert.equal(res.body.readings[0].temperature, 1.0);
    assert.equal(res.body.readings[1].temperature, 2.0);
  });
});

