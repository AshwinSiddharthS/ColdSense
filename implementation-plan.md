# Vaccine Cold Chain Transport Tracking System — Implementation Plan

A full-stack, free/open-source real-time vaccine cold chain monitoring system.
**Approach used in this plan: UI-first.** You'll build the complete React frontend with mock/static data and working tabs/navigation before touching the backend, database, or ESP32. This lets you see and click through the whole app early, then swap mock data for real APIs incrementally.

---

## 1. Tech Stack (confirmed)

| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB Community Edition (local) or Atlas Free Tier |
| Auth | JWT + bcrypt |
| IoT | ESP32 + DHT22 (+ optional GPS), Wi-Fi, REST API |
| Integrity | SHA-256 hash chain (no blockchain) |

---

## 2. System Architecture

```
                        ┌─────────────────────┐
                        │   ESP32 + DHT22      │
                        │  (Wi-Fi, REST POST)  │
                        └──────────┬───────────┘
                                   │ HTTPS POST /api/sensor-data
                                   ▼
┌───────────────┐        ┌─────────────────────┐        ┌───────────────┐
│  React Client  │◄──────►│  Express REST API    │◄──────►│   MongoDB      │
│ (Vite, Tailwind,│  JWT   │  (auth, shipments,   │        │ (Users,        │
│ Recharts, Router)│       │  devices, alerts,    │        │  Shipments,    │
└───────────────┘        │  hash-chain logic)    │        │  Devices,      │
                          └─────────────────────┘        │  SensorReadings,│
                                                            │  Alerts,       │
                                                            │  AuditLogs)    │
                                                            └───────────────┘
```

- Frontend and backend are **separate apps** (`/client` and `/server`), talking over REST + JWT.
- Real-time feel is achieved via **polling** (simplest, free, no extra infra) — e.g., dashboard re-fetches every 5–10s. You can upgrade to Socket.IO later (still free) if you want push updates.
- ESP32 simulator: since you may not have hardware yet, you'll build a **Node.js/Python script that mimics ESP32** POST requests, so the UI/backend can be tested end-to-end without real hardware.

---

## 3. Folder Structure

```
vaccine-cold-chain/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── api/                 # axios instances, api call functions
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Sidebar, TabNav, ProtectedRoute
│   │   │   ├── dashboard/       # StatusCard, LiveReadingCard, AlertBanner
│   │   │   ├── charts/          # TemperatureChart, HumidityChart
│   │   │   ├── shipments/       # ShipmentTable, ShipmentForm
│   │   │   ├── devices/         # DeviceTable, DeviceForm
│   │   │   └── common/          # Button, Modal, Loader, Badge
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ShipmentsPage.jsx
│   │   │   ├── ShipmentDetailPage.jsx
│   │   │   ├── DevicesPage.jsx
│   │   │   ├── AlertsPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── AuditLogPage.jsx
│   │   ├── context/             # AuthContext
│   │   ├── hooks/                # usePolling, useAuth
│   │   ├── mock/                 # mock JSON data used during UI-first phase
│   │   ├── utils/                 # formatDate, thresholdCheck, etc.
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/               # db.js, env.js
│   │   ├── models/                # User, Shipment, Device, SensorReading, Alert, AuditLog
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/           # authMiddleware, roleMiddleware, errorHandler
│   │   ├── services/              # hashChainService, alertService, reportService
│   │   ├── utils/                 # sha256.js
│   │   └── app.js
│   ├── server.js
│   └── package.json
│
├── esp32-firmware/               # Arduino/PlatformIO sketch (real device, later)
│   └── vaccine_sensor/vaccine_sensor.ino
│
├── esp32-simulator/               # Node/Python script that fakes ESP32 for dev/testing
│   └── simulate.js
│
├── docs/
│   └── implementation-plan.md    # this file
│
└── README.md
```

---

## 4. Phase 0 — UI First (what you build right now)

Since you want the UI done first with basic tabs, here is the concrete order:

### Step A — Scaffold
```bash
npm create vite@latest client -- --template react
cd client
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom recharts axios
```

### Step B — Tab / Page Skeleton (no backend yet)
Build these routes with `react-router-dom`, each rendering a page with **static/mock data** from `src/mock/`:

| Tab | Route | Purpose |
|---|---|---|
| Dashboard | `/` | Live status cards, current temp/humidity, alerts summary |
| Shipments | `/shipments` | Table of shipments, create/edit form, status badges |
| Shipment Detail | `/shipments/:id` | Charts (temp/humidity vs time), hash-chain validity indicator |
| Devices | `/devices` | Device table, online/offline status, register device |
| Alerts | `/alerts` | Alert history table, filter by shipment/date |
| Reports | `/reports` | CSV/PDF download buttons (stubbed initially) |
| Audit Log | `/audit-log` | Hash chain viewer, valid/invalid indicator |
| Login | `/login` | Simple form, no real auth yet (mock JWT in localStorage-like state) |

Use a persistent **Sidebar or top TabNav** component (`components/layout/TabNav.jsx`) shared across all pages via a `Layout` wrapper in `App.jsx`.

