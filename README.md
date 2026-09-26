# Cold Chain Monitoring System

A full-stack, real-time vaccine cold chain monitoring system.

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React + Vite, Tailwind CSS, React Router, Recharts |
| Backend | Node.js + Express.js |
| Database | MongoDB (local or Atlas free tier) |
| Auth | JWT + bcrypt |
| IoT | ESP32 + DHT22, Wi-Fi REST POST |
| Integrity | SHA-256 hash chain |

## Project Structure
```
├── client/          # React + Vite frontend
├── server/          # Express REST API
└── esp32-simulator/ # Node.js device simulator
```

## Quick Start

### 1. Frontend
```bash
cd client
npm install
npm run dev          # http://localhost:5173
```
Mock credentials: `admin@coldchain.in` / `password`

### 2. Backend
```bash
cd server
npm install
copy .env.example .env   # then edit MONGO_URI and JWT_SECRET
npm run dev              # http://localhost:5000
```

### 3. ESP32 Simulator (after backend is running)
```bash
cd esp32-simulator
# First register a device and shipment via the API or UI, then:
node simulate.js
```

## Environment Variables (server/.env)
| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret for JWT signing |
| `JWT_EXPIRES_IN` | Token lifetime (default 8h) |
| `CLIENT_ORIGIN` | Frontend URL for CORS (default http://localhost:5173) |

## API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/shipments` | List shipments |
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments/:id` | Get shipment |
| PATCH | `/api/shipments/:id` | Update shipment |
| DELETE | `/api/shipments/:id` | Delete (admin) |
| GET | `/api/devices` | List devices |
| POST | `/api/devices` | Register device (admin) |
| PATCH | `/api/devices/:id` | Enable/disable device |
| POST | `/api/sensor-data` | Ingest ESP32 reading |
| GET | `/api/sensor-data/:shipmentId` | Reading history |
| GET | `/api/alerts` | List alerts |
| PATCH | `/api/alerts/:id` | Mark resolved |
| GET | `/api/audit-log/:shipmentId` | Audit log |
| GET | `/api/audit-log/:shipmentId/verify` | Verify hash chain |
| GET | `/api/reports/:shipmentId/csv` | Download CSV |
| GET | `/api/reports/:shipmentId/pdf` | Download PDF |

## Development Phases
- **Phase 0 ✅** — Full React UI with mock data
- **Phase 1 ✅** — Express backend scaffold, all models, routes, controllers
- **Phase 2** — Wire frontend to real API (swap mock api/ functions)
- **Phase 3** — Real ESP32 firmware integration
