import { useEffect, useRef, useState } from 'react';

// Everything is stored in the browser only — there is no backend in this prototype.
const PREFIX = 'marketdeal:';

export function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — prototype keeps working in memory */
  }
}

/**
 * State that survives reloads — and stays in sync with other windows on the same origin. The
 * MarketDeal Admin platform reads and writes these same keys (through public/bridge.html), so when
 * an admin approves a product or resolves a dispute the change lands here as a `storage` event.
 * `onExternal(prev, next)` fires only for changes made elsewhere (never for this tab's own writes),
 * which is how the storefront can toast "your listing was approved" without double-notifying.
 */
export function usePersistentState(key, initial, { onExternal } = {}) {
  const [value, setValue] = useState(() => readStorage(key, initial));
  const first = useRef(true);
  const latest = useRef(value);
  const initialRef = useRef(initial);
  const externalRef = useRef(onExternal);
  latest.current = value;
  externalRef.current = onExternal;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Skip the write when storage already holds exactly this value (i.e. it just arrived from
    // another window) — keeps two windows from bouncing the same update back and forth.
    try {
      const serialized = JSON.stringify(value);
      if (window.localStorage.getItem(PREFIX + key) === serialized) return;
      window.localStorage.setItem(PREFIX + key, serialized);
    } catch {
      /* storage unavailable — prototype keeps working in memory */
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== PREFIX + key) return;
      let next;
      try {
        next = e.newValue ? JSON.parse(e.newValue) : initialRef.current;
      } catch {
        return;
      }
      const prev = latest.current;
      setValue(next);
      externalRef.current?.(prev, next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue];
}
