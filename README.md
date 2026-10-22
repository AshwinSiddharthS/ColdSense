# Cold Chain Monitoring System

A full-stack vaccine cold chain monitoring system receiving real-time temperature and relative-humidity readings from ESP32 microcontrollers with bare 4-pin DHT22 sensors.

---

## 1. System Architecture

```
┌────────────────────────┐
│     ESP32 + DHT22      │ (GPIO 4 DATA, 3V3, GND, 4.7k-10k pull-up)
└───────────┬────────────┘
            │ HTTP POST /api/sensors/readings (X-Device-Token)
            ▼
┌────────────────────────┐
│  Express.js REST API   │
│  - Input validation    │
│  - Rate limiting       │
│  - Device auth         │
│  - Server UTC ISO TS   │
└───────────┬────────────┘
            │
    ┌───────┴────────────────────────┐
    ▼                                ▼
┌──────────────────────┐   ┌───────────────────────────┐
│ MongoDB Database     │   │ Local Persistent Disk     │
│ (when connected)     │   │ (fallback across restarts)│
└──────────────────────┘   └───────────────────────────┘
            ▲
            │ GET /api/sensors/readings/latest
            │ GET /api/sensors/readings
┌───────────┴────────────┐
│ Existing Website / UI  │
└────────────────────────┘
```

---

## 2. API Contract Specification

Base URL: `http://localhost:5000` (or `http://<YOUR_LAN_IP>:5000` for ESP32)

### A. Service Health Check
- **Endpoint**: `GET /api/health`
- **Description**: Returns service health status, server uptime, and UTC timestamp.
- **Response** (`HTTP 200 OK`):
```json
{
  "status": "ok",
  "uptime": 142,
  "timestamp": "2026-10-22T17:16:03.629Z"
}
```

---

### B. Ingest Sensor Reading
- **Endpoint**: `POST /api/sensors/readings`
- **Description**: Ingests temperature and humidity readings from an ESP32.
- **Headers**:
  - `Content-Type: application/json`
  - `X-Device-Token: <token>` *(Required when `DEVICE_AUTH_ENABLED=true` or token configured)*
- **Request Body**:
```json
{
  "deviceId": "cold-chain-01",
  "temperature": 4.2,
  "humidity": 58.5
}
```
- **Validation Rules**:
  - `deviceId`: Required non-empty string, maximum 100 characters.
  - `temperature`: Required finite number between -40.0 °C and 80.0 °C (DHT22 nominal operational range). Strings (e.g. `"4.2"`), `NaN`, `null`, and `Infinity` are rejected with HTTP 400.
  - `humidity`: Required finite number between 0.0 %RH and 100.0 %RH. Strings, `NaN`, `null`, and `Infinity` are rejected with HTTP 400.
  - Request size is capped at 100kb; malformed JSON syntax is rejected with HTTP 400.
  - Client timestamps are never trusted; the server assigns an authoritative UTC ISO 8601 timestamp.
- **Response** (`HTTP 201 Created`):
```json
{
  "message": "Reading received",
  "reading": {
    "id": "059a424c-47ae-42cf-83ad-40096a2cbde4",
    "deviceId": "cold-chain-01",
    "temperature": 4.2,
    "humidity": 58.5,
    "timestamp": "2026-10-22T17:16:15.911Z"
  }
}
```

---

### C. Get Latest Reading
- **Endpoint**: `GET /api/sensors/readings/latest`
- **Query Parameters**:
  - `deviceId` *(optional)*: Device identifier filter, e.g. `?deviceId=cold-chain-01`.
- **Response When Found** (`HTTP 200 OK`):
```json
{
  "reading": {
    "id": "059a424c-47ae-42cf-83ad-40096a2cbde4",
    "deviceId": "cold-chain-01",
    "temperature": 4.2,
    "humidity": 58.5,
    "timestamp": "2026-10-22T17:16:15.911Z"
  }
}
```
- **Response When Not Found** (`HTTP 404 Not Found`):
```json
{
  "message": "No reading found for device: cold-chain-01",
  "reading": null
}
```

---

