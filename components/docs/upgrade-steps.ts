import { useSyncExternalStore } from 'react';
import { createStore } from './store';

/**
 * The steps of Upgrading From 1.x, in the order the page gives them, and the
 * reader's progress through them (saved in this browser). The checklist on
 * that page ticks them; the front page shows how far along the reader is.
 * Each anchor is the id of that step's heading on the page.
 */
export interface UpgradeStep {
  id: string;
  group: 0 | 1 | 2;
  title: string;
  anchor: string;
  /** Filled in with the reader's install directory and PHP version. */
  hint: string;
}

export const STEP_GROUPS = ['Before you upgrade', 'Upgrade', 'After upgrading'] as const;

export const STEPS: readonly UpgradeStep[] = [
  { id: 'latest-1x', group: 0, title: 'Update to the latest 1.x release', anchor: 'update-to-the-latest-1x-release', hint: 'Panel 1.12.0 or newer' },
  { id: 'intl', group: 0, title: 'Install the intl PHP extension', anchor: 'install-the-intl-php-extension', hint: 'php8.3-intl' },
  { id: 'billing', group: 0, title: 'Update your billing module', anchor: 'update-your-billing-module', hint: 'Skip if you have none' },
  { id: 'maintenance', group: 1, title: 'Enter maintenance mode', anchor: 'enter-maintenance-mode', hint: 'php artisan down' },
  { id: 'backup', group: 1, title: 'Back up your Panel', anchor: 'back-up-your-panel', hint: 'Database, .env, files' },
  { id: 'download', group: 1, title: 'Download 2.0', anchor: 'download-20', hint: '/var/www/pterodactyl-2.0' },
  { id: 'dependencies', group: 1, title: 'Install dependencies', anchor: 'install-dependencies', hint: 'Composer, then npm' },
  { id: 'migrate', group: 1, title: 'Migrate the database', anchor: 'migrate-the-database', hint: 'php artisan migrate' },
  { id: 'switch', group: 1, title: 'Switch to 2.0', anchor: 'switch-to-20', hint: 'Swap, add /assets/' },
  { id: 'online', group: 1, title: 'Exit maintenance mode', anchor: 'exit-maintenance-mode', hint: 'php artisan up' },
  { id: 'egg-tags', group: 2, title: 'Review egg tags', anchor: 'review-egg-tags', hint: 'Admin → Eggs' },
  { id: 'keep-1x', group: 2, title: 'Keep your 1.x files', anchor: 'keep-your-1x-files', hint: '/var/www/pterodactyl-1.x' },
];

export const STEP_IDS = STEPS.map((step) => step.id);
export const NO_STEPS: readonly string[] = [];

export const checklist = createStore<readonly string[]>('pterodactyl-docs:upgrade-checklist', NO_STEPS, (value) =>
  Array.isArray(value) ? STEP_IDS.filter((id) => value.includes(id)) : NO_STEPS,
);

export function useCompletedSteps(): readonly string[] {
  return useSyncExternalStore(checklist.subscribe, checklist.read, checklist.server);
}
