'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Label, Output, Status, Widget } from '../../widget';
import { checkManifest, type CheckResult, type Stage } from './manifest-rules';

/** The Server Notes manifest from Building Extensions, with the ui.prefix that p:extension:make adds. */
const EXAMPLE = `{
    "$schema": "./node_modules/@pterodactyl/sdk/manifest.schema.json",
    "id": "server-notes",
    "name": "Server Notes",
    "version": "1.0.0",
    "requires": {
        "panel": "^2.0.0-dev",
        "sdk": "^2.0.0-beta.3",
        "php": "^8.3"
    },
    "description": "Keep shared notes on each server.",
    "provider": "ServerNotes\\\\ServerNotesProvider",
    "autoload": {
        "ServerNotes\\\\": "src"
    },
    "ui": {
        "entry": "dist/client.js",
        "mode": "native",
        "prefix": "sn",
        "screens": [
            {
                "id": "notes",
                "area": "server",
                "path": "notes",
                "nav": { "label": "Notes" }
            }
        ]
    }
}
`;

const ACCOUNT_SCREEN = `,
            {
                "id": "logs",
                "area": "account",
                "path": "logs/$date",
                "nav": { "label": "Logs" },
                "permission": ["file.read"]
            }
        ]`;

const PRESETS: ReadonlyArray<{ key: string; label: string; apply: (source: string) => string }> = [
  { key: 'id', label: 'Bad id', apply: (source) => source.replace('"id": "server-notes"', '"id": "Server Notes"') },
  { key: 'prefix', label: 'No Tailwind prefix', apply: (source) => source.replace('        "prefix": "sn",\n', '') },
  { key: 'screen', label: 'Bad screen', apply: (source) => source.replace(/\n {12}\}\n {8}\]/, `\n            }${ACCOUNT_SCREEN}`) },
  { key: 'core', label: 'Core path', apply: (source) => source.replace('"path": "notes"', '"path": "files"') },
  { key: 'constraint', label: 'Ruby-style constraint', apply: (source) => source.replace('"panel": "^2.0.0-dev"', '"panel": "~>2.0"') },
];

const GROUPS = ['File', 'Structure', 'Versions', 'Screens', 'Routes', 'Identity', 'Autoload', 'Frontend', 'Backend', 'Compatibility'];

const STAGE_TAG: Record<Stage, string | null> = {
  read: null,
  discover: 'discovery',
  enable: 'on enable',
  build: 'build check',
  browser: 'in the browser',
};

const TONE = { pass: 'green', fail: 'red', warn: 'yellow', skip: 'blue' } as const;
const WORD = { pass: 'pass', fail: 'fail', warn: 'warn', skip: 'n/a' } as const;

function VersionInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 text-ui-sm text-fg-subtle">
      <span className="shrink-0">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        autoComplete="off"
        className="w-full min-w-0 rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-mono-md text-fg-strong focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function Row({ result, reported }: { result: CheckResult; reported: boolean }) {
  const stage = STAGE_TAG[result.stage];
  const problem = result.status === 'fail' || result.status === 'warn';
  return (
    <li
      title={result.source}
      className={`flex items-start gap-2 border-b border-hairline px-2.5 py-1.5 leading-snug last:border-b-0 ${reported ? 'bg-red/5' : ''} ${result.status === 'skip' ? 'opacity-60' : ''}`}
    >
      <span className="flex w-10 shrink-0 leading-4">
        <Status tone={TONE[result.status]}>{WORD[result.status]}</Status>
      </span>
      <div className="min-w-0 flex-1 leading-snug">
        <code className="mr-2 break-all font-mono text-mono-md text-fg-strong">{result.path}</code>
        <span className="text-note text-fg-subtle">{result.label}</span>
        {stage && <span className="ml-2 whitespace-nowrap rounded border border-hairline px-1 font-mono text-mono-xs text-fg-faint">{stage}</span>}
        {reported && <span className="ml-2 whitespace-nowrap rounded bg-red/10 px-1 font-mono text-mono-xs text-red">reported</span>}
        {result.message && (
          <p className={`mt-1 break-words font-mono text-mono-sm ${result.status === 'warn' ? 'text-yellow' : 'text-red'}`}>{result.message}</p>
        )}
        {result.note && <p className="mt-0.5 text-mono-sm text-fg-faint">{result.note}</p>}
        {problem && <p className="mt-0.5 font-mono text-mono-xs text-fg-dim">{result.source}</p>}
      </div>
    </li>
  );
}

