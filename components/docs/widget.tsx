'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

/**
 * The frame every interactive piece in the docs sits in: a title, one line that
 * says what to do with it, and the widget itself. Keep widgets to one idea each.
 */
export function Widget({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="not-prose my-8 overflow-hidden rounded-xl border border-hairline-strong bg-surface-flat">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4">
        <div className="min-w-0">
          <p className="text-entry text-white">{title}</p>
          {description && <p className="mt-1 text-note text-fg-subtle">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** A small uppercase label above a group of controls. */
export function Label({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>;
}

/** Pick one of a few options. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: ReactNode }>;
  onChange: (value: T) => void;
  label: string;
}) {
  // One line, always: a narrow screen scrolls the control instead of wrapping it.
  return (
    <div className="inline-block max-w-full overflow-x-auto align-middle">
      <div role="radiogroup" aria-label={label} className="flex h-8 w-max items-stretch gap-0.5 rounded-lg border border-hairline bg-surface p-0.5">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={`whitespace-nowrap rounded-md px-3 text-ui-sm font-medium transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent ${
                active ? 'bg-surface-raised-flat text-white shadow-sm ring-1 ring-hairline-strong' : 'text-fg-subtle hover:text-fg-strong'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** A single-line text field. */
export function TextField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="text"
      spellCheck={false}
      autoComplete="off"
      {...props}
      className={`h-8 w-full rounded-lg border border-hairline bg-surface px-3 font-mono text-mono-md text-fg-strong placeholder:text-fg-ghost focus:border-accent focus:outline-none ${className}`}
    />
  );
}

/** A plain button in the widget style. `primary` takes the accent. */
export function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-ui-sm transition-colors disabled:opacity-40 ${
        primary ? 'bg-accent text-white hover:bg-accent/90' : 'border border-hairline text-fg-muted hover:border-hairline-strong hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/** A status word for data: green passes, red fails, yellow warns, blue informs. */
export function Status({ tone, children }: { tone: 'green' | 'red' | 'yellow' | 'blue'; children: ReactNode }) {
  const tones = {
    green: 'text-green bg-green/10',
    red: 'text-red bg-red/10',
    yellow: 'text-yellow bg-yellow/10',
    blue: 'text-blue bg-blue/10',
  } as const;

  return <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-mono-sm ${tones[tone]}`}>{children}</span>;
}

/** Monospace output, for rendered commands and results. */
export function Output({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-hairline bg-black p-4 font-mono text-mono-lg leading-relaxed text-fg-strong">
      {children}
    </pre>
  );
}
