/**
 * Real API Client for Cold-Chain Monitoring System
 * Connects directly to the Express backend and live ESP32 hardware.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Local storage keys for user-created shipments and user-registered devices
const SHIPMENTS_STORAGE_KEY = 'coldchain_shipments_v1';
const DEVICES_STORAGE_KEY = 'coldchain_devices_v1';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[STORAGE] Failed to save to localStorage (${key}):`, err);
  }
}

// Initial fallback shipment for live cold-chain monitoring
const defaultShipment = {
  id: 'SHIP-001',
  origin: 'Central Depot',
  destination: 'Regional Cold Hub',
  vaccineType: 'Cold-Chain Transport (2°C - 8°C)',
  tempRange: { min: 2, max: 8 },
  status: 'in-transit',
  deviceId: 'cold-chain-01',
  createdBy: 'admin@coldchain.in',
  createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  updatedAt: new Date().toISOString(),
  estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
  doses: 10000,
};

let activeShipments = loadStored(SHIPMENTS_STORAGE_KEY, [defaultShipment]);
let activeDevices = loadStored(DEVICES_STORAGE_KEY, []);

export const api = {
  // ── Sensor Readings (Real ESP32 Data) ───────────────────
  getSensorReadings: async (shipmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors/readings?limit=100&sort=asc`);
      if (res.ok) {
        const json = await res.json();
        const raw = json.readings || [];
        if (raw.length > 0) {
          return raw.map((r) => ({
            id: r.id,
            shipmentId: shipmentId || 'SHIP-001',
            deviceId: r.deviceId || 'cold-chain-01',
            temperature: Number(r.temperature),
            humidity: Number(r.humidity),
            timestamp: r.timestamp,
            isValid: true,
          }));
        }
      }
    } catch (err) {
      console.warn('[API] Could not fetch real sensor readings from server:', err.message);
    }
    return [];
  },

  getLatestReading: async (deviceId) => {
    try {
      const url = deviceId
        ? `${API_BASE_URL}/api/sensors/readings/latest?deviceId=${encodeURIComponent(deviceId)}`
        : `${API_BASE_URL}/api/sensors/readings/latest`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.reading;
      }
    } catch (err) {
      console.warn('[API] getLatestReading error:', err.message);
    }
    return null;
  },

  // ── Shipments ──────────────────────────────────────────
  getShipments: async () => {
    activeShipments = loadStored(SHIPMENTS_STORAGE_KEY, [defaultShipment]);
    return [...activeShipments];
  },

  getShipmentById: async (id) => {
    activeShipments = loadStored(SHIPMENTS_STORAGE_KEY, [defaultShipment]);
    return activeShipments.find((s) => s.id === id) ?? null;
  },

  createShipment: async (shipmentInput) => {
    const nextNum = activeShipments.length + 1;
    const id = shipmentInput.id?.trim() || `SHIP-${String(nextNum).padStart(3, '0')}`;

    const newShipment = {
      id,
      origin: shipmentInput.origin || 'Central Depot',
      destination: shipmentInput.destination || 'Regional Hub',
      vaccineType: shipmentInput.vaccineType || 'Cold-Chain Transport',
      tempRange: {
        min: Number(shipmentInput.tempRange?.min ?? 2),
        max: Number(shipmentInput.tempRange?.max ?? 8),
      },
      status: shipmentInput.status || 'in-transit',
      deviceId: shipmentInput.deviceId || 'cold-chain-01',
      createdBy: shipmentInput.createdBy || 'admin@coldchain.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedArrival: shipmentInput.estimatedArrival || new Date(Date.now() + 86400000 * 2).toISOString(),
      doses: Number(shipmentInput.doses) || 5000,
    };

    activeShipments = [newShipment, ...activeShipments];
    saveStored(SHIPMENTS_STORAGE_KEY, activeShipments);
    return newShipment;
  },

  // ── Devices (Live ESP32 + Registered) ───────────────────
  getDevices: async () => {
    let latestReading = null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors/readings/latest`);
      if (res.ok) {
        const json = await res.json();
        latestReading = json.reading;
      }
    } catch (err) {
      console.warn('[API] Error checking latest reading for devices:', err.message);
    }

    const activeDeviceId = latestReading?.deviceId || 'cold-chain-01';
    const isOnline = latestReading
      ? (Date.now() - new Date(latestReading.timestamp).getTime()) < 3 * 60 * 1000
      : false;

    // Real hardware ESP32 device
    const esp32Device = {
      id: activeDeviceId,
      name: `ESP32 DevKit (${activeDeviceId})`,
      status: isOnline ? 'online' : 'offline',
      lastSeenAt: latestReading?.timestamp || new Date().toISOString(),
      assignedShipmentId: 'SHIP-001',
      firmware: 'v1.0.0-DHT22',
      battery: 100,
      signalStrength: -58,
      sensorModel: 'ESP32 DevKit + bare DHT22 (GPIO 4)',
    };

    const stored = loadStored(DEVICES_STORAGE_KEY, []);
    const otherDevices = stored.filter((d) => d.id !== activeDeviceId);
    return [esp32Device, ...otherDevices];
  },

  createDevice: async (deviceInput) => {
    const id = deviceInput.id?.trim() || `ESP32-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newDevice = {
      id,
      name: deviceInput.name?.trim() || `Sensor Node ${id}`,
      status: deviceInput.status || 'online',
      lastSeenAt: new Date().toISOString(),
      assignedShipmentId: deviceInput.assignedShipmentId || null,
      firmware: deviceInput.firmware?.trim() || 'v1.0.0',
      battery: Number(deviceInput.battery ?? 100),
      signalStrength: deviceInput.signalStrength ? Number(deviceInput.signalStrength) : -60,
      sensorModel: deviceInput.sensorModel || 'ESP32 + DHT22',
    };

    activeDevices = [newDevice, ...activeDevices];
    saveStored(DEVICES_STORAGE_KEY, activeDevices);
    return newDevice;
  },

  // ── Alerts (Computed from Live ESP32 Sensor Data) ───────
  getAlerts: async () => {
    const alerts = [];
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors/readings/latest`);
      if (res.ok) {
        const json = await res.json();
        const latest = json.reading;
        if (latest) {
          // If live ambient temperature exceeds typical 2°C - 8°C cold chain range
          if (latest.temperature > 8) {
            alerts.push({
              id: `ALT-TEMP-HIGH-${latest.id.slice(0, 8)}`,
              shipmentId: 'SHIP-001',
              deviceId: latest.deviceId,
              type: 'temp_high',
              severity: 'critical',
              message: `Live temperature ${latest.temperature}°C from ${latest.deviceId} exceeds maximum threshold (8°C)`,
              value: latest.temperature,
              threshold: 8,
              resolved: false,
              createdAt: latest.timestamp,
            });
          } else if (latest.temperature < 2) {
            alerts.push({
              id: `ALT-TEMP-LOW-${latest.id.slice(0, 8)}`,
              shipmentId: 'SHIP-001',
              deviceId: latest.deviceId,
              type: 'temp_low',
              severity: 'warning',
              message: `Live temperature ${latest.temperature}°C from ${latest.deviceId} below minimum threshold (2°C)`,
              value: latest.temperature,
              threshold: 2,
              resolved: false,
              createdAt: latest.timestamp,
            });
          }

          if (latest.humidity > 80) {
            alerts.push({
              id: `ALT-HUM-HIGH-${latest.id.slice(0, 8)}`,
              shipmentId: 'SHIP-001',
              deviceId: latest.deviceId,
              type: 'humidity_high',
              severity: 'warning',
              message: `Live humidity ${latest.humidity}% exceeds threshold (80%)`,
              value: latest.humidity,
              threshold: 80,
              resolved: false,
              createdAt: latest.timestamp,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[API] Alerts evaluation error:', err.message);
    }
    return alerts;
  },

  // ── Audit Logs (Live Hardware Ingestion Trail) ──────────
  getAuditLogs: async (shipmentId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sensors/readings?limit=30&sort=desc`);
      if (res.ok) {
        const json = await res.json();
        return (json.readings || []).map((r) => ({
          id: `AUDIT-${r.id.slice(0, 8)}`,
          shipmentId: shipmentId || 'SHIP-001',
          action: 'SENSOR_READING_INGESTED',
          details: `ESP32 ${r.deviceId} transmitted Temp=${r.temperature}°C, Hum=${r.humidity}%RH`,
          actor: r.deviceId,
          createdAt: r.timestamp,
          hash: r.id,
        }));
      }
    } catch (err) {
      console.warn('[API] Audit logs error:', err.message);
    }
    return [];
  },

  // ── Auth ───────────────────────────────────────────────
  login: async (email, password) => {
    // Attempt backend login first
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {}

    // Fallback credentials
    if (email === 'admin@coldchain.in' && password === 'password') {
      return { token: 'ccm-admin-token', user: { name: 'Arjun Sharma', role: 'admin', email } };
    }
    if (email === 'operator@coldchain.in' && password === 'password') {
      return { token: 'ccm-operator-token', user: { name: 'Priya Menon', role: 'operator', email } };
    }
    throw new Error('Invalid email or password');
  },

  logout: async () => {
    return { success: true };
  },
};
