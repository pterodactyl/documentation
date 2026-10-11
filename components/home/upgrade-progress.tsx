'use client';

import Link from 'next/link';
import { STEP_GROUPS, STEPS, useCompletedSteps } from '@/components/docs/upgrade-steps';

const PAGE = '/v2/upgrading/upgrading-from-v1';

/**
 * The upgrade from 1.x as one instrument: its twelve steps as cells in their
 * three groups, lit where the reader has ticked them on the checklist (saved in
 * this browser), and the next one named. Untouched, it is the map of the
 * upgrade; part-way through, it is where to pick up.
 */
export function UpgradeProgress() {
  const completed = useCompletedSteps();
  const done = new Set(completed);
  const next = STEPS.find((step) => !done.has(step.id));
  const started = done.size > 0;

  return (
    <div className="figure-card w-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-ui text-fg-strong">
          <span className={`status-dot ${!next ? 'is-running' : started ? 'is-starting' : ''}`} aria-hidden="true" />
          Upgrade to 2.0
        </p>
        <p className="font-mono text-mono-sm text-fg-faint tabular-nums">
          {done.size} / {STEPS.length}
        </p>
      </div>

      <ol className="grid gap-4 px-4 py-5 sm:px-5">
        {STEP_GROUPS.map((group, g) => {
          const steps = STEPS.filter((step) => step.group === g);
          return (
            <li key={group}>
              <p className="mb-2 text-ui-sm text-fg-subtle">{group}</p>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
                {steps.map((step) => {
                  const isDone = done.has(step.id);
                  const isNext = step === next;
                  return (
                    <li key={step.id}>
                      <Link
                        href={`${PAGE}#${step.anchor}`}
                        title={step.title}
                        aria-label={`${step.title}${isDone ? ', done' : isNext ? ', next' : ''}`}
                        className={[
                          'block h-2.5 rounded-[3px] transition-colors duration-300',
                          isDone ? 'bg-green shadow-[0_0_10px_color-mix(in_srgb,var(--color-green)_45%,transparent)]' : isNext ? 'bg-yellow' : 'bg-surface-raised hover:bg-fg-ghost',
                        ].join(' ')}
                      />
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <div className="border-t border-hairline px-4 py-4 sm:px-5">
        {next ? (
          <Link href={`${PAGE}#${next.anchor}`} className="group flex items-baseline justify-between gap-4">
            <span className="min-w-0">
              <span className="block text-ui-sm text-fg-subtle">{started ? 'Next step' : 'First step'}</span>
              <span className="mt-0.5 block truncate text-entry text-white">{next.title}</span>
            </span>
            <span className="shrink-0 font-mono text-mono-sm text-fg-faint transition-colors group-hover:text-white">{next.hint}</span>
          </Link>
        ) : (
          <p className="text-entry text-white">Upgrade complete. Keep your 1.x files until you are sure.</p>
        )}
      </div>
    </div>
  );
}
