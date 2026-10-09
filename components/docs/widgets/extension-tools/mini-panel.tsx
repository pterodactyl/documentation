'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

/**
 * A few of the Panel's building blocks, redrawn in the docs' own colours. They are a sketch
 * of the Panel, not a copy: enough to show where an extension's UI lands and how it looks
 * next to the native parts.
 */

/** The Panel's window: a thin top bar and a content area. */
export function PanelFrame({ children, nav }: { children: ReactNode; nav?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline-strong bg-black">
      <div className="flex h-9 items-center justify-between border-b border-hairline px-3">
        <span className="text-ui-sm font-semibold text-fg-strong">Pterodactyl</span>
        <span className="size-5 rounded-full bg-surface-raised-flat ring-1 ring-hairline-strong" aria-hidden />
      </div>
      {nav}
      <div className="space-y-3 p-3">{children}</div>
    </div>
  );
}

/** The Panel's TitledGreyBox: a card with an icon and a title. */
export function GreyBox({ icon: Icon, title, children }: { icon?: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-hairline bg-surface-flat">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-2 text-ui-sm font-medium text-fg-strong">
        {Icon && <Icon aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />}
        {title}
      </div>
      <div className="px-3 py-2 text-note text-fg-muted">{children}</div>
    </div>
  );
}

export function PanelButton({ tone = 'neutral', children }: { tone?: 'neutral' | 'green' | 'red'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-surface-raised-flat text-fg-strong ring-hairline-strong',
    green: 'bg-green/15 text-green ring-green/30',
    red: 'bg-red/15 text-red ring-red/30',
  } as const;

  return <span className={`inline-flex h-7 items-center rounded-md px-3 text-ui-sm font-medium ring-1 ${tones[tone]}`}>{children}</span>;
}

export function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-hairline bg-surface-flat px-3 py-2">
      <Icon aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />
      <div className="min-w-0">
        <p className="text-mono-sm text-fg-faint">{label}</p>
        <p className="font-mono text-mono-md text-fg-strong">{value}</p>
      </div>
    </div>
  );
}

/**
 * A place an extension can fill. Empty, it is a dashed outline with its name; filled, it
 * shows the extension's content. Clicking it selects it.
 */
export function SlotRegion({
  id,
  selected,
  onSelect,
  children,
  inline = false,
}: {
  id: string;
  selected: boolean;
  onSelect: (id: string) => void;
  children?: ReactNode;
  inline?: boolean;
}) {
  const filled = children !== undefined && children !== null && children !== false;

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      title={id}
      className={`group relative rounded-md text-left transition-colors ${inline ? 'inline-flex' : 'block w-full'} ${
        filled ? 'p-0.5' : inline ? 'h-7 px-2' : 'h-9 px-2'
      } ${
        selected
          ? 'outline outline-2 outline-accent signal-glow'
          : filled
            ? 'outline outline-1 outline-dashed outline-accent/50 hover:outline-accent'
            : 'outline outline-1 outline-dashed outline-hairline-strong hover:outline-accent'
      }`}
    >
      {filled ? (
        <span className="block w-full">{children}</span>
      ) : (
        <span className={`flex h-full items-center font-mono text-mono-sm ${selected ? 'text-white' : 'text-fg-faint group-hover:text-fg-muted'}`}>{id}</span>
      )}
    </button>
  );
}

export function Code({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  return <DynamicCodeBlock lang={lang} code={code} options={{ themes: { light: 'github-light', dark: 'github-dark' } }} />;
}

/** A labelled on/off switch for a demo. */
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-ui-sm text-fg-muted select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-surface-raised-flat ring-1 ring-hairline-strong'}`}
      >
        <span className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      {label}
    </label>
  );
}
