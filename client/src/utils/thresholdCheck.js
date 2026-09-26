/**
 * thresholdCheck – utilities for evaluating sensor readings against thresholds.
 * Used by Dashboard, Alerts, ShipmentDetail to colour-code values consistently.
 */

/**
 * Check whether a temperature value is within the shipment's allowed range.
 *
 * @param {number} temp       – current temperature reading (°C)
 * @param {object} tempRange  – { min: number, max: number }
 * @returns {'ok' | 'warning' | 'critical'}
 */
export function checkTemperature(temp, tempRange) {
  if (temp === null || temp === undefined || !tempRange) return 'ok';
  const { min, max } = tempRange;

  // More than 3°C outside range → critical
  if (temp > max + 3 || temp < min - 3) return 'critical';
  // Within 3°C of boundary → warning
  if (temp > max || temp < min) return 'warning';
  return 'ok';
}

/**
 * Check humidity (general safe range 30–70%).
 *
 * @param {number} humidity – RH %
 * @returns {'ok' | 'warning' | 'critical'}
 */
export function checkHumidity(humidity) {
  if (humidity === null || humidity === undefined) return 'ok';
  if (humidity < 20 || humidity > 85) return 'critical';
  if (humidity < 30 || humidity > 70) return 'warning';
  return 'ok';
}

/**
 * Map a status level to Tailwind colour tokens for text / border / bg.
 *
 * @param {'ok' | 'warning' | 'critical'} status
 * @returns {{ text: string, border: string, bg: string, badge: string }}
 */
export function statusColors(status) {
  switch (status) {
    case 'critical':
      return {
        text: 'text-red-400',
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        badge: 'red',
      };
    case 'warning':
      return {
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        badge: 'amber',
      };
    default:
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        badge: 'green',
      };
  }
}

/**
 * Resolve a shipment's overall health from its latest sensor reading.
 *
 * @param {object} reading    – latest SensorReading
 * @param {object} tempRange  – { min, max }
 * @returns {'ok' | 'warning' | 'critical'}
 */
export function shipmentHealth(reading, tempRange) {
  if (!reading) return 'ok';
  const temp = checkTemperature(reading.temperature, tempRange);
  const hum  = checkHumidity(reading.humidity);

  if (temp === 'critical' || hum === 'critical') return 'critical';
  if (temp === 'warning'  || hum === 'warning')  return 'warning';
  return 'ok';
}

/**
 * Map shipment status string → badge variant.
 */
export function shipmentStatusVariant(status) {
  switch (status) {
    case 'in-transit': return 'blue';
    case 'alert':      return 'red';
    case 'delivered':  return 'green';
    case 'pending':    return 'amber';
    default:           return 'slate';
  }
}