### Step C — Mock Data
Create `src/mock/shipments.json`, `devices.json`, `sensorReadings.json`, `alerts.json` with realistic fake entries so every page looks fully populated. Wire pages to read from these files via simple functions in `src/api/` that you'll later swap for real `axios` calls — **keep the function signatures identical** so swapping to real API later requires no page-level changes.

### Step D — Polish
- Tailwind styling: consistent color system (e.g., green = safe, amber = warning, red = alert/offline).
- Responsive layout (mobile-first, collapsible sidebar).
- Reusable `Badge`, `Modal`, `Loader`, `Button` components.

**Once this is done and looks/feels right, move to Phase 1 (backend).**

---

## 5. Database Schema (MongoDB)

**Users**
```js
{ _id, name, email, passwordHash, role: "admin" | "operator", createdAt }
```

**Devices**
```js
{ _id, deviceId, name, status: "online"|"offline"|"disabled",
  lastSeenAt, assignedShipmentId, createdAt }
```

**Shipments**
```js
{ _id, shipmentId, origin, destination, vaccineType,
  tempRange: { min, max }, status: "pending"|"in-transit"|"delivered"|"alert",
  deviceId, createdBy, createdAt, updatedAt }
```

**SensorReadings**
```js
{ _id, shipmentId, deviceId, temperature, humidity,
  gps: { lat, lng } | null, timestamp,
  previousHash, currentHash, createdAt }
```

**Alerts**
```js
{ _id, shipmentId, deviceId, type: "temp_high"|"temp_low"|"disconnect"|"no_data",
  message, value, threshold, resolved, createdAt }
```

**AuditLogs**
```js
{ _id, shipmentId, action, performedBy, details, hash, createdAt }
```

---

## 6. API Endpoints

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Shipments**
- `GET /api/shipments`
- `POST /api/shipments`
- `GET /api/shipments/:id`
- `PATCH /api/shipments/:id`
- `DELETE /api/shipments/:id`

**Devices**
- `GET /api/devices`
- `POST /api/devices`
- `PATCH /api/devices/:id` (enable/disable)
- `GET /api/devices/:id/status`

**Sensor Data**
- `POST /api/sensor-data` (ESP32 → backend, ingest + hash + threshold check)
- `GET /api/sensor-data/:shipmentId` (history, with `?from=&to=` filters)

**Alerts**
- `GET /api/alerts`
- `PATCH /api/alerts/:id` (mark resolved)

**Audit Log**
- `GET /api/audit-log/:shipmentId`
- `GET /api/audit-log/:shipmentId/verify` (recompute chain, return valid/invalid)

**Reports**
- `GET /api/reports/:shipmentId/csv`
- `GET /api/reports/:shipmentId/pdf`

---

## 7. Authentication Flow

1. `POST /api/auth/login` — verify email, compare password with `bcrypt.compare`.
2. On success, sign JWT (`jsonwebtoken`) with `{ userId, role }`, short expiry (e.g. 8h) + refresh strategy optional.
3. Client stores token in memory + `httpOnly` cookie preferred over `localStorage` for security (localStorage acceptable for a student project, but note the trade-off).
4. `authMiddleware` verifies JWT on protected routes; `roleMiddleware('admin')` restricts admin-only routes (device registration, user management).

---

## 8. ESP32 Integration Plan

1. **Simulator first**: `esp32-simulator/simulate.js` (Node + `node-fetch`/`axios`) posts fake readings every N seconds to `/api/sensor-data` with a `deviceId`. Build and test the entire backend + dashboard against this before touching real hardware.
2. **Real firmware** (Arduino/PlatformIO):
   - Read DHT22 via `DHT.h` library.
   - Connect Wi-Fi (`WiFi.h`), POST JSON via `HTTPClient`.
   - Payload: `{ deviceId, temperature, humidity, timestamp, gps? }`.
   - Send interval: every 30–60s (configurable).
   - Retry/backoff on failed POST; local buffering optional (advanced).
3. Backend validates payload shape, checks `deviceId` is registered and enabled, then proceeds to hashing.

---

## 9. Hash Generation Logic (Tamper-Evident Chain)

```js
// server/src/utils/sha256.js
const crypto = require("crypto");

function computeHash({ previousHash, temperature, humidity, timestamp, deviceId }) {
  const payload = `${previousHash}${temperature}${humidity}${timestamp}${deviceId}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}
