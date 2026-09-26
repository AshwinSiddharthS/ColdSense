import shipmentsData from '../mock/shipments.json';
import devicesData from '../mock/devices.json';
import sensorReadingsData from '../mock/sensorReadings.json';
import alertsData from '../mock/alerts.json';
import auditLogsData from '../mock/auditLogs.json';

// Local storage helpers so newly created items persist across refreshes
const SHIPMENTS_STORAGE_KEY = 'coldchain_shipments_v1';
const DEVICES_STORAGE_KEY = 'coldchain_devices_v1';
const READINGS_STORAGE_KEY = 'coldchain_readings_v1';
const AUDIT_STORAGE_KEY = 'coldchain_audit_v1';

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
    console.warn(`Failed to save to localStorage (${key}):`, err);
  }
}

// In-memory data store initialized from localStorage or json mock
let activeShipments = loadStored(SHIPMENTS_STORAGE_KEY, [...shipmentsData]);
let activeDevices = loadStored(DEVICES_STORAGE_KEY, [...devicesData]);
let activeReadings = loadStored(READINGS_STORAGE_KEY, [...sensorReadingsData]);
let activeAuditLogs = loadStored(AUDIT_STORAGE_KEY, [...auditLogsData]);

// Simulate network delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  // ── Shipments ──────────────────────────────────────────
  getShipments: async () => {
    await delay(350);
    return [...activeShipments];
  },

  getShipmentById: async (id) => {
    await delay(250);
    return activeShipments.find((s) => s.id === id) ?? null;
  },

  createShipment: async (shipmentInput) => {
    await delay(500);

    // Auto-generate ID if not provided (e.g. SHIP-006)
    const nextNum = activeShipments.length + 1;
    const id = shipmentInput.id?.trim() || `SHIP-${String(nextNum).padStart(3, '0')}`;

    const newShipment = {
      id,
      origin: shipmentInput.origin || 'Mumbai Central Depot',
      destination: shipmentInput.destination || 'Regional Cold Hub',
      vaccineType: shipmentInput.vaccineType || 'Pfizer-BioNTech (mRNA)',
      tempRange: {
        min: Number(shipmentInput.tempRange?.min ?? -80),
        max: Number(shipmentInput.tempRange?.max ?? -60),
      },
      status: shipmentInput.status || 'in-transit',
      deviceId: shipmentInput.deviceId || null,
      createdBy: shipmentInput.createdBy || 'admin@coldchain.in',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedArrival: shipmentInput.estimatedArrival || new Date(Date.now() + 86400000 * 2).toISOString(),
      doses: Number(shipmentInput.doses) || 5000,
    };

    activeShipments = [newShipment, ...activeShipments];
    saveStored(SHIPMENTS_STORAGE_KEY, activeShipments);

    // Link device if chosen
    if (newShipment.deviceId) {
      activeDevices = activeDevices.map((d) =>
        d.id === newShipment.deviceId
          ? { ...d, assignedShipmentId: newShipment.id, status: 'online' }
          : d
      );
      saveStored(DEVICES_STORAGE_KEY, activeDevices);
    }

    // Generate initial sensor readings so shipment detail view charts work immediately
    const midTemp = Number(((newShipment.tempRange.min + newShipment.tempRange.max) / 2).toFixed(1));
    const initialReadings = [
      {
        id: `R-${id}-01`,
        shipmentId: id,
        deviceId: newShipment.deviceId || 'ESP32-GEN',
        temperature: midTemp,
        humidity: 50.2,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isValid: true,
        hash: 'hash-init-' + id + '-01',
        prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
      },
      {
        id: `R-${id}-02`,
        shipmentId: id,
        deviceId: newShipment.deviceId || 'ESP32-GEN',
        temperature: Number((midTemp + 0.3).toFixed(1)),
        humidity: 49.8,
        timestamp: new Date().toISOString(),
        isValid: true,
        hash: 'hash-init-' + id + '-02',
        prevHash: 'hash-init-' + id + '-01',
      },
    ];
    activeReadings = [...activeReadings, ...initialReadings];
    saveStored(READINGS_STORAGE_KEY, activeReadings);

    // Add audit log entry
    const auditEntry = {
      id: `LOG-${Date.now()}`,
      shipmentId: id,
      action: 'SHIPMENT_CREATED',
      details: `New shipment created with ${newShipment.doses?.toLocaleString()} doses of ${newShipment.vaccineType}. Assigned device: ${newShipment.deviceId || 'None'}`,
      actor: newShipment.createdBy,
      createdAt: new Date().toISOString(),
      hash: 'audit-hash-' + Date.now(),
    };
    activeAuditLogs = [auditEntry, ...activeAuditLogs];
    saveStored(AUDIT_STORAGE_KEY, activeAuditLogs);

    return newShipment;
  },

  // ── Devices ────────────────────────────────────────────
  getDevices: async () => {
    await delay(350);
    return [...activeDevices];
  },

  createDevice: async (deviceInput) => {
    await delay(500);

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const id = deviceInput.id?.trim() || `ESP32-${randomSuffix}`;

    const newDevice = {
      id,
      name: deviceInput.name?.trim() || `Sensor Node ${id}`,
      status: deviceInput.status || 'online',
      lastSeenAt: new Date().toISOString(),
      assignedShipmentId: deviceInput.assignedShipmentId || null,
      firmware: deviceInput.firmware?.trim() || 'v2.1.4',
      battery: Number(deviceInput.battery ?? 100),
      signalStrength: deviceInput.signalStrength ? Number(deviceInput.signalStrength) : -55,
      sensorModel: deviceInput.sensorModel || 'ESP32 + DHT22',
    };

    activeDevices = [newDevice, ...activeDevices];
    saveStored(DEVICES_STORAGE_KEY, activeDevices);

    // If assigned to a shipment, update the shipment's deviceId
    if (newDevice.assignedShipmentId) {
      activeShipments = activeShipments.map((s) =>
        s.id === newDevice.assignedShipmentId
          ? { ...s, deviceId: newDevice.id }
          : s
      );
      saveStored(SHIPMENTS_STORAGE_KEY, activeShipments);
    }

    // Add audit log entry
    const auditEntry = {
      id: `LOG-${Date.now()}`,
      shipmentId: newDevice.assignedShipmentId || 'N/A',
      action: 'DEVICE_REGISTERED',
      details: `Registered IoT device ${newDevice.id} (${newDevice.name}) with firmware ${newDevice.firmware}`,
      actor: 'admin@coldchain.in',
      createdAt: new Date().toISOString(),
      hash: 'audit-hash-' + Date.now(),
    };
    activeAuditLogs = [auditEntry, ...activeAuditLogs];
    saveStored(AUDIT_STORAGE_KEY, activeAuditLogs);

    return newDevice;
  },

  // ── Sensor Readings ────────────────────────────────────
  getSensorReadings: async (shipmentId) => {
    await delay(350);
    const readings = activeReadings.filter((r) => r.shipmentId === shipmentId);
    return [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  // ── Alerts ─────────────────────────────────────────────
  getAlerts: async () => {
    await delay(350);
    return [...alertsData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Audit Logs ─────────────────────────────────────────
  getAuditLogs: async (shipmentId) => {
    await delay(350);
    const logs = shipmentId
      ? activeAuditLogs.filter((l) => l.shipmentId === shipmentId)
      : activeAuditLogs;
    return [...logs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // ── Auth ───────────────────────────────────────────────
  login: async (email, password) => {
    await delay(800);
    if (email === 'admin@coldchain.in' && password === 'password') {
      return { token: 'mock-jwt-token', user: { name: 'Arjun Sharma', role: 'admin', email } };
    }
    if (email === 'operator@coldchain.in' && password === 'password') {
      return { token: 'mock-jwt-token-op', user: { name: 'Priya Menon', role: 'operator', email } };
    }
    throw new Error('Invalid credentials');
  },

  logout: async () => {
    await delay(200);
    return { success: true };
  },
};
