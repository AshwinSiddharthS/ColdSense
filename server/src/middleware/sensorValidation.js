/**
 * Strict validator for ESP32 sensor readings.
 * Ensures data types, presence, and physical DHT22 ranges are strictly enforced.
 */
function validateReadingPayload(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request body must be a valid JSON object',
    });
  }

  const { deviceId, temperature, humidity } = body;

  // 1. Validate deviceId
  if (deviceId === undefined || deviceId === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "deviceId" is required',
    });
  }

  if (typeof deviceId !== 'string') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "deviceId" must be a string',
    });
  }

  const trimmedDeviceId = deviceId.trim();
  if (trimmedDeviceId.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "deviceId" cannot be empty or blank',
    });
  }

  if (trimmedDeviceId.length > 100) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "deviceId" exceeds maximum length of 100 characters',
    });
  }

  // 2. Validate temperature
  if (temperature === undefined || temperature === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "temperature" is required',
    });
  }

  if (typeof temperature !== 'number') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "temperature" must be a finite number, not a string or other type',
    });
  }

  if (!Number.isFinite(temperature)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "temperature" must be a valid finite number (NaN and Infinity are not accepted)',
    });
  }

  // DHT22 operating range: -40 °C to 80 °C
  if (temperature < -40 || temperature > 80) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Field "temperature" (${temperature} °C) is out of DHT22 operational range (-40 °C to 80 °C)`,
    });
  }

  // 3. Validate humidity
  if (humidity === undefined || humidity === null) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "humidity" is required',
    });
  }

  if (typeof humidity !== 'number') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "humidity" must be a finite number, not a string or other type',
    });
  }

  if (!Number.isFinite(humidity)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Field "humidity" must be a valid finite number (NaN and Infinity are not accepted)',
    });
  }

  // Relative humidity range: 0% to 100%
  if (humidity < 0 || humidity > 100) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Field "humidity" (${humidity} %RH) is out of valid range (0 %RH to 100 %RH)`,
    });
  }

  // Attach sanitized fields
  req.sanitizedReading = {
    deviceId: trimmedDeviceId,
    temperature,
    humidity,
  };

  next();
}

/**
 * Validate query parameters for historical reading queries.
 */
function validateHistoryQuery(req, res, next) {
  const { from, to, page, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid "from" timestamp. Please provide a valid ISO 8601 date string.',
      });
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid "to" timestamp. Please provide a valid ISO 8601 date string.',
      });
    }
  }

  if (page !== undefined) {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "page" must be a positive integer >= 1.',
      });
    }
  }

  if (limit !== undefined) {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "limit" must be a positive integer between 1 and 100.',
      });
    }
  }

  next();
}

module.exports = {
  validateReadingPayload,
  validateHistoryQuery,
};
