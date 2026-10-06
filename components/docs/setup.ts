import { useSyncExternalStore } from 'react';

/**
 * The reader's installation, entered once in a <SetupPanel /> and remembered in
 * the browser. Code blocks and <ShowFor /> sections read it to show commands
 * and configuration files that match.
 */
export type WebServer = 'nginx' | 'apache' | 'caddy';
export type OperatingSystem = 'ubuntu-24.04' | 'ubuntu-22.04' | 'debian-13' | 'debian-12' | 'debian-11';
export const OPERATING_SYSTEMS: readonly OperatingSystem[] = ['ubuntu-24.04', 'ubuntu-22.04', 'debian-13', 'debian-12', 'debian-11'];

export interface Setup {
  domain: string;
  os: OperatingSystem;
  webserver: WebServer;
  ssl: boolean;
  php: string;
  path: string;
}

export const DEFAULT_PATH = '/var/www/pterodactyl';
export const DEFAULT_PHP = '8.3';
export const PHP_VERSIONS = ['8.3', '8.4'] as const;

export const DEFAULT_SETUP: Setup = {
  domain: '',
  os: 'ubuntu-24.04',
  webserver: 'nginx',
  ssl: true,
  php: DEFAULT_PHP,
  path: DEFAULT_PATH,
};

const STORAGE_KEY = 'pterodactyl-docs:setup';
const CHANGE_EVENT = 'pterodactyl-docs:setup';

let current: Setup = DEFAULT_SETUP;
let loaded = false;

function sanitize(value: unknown): Setup {
  const input = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof Setup, unknown>>;
  const text = (v: unknown, fallback: string) => (typeof v === 'string' ? v.trim().slice(0, 253) : fallback);

  return {
    domain: text(input.domain, '').replace(/[^A-Za-z0-9.:\-[\]]/g, ''),
    os: OPERATING_SYSTEMS.includes(input.os as OperatingSystem) ? (input.os as OperatingSystem) : 'ubuntu-24.04',
    webserver: input.webserver === 'apache' || input.webserver === 'caddy' ? input.webserver : 'nginx',
    ssl: input.ssl !== false,
    php: PHP_VERSIONS.includes(input.php as (typeof PHP_VERSIONS)[number]) ? (input.php as string) : DEFAULT_PHP,
    // Kept as typed (a trailing slash is normal mid-word); cleaned up when applied.
    path: text(input.path, DEFAULT_PATH).replace(/[^A-Za-z0-9._\/-]/g, ''),
  };
}

/** The install directory as it goes into commands: absolute, without a trailing slash. */
export function installPath(setup: Setup): string {
  const path = setup.path.replace(/\/+$/, '');

  return path.startsWith('/') && path.length > 1 ? path : DEFAULT_PATH;
}

function read(): Setup {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) current = sanitize(JSON.parse(raw));
    } catch {
      // Private windows and blocked storage fall back to the defaults.
    }
  }

  return current;
}

export function updateSetup(patch: Partial<Setup>): void {
  current = sanitize({ ...read(), ...patch });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // The setup still applies for this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetSetup(): void {
  updateSetup(DEFAULT_SETUP);
}

function subscribe(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    loaded = false;
    callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** The current setup. The server and the first client render use the defaults, so hydration matches. */
export function useSetup(): Setup {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_SETUP);
}

/**
 * Fill the reader's values into a command or configuration file. The docs are
 * written with `<domain>`, `php8.3` and `/var/www/pterodactyl`; anything the
 * reader has not set stays as written.
 */
export function applySetup(code: string, setup: Setup): string {
  let result = code;
  if (setup.domain) result = result.replaceAll('<domain>', setup.domain);
  if (setup.php !== DEFAULT_PHP) result = result.replaceAll(`php${DEFAULT_PHP}`, `php${setup.php}`);
  const path = installPath(setup);
  if (path !== DEFAULT_PATH) result = result.replaceAll(DEFAULT_PATH, path);

  return result;
}