### D. Get Historical Readings (Paginated)
- **Endpoint**: `GET /api/sensors/readings`
- **Query Parameters**:
  - `deviceId` *(optional)*: Filter by device identifier.
  - `from` *(optional)*: ISO 8601 start timestamp (e.g., `2026-10-22T00:00:00.000Z`).
  - `to` *(optional)*: ISO 8601 end timestamp (e.g., `2026-10-22T23:59:59.999Z`).
  - `page` *(optional, default 1)*: Page number (>= 1).
  - `limit` *(optional, default 20, max 100)*: Items per page (unbounded queries are never permitted).
  - `sort` *(optional, default 'desc')*: `'desc'` (newest first) or `'asc'` (oldest first).
- **Response** (`HTTP 200 OK`):
```json
{
  "readings": [
    {
      "id": "059a424c-47ae-42cf-83ad-40096a2cbde4",
      "deviceId": "cold-chain-01",
      "temperature": 4.2,
      "humidity": 58.5,
      "timestamp": "2026-10-22T17:16:15.911Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## 3. Windows Setup & Run Instructions

### Prerequisites
- Node.js >= 18.0.0 (`node -v`)
- PowerShell or Windows Command Prompt

### Step 1: Install Dependencies
```powershell
cd server
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` if not already present:
```powershell
copy .env.example .env
```
Key configuration values in `server/.env`:
```ini
PORT=5000
NODE_ENV=development

# MongoDB URI (if MongoDB is offline or Atlas IP is not yet whitelisted, backend automatically persists to data/readings.json)
MONGO_URI=mongodb://127.0.0.1:27017/cold-chain

# Device Authentication
DEVICE_AUTH_ENABLED=false
DEVICE_AUTH_TOKEN=dev_device_token_123

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120

# CORS
CLIENT_ORIGIN=http://localhost:5173
```

### Step 3: Run Automated Test Suite
```powershell
npm test
```
All 13 acceptance criteria tests will execute and report test status.

### Step 4: Start the Backend Server
```powershell
npm run dev
# Server will listen on http://localhost:5000
```

---

## 4. Testing with Windows PowerShell & curl

### A. Health Check
**Windows PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
```
**Windows Command Prompt (curl.exe):**
```cmd
curl.exe -X GET http://localhost:5000/api/health
```

---

### B. Ingest Sensor Reading
**Windows PowerShell:**
```powershell
$headers = @{
    "Content-Type"   = "application/json"
    "X-Device-Token" = "dev_device_token_123"
}
$body = @{
    deviceId    = "cold-chain-01"
    temperature = 4.2
    humidity    = 58.5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/readings" -Method Post -Headers $headers -Body $body
```

**curl.exe:**
```cmd
curl.exe -X POST http://localhost:5000/api/sensors/readings ^
  -H "Content-Type: application/json" ^
  -H "X-Device-Token: dev_device_token_123" ^
  -d "{\"deviceId\":\"cold-chain-01\",\"temperature\":4.2,\"humidity\":58.5}"
```

---

### C. Query Latest Reading
**Windows PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/readings/latest?deviceId=cold-chain-01" -Method Get
```

**curl.exe:**
```cmd
curl.exe -X GET "http://localhost:5000/api/sensors/readings/latest?deviceId=cold-chain-01"
```

---

### D. Query Historical Readings with Pagination
**Windows PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/readings?deviceId=cold-chain-01&limit=10&page=1" -Method Get
```

**curl.exe:**
```cmd
curl.exe -X GET "http://localhost:5000/api/sensors/readings?deviceId=cold-chain-01&limit=10&page=1"
```

---

## 5. ESP32 Hardware Setup & Firmware

### Hardware Specifications & Wiring
- **Microcontroller**: ESP32 DevKit / ESP32-WROOM
- **Sensor**: Bare 4-pin DHT22 / AM2302
- **Pinout** (Viewed from front with mesh facing you, pins pointing down, Left to Right: 1, 2, 3, 4):
  - **Pin 1 (VCC)**: Connect to ESP32 **3V3**
  - **Pin 2 (DATA)**: Connect to ESP32 **GPIO 4**
  - **Pin 3 (NC)**: Leave disconnected
  - **Pin 4 (GND)**: Connect to ESP32 **GND**
  - **Pull-up Resistor**: Place a 4.7 kΩ to 10 kΩ resistor between Pin 2 (DATA) and Pin 1 (3V3), unless your module has an integrated pull-up resistor.

