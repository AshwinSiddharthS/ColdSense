import React, { useState, useEffect } from 'react';
import { Truck, Thermometer, Package, Calendar, Cpu, MapPin, AlertCircle, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { api } from '../../api';

const VACCINE_PRESETS = [
  { name: 'Pfizer-BioNTech (mRNA)', min: -80, max: -60, tag: 'Ultra-Cold Freezer' },
  { name: 'Moderna (mRNA-1273)', min: -25, max: -15, tag: 'Standard Freezer' },
  { name: 'Covishield (AstraZeneca)', min: 2, max: 8, tag: 'Refrigerated Cold Chain' },
  { name: 'Covaxin (Bharat Biotech)', min: 2, max: 8, tag: 'Refrigerated Cold Chain' },
  { name: 'Rotavirus Oral Vaccine', min: 2, max: 8, tag: 'Standard Cold' },
  { name: 'Insulin & Monoclonal Abs', min: 2, max: 8, tag: 'Standard Cold' },
  { name: 'Custom Profile...', min: 2, max: 8, tag: 'Custom Specification' },
];

export function NewShipmentModal({ open, onClose, onCreated }) {
  const [vaccineType, setVaccineType] = useState(VACCINE_PRESETS[0].name);
  const [minTemp, setMinTemp] = useState(VACCINE_PRESETS[0].min);
  const [maxTemp, setMaxTemp] = useState(VACCINE_PRESETS[0].max);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [doses, setDoses] = useState('5000');
  const [deviceId, setDeviceId] = useState('');
  const [status, setStatus] = useState('in-transit');
  const [estimatedDays, setEstimatedDays] = useState('2');
  const [devices, setDevices] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available devices
  useEffect(() => {
    if (open) {
      setError('');
      api.getDevices().then((devs) => {
        setDevices(devs);
        // Default to first available or first device
        const freeDevice = devs.find((d) => !d.assignedShipmentId);
        if (freeDevice) setDeviceId(freeDevice.id);
        else if (devs.length > 0) setDeviceId(devs[0].id);
      }).catch(() => {});
    }
  }, [open]);

  const handleVaccineChange = (name) => {
    setVaccineType(name);
    const preset = VACCINE_PRESETS.find((p) => p.name === name);
    if (preset && name !== 'Custom Profile...') {
      setMinTemp(preset.min);
      setMaxTemp(preset.max);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    const min = parseFloat(minTemp);
    const max = parseFloat(maxTemp);

    if (isNaN(min) || isNaN(max)) {
      setError('Please provide valid minimum and maximum temperatures.');
      return;
    }
    if (min >= max) {
      setError('Minimum temperature must be strictly lower than maximum temperature.');
      return;
    }
    if (!origin.trim()) {
      setError('Please enter shipment origin.');
      return;
    }
    if (!destination.trim()) {
      setError('Please enter destination.');
      return;
    }
    const numDoses = parseInt(doses, 10);
    if (isNaN(numDoses) || numDoses <= 0) {
      setError('Please enter a valid positive number of doses.');
      return;
    }

    try {
      setSubmitting(true);
      const estArrivalDate = new Date(Date.now() + (parseInt(estimatedDays, 10) || 2) * 86400000).toISOString();
      const created = await api.createShipment({
        vaccineType: vaccineType === 'Custom Profile...' ? 'Special Cold Spec' : vaccineType,
        tempRange: { min, max },
        origin: origin.trim(),
        destination: destination.trim(),
        doses: numDoses,
        deviceId: deviceId || null,
        status,
        estimatedArrival: estArrivalDate,
      });

      setSubmitting(false);
      onCreated?.(created);
      onClose?.();
    } catch (err) {
      setSubmitting(false);
      setError(err.message || 'Failed to create shipment. Please try again.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Cold Chain Shipment"
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
            Create Shipment
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

        {/* Vaccine Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Vaccine Cargo Profile
          </label>
          <select
            value={vaccineType}
            onChange={(e) => handleVaccineChange(e.target.value)}
            className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/60 transition-colors"
          >
            {VACCINE_PRESETS.map((p) => (
              <option key={p.name} value={p.name} className="bg-[#11192e] text-slate-200">
                {p.name} ({p.min}°C to {p.max}°C) — {p.tag}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature Thresholds */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-blue-400" />
              Allowed Temperature Thresholds (°C)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20 font-mono">
              Safe Zone: {minTemp}°C to {maxTemp}°C
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Min Safe Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                value={minTemp}
                onChange={(e) => setMinTemp(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Max Safe Temp (°C)</label>
              <input
                type="number"
                step="0.5"
                value={maxTemp}
                onChange={(e) => setMaxTemp(e.target.value)}
                className="w-full bg-[#0a0f1e] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Origin & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Origin Location
            </label>
            <input
              type="text"
              placeholder="e.g. Mumbai Central Depot"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> Destination Hub
            </label>
            <input
              type="text"
              placeholder="e.g. Delhi AIIMS Distribution"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
        </div>

        {/* Doses & Estimated Days */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-amber-400" /> Quantity (Doses)
            </label>
            <input
              type="number"
              min="100"
              step="100"
              value={doses}
              onChange={(e) => setDoses(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500/60"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-violet-400" /> Transit Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={estimatedDays}
              onChange={(e) => setEstimatedDays(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-blue-500/60"
            />
          </div>
        </div>

        {/* Assigned Device & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> Assigned IoT Monitor
            </label>
            <select
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="">No device assigned yet</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} — {d.name} {d.assignedShipmentId ? `(In ${d.assignedShipmentId})` : '(Available)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-cyan-400" /> Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[#11192e] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/60"
            >
              <option value="in-transit">In Transit (Active Monitoring)</option>
              <option value="pending">Pending (Awaiting Dispatch)</option>
            </select>
          </div>
        </div>
      </form>
    </Modal>
  );
}