```

- On each new reading for a shipment, fetch the **last reading's `currentHash`** (or a genesis value like `"0"` if first reading).
- Compute `currentHash` and store both `previousHash` and `currentHash` on the record.
- **Verification endpoint** re-walks the chain for a shipment, recomputing each hash and comparing to stored values — first mismatch = tampering point, surfaced in the Audit Log UI.

---

## 10. Dashboard Implementation

- Poll `GET /api/shipments` + `GET /api/sensor-data/:shipmentId?latest=true` every 5–10s (`setInterval` inside a `usePolling` hook, cleaned up on unmount).
- Status cards: current temp/humidity vs threshold (color-coded), device online/offline (based on `lastSeenAt` vs a timeout, e.g. >2 min = offline).
- Active alerts surfaced as a banner/list at top of dashboard.

---

## 11. Charts & Analytics

- **Recharts** `LineChart` for Temperature vs Time and Humidity vs Time, with reference lines for min/max thresholds.
- Alert history as a table or scatter markers overlaid on the chart.
- Filters (shipment, date range, device) update the underlying `GET /api/sensor-data/:shipmentId?from=&to=` query.

---

## 12. Report Generation

- **CSV**: use `json2csv` (Node) or write manually — stream shipment + readings + alerts to CSV.
- **PDF**: use `pdfkit` (free) to lay out shipment details, a rendered chart image (can render chart server-side with a headless approach, or simpler: capture chart as PNG client-side with `recharts` + `html2canvas` and upload/embed), and alert list.
- Endpoint returns file as a download (`res.download()` or streamed response); frontend triggers via a normal `<a href>`/fetch-blob download.

---

## 13. Suggested Timeline (Week-by-Week)

| Week | Focus |
|---|---|
| 1 | UI-first: scaffold client, build all tabs/pages with mock data, styling, routing |
| 2 | Backend scaffold: Express app, MongoDB connection, User model, auth (register/login/JWT) |
| 3 | Shipment + Device CRUD APIs; connect frontend Shipments/Devices tabs to real API |
| 4 | Sensor ingestion endpoint + hash chain logic; build ESP32 simulator; connect Dashboard to live data |
| 5 | Alerts engine (threshold checks, disconnect detection) + Alerts tab wired up |
| 6 | Charts/analytics wired to real historical data; filters |
| 7 | Audit Log tab + hash verification endpoint/UI |
| 8 | Reports (CSV/PDF) generation + download |
| 9 | Real ESP32 firmware integration (if hardware available) |
| 10 | Testing, polish, mobile responsiveness pass, documentation, deployment |

---

## 14. Milestones

- **M1**: Clickable UI with all tabs and mock data (end of Week 1).
- **M2**: Working auth + shipment/device management on real data (end of Week 3).
- **M3**: Live sensor ingestion + hash chain + dashboard reflecting real data (end of Week 4).
- **M4**: Alerts + analytics fully functional (end of Week 6).
- **M5**: Audit log verification + reports (end of Week 8).
- **M6**: Hardware-integrated, deployed, documented (end of Week 10).

---

## 15. Future Improvements

- Socket.IO for true push-based real-time updates instead of polling.
- MQTT broker (e.g., Mosquitto, free/self-hosted) instead of REST for lower-power device communication.
- Push/browser notifications for alerts.
- Multi-shipment map view (Leaflet + OpenStreetMap, free).
- Offline-first ESP32 buffering with retry queue.
- Role-based fine-grained permissions beyond admin/operator.

---

## 16. Recommended Free Libraries

**Frontend**: `react-router-dom`, `axios`, `recharts`, `tailwindcss`, `date-fns`, `react-hook-form`, `lucide-react` (icons)

**Backend**: `express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `dotenv`, `cors`, `helmet`, `express-validator`, `json2csv`, `pdfkit`, `morgan` (logging)

**Dev tools**: `nodemon`, `eslint`, `prettier`, `concurrently` (run client+server together)

---

## 17. Best Coding Practices

- Keep frontend "api" functions with identical signatures whether backed by mock data or real endpoints, so swapping later is a one-line change per function.
- Validate all incoming sensor data on the backend (`express-validator`) — never trust the device payload.
- Never store plaintext passwords; always `bcrypt.hash` with a sufficient salt round (10–12).
- Centralize error handling via Express error middleware; return consistent `{ success, message, data }` response shapes.
- Environment variables (`.env`) for DB URI, JWT secret — never commit secrets.
- Write small, single-responsibility controllers; put business logic (hash chain, alert rules) in `services/`, not controllers.
- Add basic tests for hash chain logic and threshold/alert logic, since these are the "correctness-critical" parts of the project.

---

## 18. Step-by-Step Development Order

1. Scaffold `client/` with Vite + Tailwind + Router.
2. Build all pages/tabs with mock data (Phase 0 above) — get this looking good first.
3. Scaffold `server/` with Express + MongoDB connection (`mongoose`).
4. Build `User` model + auth routes (register/login) + JWT middleware.
5. Wire frontend Login page to real auth; add `ProtectedRoute` + `AuthContext`.
6. Build `Shipment` and `Device` models + CRUD routes; connect Shipments/Devices tabs.
7. Build `esp32-simulator/simulate.js`; build `SensorReading` model + `POST /api/sensor-data` with hash chain logic.
8. Connect Dashboard + Shipment Detail charts to real sensor data via polling.
9. Build `Alert` model + alert-generation logic (triggered on ingestion) + Alerts tab.
10. Build Audit Log verification endpoint + Audit Log tab UI.
11. Build CSV/PDF report generation + Reports tab.
12. Integrate real ESP32 firmware (optional, if hardware is available).
13. Testing pass, responsiveness pass, README + documentation, deployment (e.g., free-tier Render/Railway for backend, Vercel/Netlify for frontend, MongoDB Atlas free tier for DB).
