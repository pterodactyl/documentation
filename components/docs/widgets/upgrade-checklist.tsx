'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { applySetup, useSetup } from '../setup';
import { Button, Label, Segmented, Status, Widget } from '../widget';

/* ==================================================================== *
 * Browser storage
 *
 * Each store keeps one JSON value under a namespaced key, survives
 * reloads, and follows changes made in other tabs. The server and the
 * first client render use the fallback, so hydration matches.
 * ==================================================================== */

function createStore<T>(key: string, fallback: T, sanitize: (value: unknown) => T) {
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

/* ==================================================================== *
 * Shared pieces
 * ==================================================================== */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
      aria-hidden="true"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

/** The visible box of a checkbox. Place it right after an `sr-only peer` input. */
function Box({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
        checked ? 'border-accent bg-accent-soft text-accent' : 'border-hairline-strong bg-surface text-transparent'
      }`}
    >
      <CheckIcon />
    </span>
  );
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-1.5 overflow-hidden rounded-full bg-surface-raised"
    >
      <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

const linkClass = 'text-white underline decoration-fg-dim underline-offset-4 hover:decoration-accent';

/* ==================================================================== *
 * Upgrade checklist
 *
 * The steps of Upgrading From 1.x, in the order the page gives them.
 * Each anchor is the id of that step's heading on the page.
 * ==================================================================== */

interface UpgradeStep {
  id: string;
  group: 0 | 1 | 2;
  title: string;
  anchor: string;
  /** Filled in with the reader's install directory and PHP version. */
  hint: string;
}

const STEP_GROUPS = ['Before you upgrade', 'Upgrade', 'After upgrading'] as const;

const STEPS: readonly UpgradeStep[] = [
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

const STEP_IDS = STEPS.map((step) => step.id);
const NO_STEPS: readonly string[] = [];

const checklist = createStore<readonly string[]>('pterodactyl-docs:upgrade-checklist', NO_STEPS, (value) =>
  Array.isArray(value) ? STEP_IDS.filter((id) => value.includes(id)) : NO_STEPS,
);

function useCompletedSteps(): readonly string[] {
  return useSyncExternalStore(checklist.subscribe, checklist.read, checklist.server);
}

function setStep(id: string, done: boolean): void {
  const current = new Set(checklist.read());
  if (done) current.add(id);
  else current.delete(id);
  checklist.write(STEP_IDS.filter((stepId) => current.has(stepId)));
}

/**
 * A checklist of the upgrade's steps with a progress bar. Progress is saved in
 * this browser. Once the reader scrolls past it, a small bar at the bottom of
 * the window keeps the progress and the next step in view.
 */
export function UpgradeChecklist() {
  const setup = useSetup();
  const completed = useCompletedSteps();
  const done = new Set(completed);
  const next = STEPS.find((step) => !done.has(step.id));

  const frame = useRef<HTMLDivElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const node = frame.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(([entry]) => {
      setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={frame} id="upgrade-checklist" className="scroll-mt-24">
      <Widget
        title="Upgrade checklist"
        description="Tick each step when you finish it. Your progress is saved in this browser."
        actions={
          <Button onClick={() => checklist.write(NO_STEPS)} disabled={done.size === 0}>
            Reset
          </Button>
        }
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-note text-fg-subtle" aria-live="polite">
            <span className="font-mono text-mono-lg text-white">{done.size}</span> of {STEPS.length} steps done
          </p>
          {next ? (
            <p className="min-w-0 truncate text-note text-fg-subtle">
              Next:{' '}
              <a href={`#${next.anchor}`} className={linkClass}>
                {next.title}
              </a>
            </p>
          ) : (
            <Status tone="green">All steps done</Status>
          )}
        </div>
        <div className="mt-3">
          <ProgressBar value={done.size} max={STEPS.length} label="Upgrade progress" />
        </div>

        <div className="mt-5 space-y-4">
          {STEP_GROUPS.map((group, index) => (
            <div key={group}>
              <Label>{group}</Label>
              <ul className="-mx-2">
                {STEPS.filter((step) => step.group === index).map((step) => {
                  const checked = done.has(step.id);
                  return (
                    <li key={step.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface">
                      <label className="-m-1 flex cursor-pointer items-center p-1">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={checked}
                          onChange={(event) => setStep(step.id, event.target.checked)}
                          aria-label={`${step.title}: done`}
                        />
                        <Box checked={checked} />
                      </label>
                      <a
                        href={`#${step.anchor}`}
                        className={`min-w-0 flex-1 truncate text-note transition-colors ${
                          checked ? 'text-fg-faint line-through decoration-fg-dim' : 'text-fg-strong hover:text-white'
                        }`}
                      >
                        {step.title}
                      </a>
                      {step === next && <span className="shrink-0 font-mono text-mono-xs uppercase tracking-wider text-accent">Next</span>}
                      <span className="hidden max-w-[45%] shrink-0 truncate font-mono text-mono-sm text-fg-faint sm:block">
                        {applySetup(step.hint, setup)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Widget>

      {scrolledPast && next && done.size > 0 && (
        <div className="not-prose pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full border border-hairline-strong bg-surface-raised-flat py-2 pr-4 pl-3 shadow-lg">
            <a href="#upgrade-checklist" className="flex shrink-0 items-center gap-2" aria-label="Back to the upgrade checklist">
              <span className="font-mono text-mono-md text-fg-strong">
                {done.size}/{STEPS.length}
              </span>
              <span className="block w-12">
                <ProgressBar value={done.size} max={STEPS.length} label="Upgrade progress" />
              </span>
            </a>
            <span className="min-w-0 truncate text-ui-sm text-fg-subtle">
              Next:{' '}
              <a href={`#${next.anchor}`} className="text-white hover:underline">
                {next.title}
              </a>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Ticks one step of the upgrade checklist from inside its section, so the
 * reader does not have to scroll back up. `step` is a checklist step id.
 */
export function StepDone({ step }: { step: string }) {
  const completed = useCompletedSteps();
  const item = STEPS.find((candidate) => candidate.id === step);
  if (!item) return null;

  const checked = completed.includes(item.id);
  const next = STEPS.find((candidate) => !completed.includes(candidate.id));

  return (
    <div className="not-prose my-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-ui-sm transition-colors ${
          checked ? 'border-accent/40 bg-accent-soft text-fg-strong' : 'border-hairline text-fg-muted hover:border-hairline-strong hover:text-white'
        }`}
      >
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => setStep(item.id, event.target.checked)} />
        <Box checked={checked} />
        {checked ? 'Step done' : 'Mark this step done'}
      </label>
      <span className="font-mono text-mono-sm text-fg-faint" aria-live="polite">
        {completed.length} of {STEPS.length} steps done
      </span>
      {checked && next && (
        <span className="text-ui-sm text-fg-subtle">
          Next:{' '}
          <a href={`#${next.anchor}`} className={linkClass}>
            {next.title}
          </a>
        </span>
      )}
      {checked && !next && <Status tone="green">All steps done</Status>}
    </div>
  );
}

/* ==================================================================== *
 * Impact index
 *
 * The changes on Changes From 1.x, grouped by likelihood of impact. A few
 * questions about the reader's Panel mark the ones that apply. Each anchor
 * is the id of that change's heading on the page.
 * ==================================================================== */

type Impact = 'high' | 'medium' | 'low';
type Install = 'native' | 'docker';
type Factor = 'api' | 'eggs' | 'modified' | 'database';

interface Answers {
  install: Install;
  factors: readonly Factor[];
}

const FACTORS: ReadonlyArray<{ id: Factor; label: string }> = [
  { id: 'api', label: 'I use a billing module or the Application API' },
  { id: 'eggs', label: 'I have custom eggs or nests' },
  { id: 'modified', label: 'I changed Panel files, such as a theme, an addon, or code' },
  { id: 'database', label: 'My database is older than MariaDB 10.11 or MySQL 8' },
];

const FACTOR_IDS = FACTORS.map((factor) => factor.id);

interface Change {
  anchor: string;
  impact: Impact;
  title: string;
  /** What to do about it. Filled in with the reader's PHP version. */
  action: string;
  applies: (answers: Answers) => boolean;
}

const native = (answers: Answers) => answers.install === 'native';
const has = (factor: Factor) => (answers: Answers) => answers.factors.includes(factor);

const CHANGES: readonly Change[] = [
  {
    anchor: 'php-83-and-the-intl-extension',
    impact: 'high',
    title: 'PHP 8.3 and the intl extension',
    action: 'Install php8.3-intl before you upgrade.',
    applies: native,
  },
  {
    anchor: 'upgrading-with-pupgrade',
    impact: 'high',
    title: 'Upgrading with p:upgrade',
    action: 'Install 2.0 in a new directory instead.',
    applies: native,
  },
  {
    anchor: 'nest-endpoints-removed-from-the-application-api',
    impact: 'high',
    title: 'Nest endpoints removed from the Application API',
    action: 'Update your billing module before you upgrade.',
    applies: has('api'),
  },
  {
    anchor: 'the-assets-web-server-block',
    impact: 'medium',
    title: 'The /assets/ web server block',
    action: 'Add the block to your web server configuration.',
    applies: native,
  },
  {
    anchor: 'nests-are-replaced-by-tags',
    impact: 'medium',
    title: 'Nests are replaced by tags',
    action: 'Check the tags on your eggs after the upgrade.',
    applies: has('eggs'),
  },
  {
    anchor: 'changes-to-1x-panel-files',
    impact: 'medium',
    title: 'Changes to 1.x Panel files',
    action: 'Rebuild them as a theme or an extension.',
    applies: has('modified'),
  },
  {
    anchor: 'database-versions',
    impact: 'medium',
    title: 'Database versions',
    action: 'Upgrade your database server first.',
    applies: has('database'),
  },
  {
    anchor: 'admin-api',
    impact: 'low',
    title: 'Admin API',
    action: 'Nothing to change. The Client and Application API paths stay the same.',
    applies: has('api'),
  },
  {
    anchor: 'building-the-frontend',
    impact: 'low',
    title: 'Building the frontend',
    action: 'Build it with npm and Node.js 22.12 or newer.',
    applies: (answers) => native(answers) || has('modified')(answers),
  },
  {
    anchor: 'docker-image',
    impact: 'low',
    title: 'Docker image',
    action: 'Run migrations yourself as part of each deployment.',
    applies: (answers) => answers.install === 'docker',
  },
];

const IMPACTS: ReadonlyArray<{ id: Impact; label: string; tone: 'red' | 'yellow' | 'blue' }> = [
  { id: 'high', label: 'High', tone: 'red' },
  { id: 'medium', label: 'Medium', tone: 'yellow' },
  { id: 'low', label: 'Low', tone: 'blue' },
];

const DEFAULT_ANSWERS: Answers = { install: 'native', factors: [] };

const answersStore = createStore<Answers>('pterodactyl-docs:impact-index', DEFAULT_ANSWERS, (value) => {
  const input = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof Answers, unknown>>;
  const factors = Array.isArray(input.factors) ? input.factors : [];

  return {
    install: input.install === 'docker' ? 'docker' : 'native',
    factors: FACTOR_IDS.filter((id) => factors.includes(id)),
  };
});

function useAnswers(): Answers {
  return useSyncExternalStore(answersStore.subscribe, answersStore.read, answersStore.server);
}

function toggleFactor(factor: Factor, on: boolean): void {
  const current = answersStore.read();
  const factors = new Set(current.factors);
  if (on) factors.add(factor);
  else factors.delete(factor);
  answersStore.write({ ...current, factors: FACTOR_IDS.filter((id) => factors.has(id)) });
}

/**
 * The 1.x to 2.0 changes by likelihood of impact, with a few questions that
 * mark the changes that apply to the reader's Panel. `page` is the path of
 * Changes From 1.x when the index is placed on another page.
 */
export function ImpactIndex({ page = '' }: { page?: string }) {
  const setup = useSetup();
  const answers = useAnswers();
  const applying = CHANGES.filter((change) => change.applies(answers));

  return (
    <Widget
      title="Does this affect you?"
      description="Answer a few questions about your Panel to see which changes apply. Your answers are saved in this browser."
      actions={
        <Button onClick={() => answersStore.write(DEFAULT_ANSWERS)} disabled={answers.install === 'native' && answers.factors.length === 0}>
          Reset
        </Button>
      }
    >
      <div className="space-y-5">
        <div>
          <Label>How you run the Panel</Label>
          <Segmented<Install>
            label="How you run the Panel"
            value={answers.install}
            onChange={(install) => answersStore.write({ ...answers, install })}
            options={[
              { value: 'native', label: 'Native installation' },
              { value: 'docker', label: 'Docker image' },
            ]}
          />
        </div>

        <div>
          <Label>About your Panel</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {FACTORS.map((factor) => {
              const checked = answers.factors.includes(factor.id);
              return (
                <label
                  key={factor.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-note transition-colors ${
                    checked ? 'border-accent/40 bg-accent-soft text-fg-strong' : 'border-hairline text-fg-muted hover:border-hairline-strong hover:text-fg-strong'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(event) => toggleFactor(factor.id, event.target.checked)}
                  />
                  <span className="mt-0.5">
                    <Box checked={checked} />
                  </span>
                  {factor.label}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-hairline pt-5">
        <p className="text-note text-fg-subtle" aria-live="polite">
          <span className="text-title text-white">{applying.length}</span> of {CHANGES.length} changes apply to you
        </p>

        {answers.install === 'docker' && (
          <p className="mt-2 text-note text-fg-subtle">
            Moving a 1.x database into the 2.0 Docker image has not been tested yet. See{' '}
            <a href="/v2/panel/docker" className={linkClass}>
              Docker Deployment
            </a>
            .
          </p>
        )}

        <div className="mt-4 space-y-5">
          {IMPACTS.map((impact) => {
            const changes = CHANGES.filter((change) => change.impact === impact.id);
            const count = changes.filter((change) => change.applies(answers)).length;

            return (
              <div key={impact.id}>
                <div className="mb-1.5 flex items-center gap-2">
                  <Status tone={impact.tone}>{impact.label}</Status>
                  <span className="text-ui-sm text-fg-faint">
                    {count} of {changes.length} apply
                  </span>
                </div>
                <ul className="-mx-3">
                  {changes.map((change) => {
                    const applies = change.applies(answers);
                    return (
                      <li key={change.anchor}>
                        <a
                          href={`${page}#${change.anchor}`}
                          className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised"
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-[0.4rem] size-2 shrink-0 rounded-full ${applies ? 'bg-accent' : 'border border-fg-dim'}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className={`block text-note ${applies ? 'text-white' : 'text-fg-faint'}`}>{change.title}</span>
                            {applies && <span className="block text-ui-sm text-fg-subtle">{applySetup(change.action, setup)}</span>}
                          </span>
                          {applies ? (
                            <span className="shrink-0 font-mono text-mono-sm text-accent">Applies</span>
                          ) : (
                            <span className="sr-only">Does not apply</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-5 border-t border-hairline pt-4 text-note text-fg-subtle">
          On our test installation, the database migration took less than ten seconds. To see how long your own upgrade takes, time a run on a copy of
          your Panel first. See{' '}
          <a href="/v2/upgrading/testing-the-upgrade" className={linkClass}>
            Testing the Upgrade
          </a>
          .
        </p>
      </div>
    </Widget>
  );
}