### Firmware Sketch Location
The Arduino sketch is located at:
[`esp32-firmware/cold_chain_dht22/cold_chain_dht22.ino`](esp32-firmware/cold_chain_dht22/cold_chain_dht22.ino)

### ESP32 Configuration Checklist
1. Open the sketch in **Arduino IDE**.
2. Install dependencies via **Sketch > Include Library > Manage Libraries**:
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
   - `ArduinoJson` by Benoit Blanchon (v6 or v7)
3. Set your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "YOUR_2.4GHZ_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```
4. Set the Backend URL to your laptop's LAN IPv4 address (e.g. `ipconfig` in PowerShell):
   ```cpp
   const char* SERVER_URL    = "http://192.168.1.100:5000/api/sensors/readings";
   ```
   *(Do NOT use `localhost` or `127.0.0.1` on the ESP32!)*
5. Ensure your Windows Firewall allows inbound connections on port 5000 for your local network.
6. Select your board (**Tools > Board > ESP32 Arduino > ESP32 Dev Module**) and COM port.
7. Upload the sketch and open **Serial Monitor** at **115200 baud**. You will observe:
   ```text
   [WIFI] Connected!
   [WIFI] IP Address: 192.168.1.155
   [SENSOR] Reading: Temp=4.2 °C, Hum=58.5 %RH
   [HTTP] Sending POST... Payload: {"deviceId":"cold-chain-01","temperature":4.2,"humidity":58.5}
   [HTTP] Success (HTTP 201). Server accepted reading.
   ```

---

## 6. Cold-Chain Operational Considerations

1. **Storage Durability**: Sensor readings are saved to MongoDB (when connected) and immediately mirrored to persistent disk storage (`server/data/readings.json`). Restarting the server does not cause data loss.
2. **UTC Timestamps**: All readings store server-received timestamps in standard UTC ISO 8601. Conversion to local timezones must be handled in the client display layer.
3. **Decoupled Thresholds**: Sensor ingestion does not hard-code product temperature thresholds. Cold-chain criteria (e.g. 2 °C to 8 °C for vaccines, or -80 °C for ultra-cold storage) remain configurable per shipment/device.
4. **Sensor Limitations**: The DHT22 is a prototyping sensor (accuracy ±0.5 °C, humidity ±2-5 %RH). For certified pharmaceutical transport, calibrated RTDs (PT100/PT1000) or NIST-traceable digital probes should be evaluated.

---

## 7. Project Structure
```
Cold Chain ESP32/
├── client/                                    # Existing React + Vite frontend
├── esp32-firmware/
│   └── cold_chain_dht22/
│       └── cold_chain_dht22.ino               # Arduino ESP32 + DHT22 sketch
├── esp32-simulator/
│   ├── simulate.js                            # Simulator
│   └── simulate_spec_api.js                   # Dedicated spec API simulator
├── server/
│   ├── data/
│   │   └── readings.json                      # Persistent local storage across restarts
│   ├── src/
│   │   ├── config/db.js                       # MongoDB connection with resilient fallback
│   │   ├── controllers/
│   │   │   ├── sensorReadingsController.js    # Ingestion, latest, history logic
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── deviceAuth.js                  # X-Device-Token authentication
│   │   │   ├── sensorValidation.js            # Input validation & range checking
│   │   │   └── errorHandler.js                # Safe production error handling
│   │   ├── models/
│   │   │   ├── SensorReading.js               # Mongoose schema with deviceId indexes
│   │   │   └── ...
│   │   ├── repositories/
│   │   │   └── readingRepository.js           # Multi-tier persistent repository
│   │   ├── routes/
│   │   │   ├── sensorReadingsRoutes.js        # /api/sensors/readings endpoints
│   │   │   └── ...
│   │   └── app.js                             # Express app setup & route mounting
│   ├── test/
│   │   └── sensorReadings.test.js             # 13 automated tests covering all criteria
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```
