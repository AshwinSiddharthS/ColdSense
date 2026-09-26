import { useEffect, useRef, useCallback } from 'react';

/**
 * usePolling – repeatedly calls `fn` every `intervalMs` milliseconds.
 *
 * @param {Function} fn           – async function to call on each tick
 * @param {number}   intervalMs   – polling interval in ms (default: 7000)
 * @param {boolean}  enabled      – set false to pause polling (default: true)
 *
 * Usage:
 *   usePolling(async () => {
 *     const data = await api.getSomething();
 *     setData(data);
 *   }, 7000);
 *
 * Notes:
 *   - Calls `fn` immediately on mount, then again every `intervalMs`.
 *   - Cleans up the interval when the component unmounts or deps change.
 *   - If a call is still in-flight when the interval fires, the new call
 *     is skipped to avoid overlapping requests.
 */
export function usePolling(fn, intervalMs = 7000, enabled = true) {
  const fnRef = useRef(fn);
  const inFlight = useRef(false);

  // Always keep latest fn ref so we don't stale-close over it
  useEffect(() => { fnRef.current = fn; }, [fn]);

  const tick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await fnRef.current();
    } catch (err) {
      console.error('[usePolling] error:', err);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Fire immediately
    tick();

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [tick, intervalMs, enabled]);
}
