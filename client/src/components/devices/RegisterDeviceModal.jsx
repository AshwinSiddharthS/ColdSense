import React, { useState, useEffect } from 'react';
import { Cpu, Radio, BatteryMedium, Signal, Check, AlertCircle, HardDrive, Truck } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../api';

const SENSOR_MODELS = [
  'ESP32 + DHT22 (Standard Temp & Humidity)',
  'ESP32 + DS18B20 (Ultra-Low Cryo Probe to -80°C)',
  'ESP32 Dual-Probe + GPS Tracking',
  'ESP32-S3 + Sensirion SHT31 (High Precision)',
];

export function RegisterDeviceModal({ open, onClose, onCreated }) {
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [sensorModel, setSensorModel] = useState(SENSOR_MODELS[0]);
  const [firmware, setFirmware] = useState('v2.1.4');
  const [battery, setBattery] = useState('100');
  const [signalStrength, setSignalStrength] = useState('-55');
  const [status, setStatus] = useState('online');
  const [assignedShipmentId, setAssignedShipmentId] = useState('');
  const [shipments, setShipments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate suggested ID and load shipments when opening
  useEffect(() => {
    if (open) {
      setError('');
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      setDeviceId(`ESP32-${randHex}`);
      setName(`Cold Unit ${randHex}`);
      api.getShipments().then((list) => {
        setShipments(list);
      }).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!deviceId.trim()) {
      setError('Please provide a Device Identifier.');
      return;
    }
    if (!name.trim()) {
      setError('Please provide a friendly Device Name.');
      return;
    }

    const batt = parseInt(battery, 10);
    if (isNaN(batt) || batt < 0 || batt > 100) {
      setError('Battery level must be between 0% and 100%.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createDevice({
        id: deviceId.trim().toUpperCase(),
        name: name.trim(),
        sensorModel,
        firmware: firmware.trim() || 'v2.1.4',
        battery: batt,
        signalStrength: parseInt(signalStrength, 10) || -55,
        status,
        assignedShipmentId: assignedShipmentId || null,
      });

      setSubmitting(false);
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to register device. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register New IoT Sensor Node"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            icon={Check}
          >
            Register Device
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Device ID & Device Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Device ID / MAC
            </label>
            <input
              type="text"
              placeholder="e.g. ESP32-A1B2"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60 uppercase"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-violet-400" /> Friendly Name
            </label>
            <input
              type="text"
              placeholder="e.g. Reefer Van 4 Sensor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
        </div>

        {/* Sensor Model & Firmware */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Hardware Configuration
            </label>
            <select
              value={sensorModel}
              onChange={(e) => setSensorModel(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
            >
              {SENSOR_MODELS.map((m) => (
                <option key={m} value={m} className="bg-[#11192e]">
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Firmware Version
            </label>
            <input
              type="text"
              placeholder="v2.1.4"
              value={firmware}
              onChange={(e) => setFirmware(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
        </div>

        {/* Status, Battery & Signal */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <BatteryMedium className="w-3.5 h-3.5 text-emerald-400" /> Battery (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={battery}
              onChange={(e) => setBattery(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Signal className="w-3.5 h-3.5 text-cyan-400" /> RSSI (dBm)
            </label>
            <input
              type="number"
              min="-120"
              max="-20"
              value={signalStrength}
              onChange={(e) => setSignalStrength(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        {/* Assigned Shipment (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-amber-400" /> Assign To Shipment (Optional)
          </label>
          <select
            value={assignedShipmentId}
            onChange={(e) => setAssignedShipmentId(e.target.value)}
            className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
          >
            <option value="">Do not assign yet (Standby Sensor)</option>
            {shipments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} — {s.vaccineType} ({s.origin} → {s.destination})
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
