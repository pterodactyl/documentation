import { useSyncExternalStore } from 'react';

/* ==================================================================== *
 * Browser storage
 *
 * Each store keeps one JSON value under a namespaced key, survives
 * reloads, and follows changes made in other tabs. The server and the
 * first client render use the fallback, so hydration matches.
 * ==================================================================== */

export function createStore<T>(key: string, fallback: T, sanitize: (value: unknown) => T) {
  let current = fallback;
  let loaded = false;

  const read = (): T => {
    if (!loaded && typeof window !== 'undefined') {
      loaded = true;
      try {
        const raw = window.localStorage.getItem(key);
        current = raw === null ? fallback : sanitize(JSON.parse(raw));
      } catch {
        // Private windows and blocked storage keep the current value.
      }
    }

    return current;
  };

  const write = (next: T): void => {
    current = next;
    loaded = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // The value still applies for this page view.
    }
    window.dispatchEvent(new Event(key));
  };

  const subscribe = (callback: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== key) return;
      loaded = false;
      callback();
    };
    window.addEventListener(key, callback);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener(key, callback);
      window.removeEventListener('storage', onStorage);
    };
  };

  const server = () => fallback;

  return { read, write, subscribe, server };
}