function Group({ name, rows, open, onToggle, reportedKey }: { name: string; rows: CheckResult[]; open: boolean; onToggle: () => void; reportedKey?: string }) {
  const [showSkipped, setShowSkipped] = useState(false);
  const tally = (status: CheckResult['status']) => rows.filter((row) => row.status === status).length;
  const [fail, warn, pass, skip] = [tally('fail'), tally('warn'), tally('pass'), tally('skip')];
  const shown = rows.filter((row) => showSkipped || row.status !== 'skip');
  return (
    <section className="overflow-hidden rounded-lg border border-hairline bg-surface">
      <button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left hover:bg-surface-raised">
        <span className="eyebrow">{name}</span>
        <span className="ml-auto flex flex-wrap items-center gap-1">
          {fail > 0 && <Status tone="red">{fail} fail</Status>}
          {warn > 0 && <Status tone="yellow">{warn} warn</Status>}
          {pass > 0 && <Status tone="green">{pass} pass</Status>}
          {skip > 0 && <span className="font-mono text-mono-sm text-fg-faint">{skip} n/a</span>}
          <span aria-hidden className="w-3 text-center font-mono text-mono-md text-fg-subtle">
            {open ? '−' : '+'}
          </span>
        </span>
      </button>
      {open && (
        <div className="border-t border-hairline">
          {shown.length > 0 && (
            <ul>
              {shown.map((row) => (
                <Row key={row.key} result={row} reported={reportedKey === row.key} />
              ))}
            </ul>
          )}
          {skip > 0 && (
            <button
              type="button"
              onClick={() => setShowSkipped(!showSkipped)}
              className="w-full border-t border-hairline px-3 py-1.5 text-left font-mono text-mono-sm text-fg-faint first:border-t-0 hover:text-fg-strong"
            >
              {showSkipped ? 'Hide' : 'Show'} {skip} {skip === 1 ? 'check that does' : 'checks that do'} not apply here
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function Verdict({ children, tone, title }: { children?: ReactNode; tone: 'green' | 'red'; title: string }) {
  return (
    <div className={`rounded-lg border p-3 ${tone === 'red' ? 'border-red/30 bg-red/5' : 'border-green/30 bg-green/5'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Status tone={tone}>{tone === 'red' ? 'rejected' : 'accepted'}</Status>
        <span className="text-note text-fg-strong">{title}</span>
      </div>
      {children}
    </div>
  );
}

export function ManifestChecker() {
  const [source, setSource] = useState(EXAMPLE);
  const [preset, setPreset] = useState<string | null>(null);
  const [directory, setDirectory] = useState('server-notes');
  const [panel, setPanel] = useState('2.0.0-dev');
  const [sdk, setSdk] = useState('2.0.0-beta.4');
  const [php, setPhp] = useState('8.3.0');
  /** Groups the reader flipped from their default: open with problems, closed without. */
  const [flipped, setFlipped] = useState<ReadonlySet<string>>(new Set());

  const report = useMemo(
    () => checkManifest(source, { directory: directory.trim() || 'server-notes', installed: { panel, sdk, php } }),
    [source, directory, panel, sdk, php]
  );

  const groups = GROUPS.map((name) => {
    const rows = report.results.filter((result) => result.group === name);
    const problems = rows.some((row) => row.status === 'fail' || row.status === 'warn');
    return { name, rows, open: problems !== flipped.has(name), problems };
  }).filter((group) => group.rows.length > 0);
  const allOpen = groups.every((group) => group.open);
  const toggle = (name: string) => {
    const next = new Set(flipped);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setFlipped(next);
  };
  const setAll = (open: boolean) => setFlipped(new Set(groups.filter((group) => group.problems !== open).map((group) => group.name)));

  const applicable = report.results.filter((result) => result.status !== 'skip');
  const passing = applicable.filter((result) => result.status === 'pass').length;
  const later = report.rejection ? [] : report.results.filter((result) => result.stage !== 'read' && result.stage !== 'discover' && result.status !== 'pass' && result.status !== 'skip');

  const applyPreset = (key: string | null) => {
    setPreset(key);
    const chosen = PRESETS.find((item) => item.key === key);
    setSource(chosen ? chosen.apply(EXAMPLE) : EXAMPLE);
    setDirectory('server-notes');
    setFlipped(new Set());
  };

  return (
    <Widget
      title="Check a manifest"
      description="Edit extension.json and watch the checks the Panel runs on it. Then break it on purpose."
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Break it</span>
        {PRESETS.map((item) => (
          <Button key={item.key} primary={preset === item.key} onClick={() => applyPreset(item.key)}>
            {item.label}
          </Button>
        ))}
        <Button onClick={() => applyPreset(null)} disabled={source === EXAMPLE && directory === 'server-notes'}>
          Reset
        </Button>
      </div>

      <div className="@container mt-4">
        <div className="grid gap-5 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-3">
            <label className="flex items-center gap-2 text-ui-sm text-fg-subtle">
              <span className="shrink-0 font-mono text-mono-md">extensions/</span>
              <input
                value={directory}
                onChange={(event) => setDirectory(event.target.value)}
                spellCheck={false}
                autoComplete="off"
                aria-label="Directory name"
                className="w-full min-w-0 rounded-md border border-hairline bg-surface px-2 py-1 font-mono text-mono-md text-fg-strong focus:border-accent focus:outline-none"
              />
              <span className="shrink-0 font-mono text-mono-md">/extension.json</span>
            </label>
            <textarea
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                setPreset(null);
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              wrap="off"
              rows={24}
              aria-label="extension.json"
              className="block w-full resize-y overflow-auto rounded-lg border border-hairline bg-black p-3 font-mono text-mono-md leading-relaxed text-fg-strong focus:border-accent focus:outline-none"
            />
          </div>

          <div className="min-w-0 space-y-3">
            {report.rejection ? (
              <Verdict tone="red" title="The Panel stops at the first failure and reports:">
                <div className="mt-2">
                  <Output>{report.rejection.message}</Output>
                </div>
                <p className="mt-1.5 font-mono text-mono-sm text-fg-faint">
                  {report.rejection.path} · {report.rejection.source}
                </p>
              </Verdict>
            ) : (
              <Verdict tone="green" title="The Panel reads this manifest without complaint.">
                {later.length > 0 && (
                  <ul className="mt-2 space-y-1.5">
                    {later.map((result) => (
                      <li key={result.key} className="flex items-start gap-2">
                        <Status tone={TONE[result.status]}>{STAGE_TAG[result.stage]}</Status>
                        <span className="min-w-0 break-words font-mono text-mono-sm text-fg-muted">{result.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Verdict>
            )}

            <div className="rounded-lg border border-hairline p-3">
              <Label>Installed versions</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <VersionInput label="Panel" value={panel} onChange={setPanel} />
                <VersionInput label="SDK" value={sdk} onChange={setSdk} />
                <VersionInput label="PHP" value={php} onChange={setPhp} />
              </div>
              <p className="mt-1.5 text-mono-sm text-fg-faint">
                Enabling checks requires.panel, requires.sdk and requires.php against these. Canary builds report Panel 2.0.0-dev; this
                Panel&apos;s SDK is 2.0.0-beta.4.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-note text-fg-subtle">
                {passing} of {applicable.length} checks pass. Groups with a problem open on their own.
              </p>
              <button
                type="button"
                onClick={() => setAll(!allOpen)}
                className="text-ui-sm text-fg-muted underline decoration-fg-dim underline-offset-2 hover:text-white hover:decoration-accent"
              >
                {allOpen ? 'Collapse all' : 'Expand all'}
              </button>
            </div>

            <div className="space-y-2">
              {groups.map((group) => (
                <Group
                  key={group.name}
                  name={group.name}
                  rows={group.rows}
                  open={group.open}
                  onToggle={() => toggle(group.name)}
                  reportedKey={report.rejection?.key}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Widget>
  );
}
