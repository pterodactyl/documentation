'use client';

import { useState } from 'react';
import { AlertTriangle, Cpu, FileText, HardDrive, MemoryStick, NotebookPen, Server as ServerIcon, Terminal } from 'lucide-react';
import { Segmented, Widget } from '../../widget';
import { Code, GreyBox, PanelButton, PanelFrame, SlotRegion, Stat, Toggle } from './mini-panel';
import { CONTRACTS, slotContract, slotSnippet, type SlotName } from './slot-catalog';

const NOTE = 'Restart every Sunday at 04:00.\nWhitelist requests go to #support.\nBackups are kept for 14 days.';

const NOTE_PREVIEW = `slots.register('server.console.before', NotePreview);`;

/* ------------------------------------------------------------------ */
/* Slots                                                              */
/* ------------------------------------------------------------------ */

const CONSOLE_SLOTS = ['server.console.before', 'server.console.power.before', 'server.console.power.after', 'server.console.after'] as const;

/** The console page with its four slots. Installing Server Notes fills the one above the console. */
export function SlotDemo() {
  const [installed, setInstalled] = useState(false);
  const [selected, setSelected] = useState<SlotName>('server.console.before');
  const select = (id: string) => setSelected(id as SlotName);
  const contract = CONTRACTS[slotContract(selected)];
  const usesNotes = installed && selected === 'server.console.before';

  return (
    <Widget
      title="Slots"
      description="Click a dashed area to see its slot. Turn on Server Notes to see its card appear in the slot it registers."
      actions={<Toggle label="Server Notes installed" checked={installed} onChange={setInstalled} />}
    >
      <PanelFrame>
        <SlotRegion id="server.console.before" selected={selected === 'server.console.before'} onSelect={select}>
          {installed && (
            <GreyBox icon={NotebookPen} title="Server notes">
              <p className="whitespace-pre-line">{NOTE}</p>
            </GreyBox>
          )}
        </SlotRegion>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-ui font-semibold text-white">Survival SMP</p>
            <p className="font-mono text-mono-sm text-fg-faint">play.example.com:25565</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <SlotRegion id="server.console.power.before" inline selected={selected === 'server.console.power.before'} onSelect={select} />
            <PanelButton tone="green">Start</PanelButton>
            <PanelButton>Restart</PanelButton>
            <PanelButton tone="red">Stop</PanelButton>
            <SlotRegion id="server.console.power.after" inline selected={selected === 'server.console.power.after'} onSelect={select} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <div className="rounded-md border border-hairline bg-surface-flat p-3 font-mono text-mono-sm leading-relaxed text-fg-muted">
            <p>[04:00:01 INFO]: Starting minecraft server version 1.21.1</p>
            <p>[04:00:03 INFO]: Preparing level &quot;world&quot;</p>
            <p>[04:00:09 INFO]: Done (6.2s)! For help, type &quot;help&quot;</p>
            <p className="text-fg-faint">&gt; _</p>
          </div>
          <div className="grid gap-2">
            <Stat icon={Cpu} label="CPU" value="41 %" />
            <Stat icon={MemoryStick} label="Memory" value="3.3 GiB" />
            <Stat icon={HardDrive} label="Disk" value="8.6 GiB" />
          </div>
        </div>

        <SlotRegion id="server.console.after" selected={selected === 'server.console.after'} onSelect={select} />
      </PanelFrame>

      <div className="mt-4 space-y-3">
        <p className="text-note text-fg-muted">
          <code className="font-mono text-mono-md text-white">{selected}</code> receives <code className="font-mono text-mono-md text-fg-strong">{contract.props}</code>.{' '}
          {contract.summary}
        </p>
        <Code code={usesNotes ? NOTE_PREVIEW : slotSnippet(selected)} />
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Screens                                                            */
/* ------------------------------------------------------------------ */

const CORE_TABS = ['Console', 'Files', 'Databases', 'Schedules', 'Users', 'Backups', 'Network', 'Startup', 'Settings'];

/** A server's navigation. A declared screen needs both its registration and a nav label to get a tab. */
export function ScreenDemo() {
  const [registered, setRegistered] = useState(true);
  const [label, setLabel] = useState(true);
  const [tab, setTab] = useState('Console');
  const showTab = registered && label;
  const current = tab === 'Notes' && !showTab ? 'Console' : tab;

  const manifest = JSON.stringify({ id: 'notes', area: 'server', path: 'notes', ...(label ? { nav: { label: 'Notes' } } : {}) }, null, 4);
  const setup = registered ? "screens.register('notes', () => import('./screens/NotesScreen'));" : '// screens.register is missing';

  return (
    <Widget
      title="Screens"
      description="A screen is a page of its own. Turn the registration and the nav label on and off to see what each one does."
      actions={
        <div className="flex flex-wrap gap-4">
          <Toggle label="Registered in setup" checked={registered} onChange={setRegistered} />
          <Toggle label="nav label" checked={label} onChange={setLabel} />
        </div>
      }
    >
      <PanelFrame
        nav={
          registered ? (
            <div className="flex gap-1 overflow-x-auto border-b border-hairline px-2">
              {[...CORE_TABS, ...(showTab ? ['Notes'] : [])].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTab(name)}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2 py-2 text-ui-sm transition-colors ${
                    current === name ? 'border-accent text-white' : 'border-transparent text-fg-subtle hover:text-fg-strong'
                  } ${name === 'Notes' ? 'rounded-t-sm bg-accent-soft' : ''}`}
                >
                  {name === 'Notes' && <NotebookPen aria-hidden className="size-3.5" strokeWidth={1.75} />}
                  {name}
                </button>
              ))}
            </div>
          ) : undefined
        }
      >
        {!registered ? (
          <div className="flex items-start gap-2 rounded-md border border-red/30 bg-red/10 p-3 text-note text-fg-strong">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-red" strokeWidth={1.75} />
            <span>The Panel does not load the extension: the screen &quot;notes&quot; is declared in extension.json but not registered in setup.</span>
          </div>
        ) : current === 'Notes' ? (
          <GreyBox icon={NotebookPen} title="Notes">
            <p className="whitespace-pre-line">{NOTE}</p>
          </GreyBox>
        ) : (
          <div className="rounded-md border border-hairline bg-surface-flat p-6 text-center text-note text-fg-faint">The Panel&apos;s {current} page</div>
        )}
        {registered && !label && (
          <p className="text-note text-fg-subtle">
            No tab, but the page still works at <code className="font-mono text-mono-md text-fg-strong">/server/1a2b3c4d/notes</code>.
          </p>
        )}
      </PanelFrame>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="eyebrow mb-2">extension.json</p>
          <Code lang="json" code={manifest} />
        </div>
        <div>
          <p className="eyebrow mb-2">setup</p>
          <Code code={setup} />
        </div>
      </div>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Columns                                                            */
/* ------------------------------------------------------------------ */

const NODES = [
  { name: 'eu-west-1', location: 'Amsterdam', servers: 14, fqdn: 'node1.example.com' },
  { name: 'eu-west-2', location: 'Amsterdam', servers: 9, fqdn: 'node2.example.com' },
  { name: 'us-east-1', location: 'New York', servers: 21, fqdn: 'ny1.example.com' },
];

/** The admin node table, with and without an extension's column. */
export function ColumnDemo() {
  const [on, setOn] = useState(true);

  return (
    <Widget
      title="Table columns"
      description="Columns appear after the Panel's own, and each cell gets the row's data."
      actions={<Toggle label="Column registered" checked={on} onChange={setOn} />}
    >
      <PanelFrame>
        <div className="overflow-x-auto rounded-md border border-hairline">
          <table className="w-full min-w-[28rem] text-left text-ui-sm">
            <thead className="bg-surface-flat text-mono-sm uppercase tracking-wide text-fg-faint">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Location</th>
                <th className="px-3 py-2 font-medium">Servers</th>
                {on && <th className="bg-accent-soft px-3 py-2 font-medium text-white">Notes host</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {NODES.map((node) => (
                <tr key={node.name} className="text-fg-muted">
                  <td className="px-3 py-2 text-fg-strong">{node.name}</td>
                  <td className="px-3 py-2">{node.location}</td>
                  <td className="px-3 py-2 font-mono text-mono-md">{node.servers}</td>
                  {on && <td className="bg-accent-soft/50 px-3 py-2 font-mono text-mono-md text-white">{node.fqdn}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelFrame>
    </Widget>
  );
}

/* ------------------------------------------------------------------ */
/* Component replacements                                             */
/* ------------------------------------------------------------------ */

type Variant = 'native' | 'part' | 'layout';

const VARIANTS: Record<Variant, { label: string; text: string; code: string }> = {
  native: {
    label: 'Native',
    text: 'The Panel draws the card from three parts: identity, address, and metrics.',
    code: '// No replacement registered.',
  },
  part: {
    label: 'Default with one part swapped',
    text: 'Render Default and swap one part. The Panel keeps the rest, and its data and links.',
    code: `function Identity({ model }: ComponentPartProps<'dashboard.serverCard'>) {
    return <span className="font-semibold">{model.name} <small>Paper</small></span>;
}

export default function ServerCard({ Default }: ReplacementProps<'dashboard.serverCard'>) {
    return <Default parts={{ identity: Identity }} />;
}`,
  },
  layout: {
    label: 'Your own layout',
    text: 'Write your own markup and reuse native parts where you want them.',
    code: `export default function ServerCard({ model, parts }: ReplacementProps<'dashboard.serverCard'>) {
    return (
        <div className="flex flex-col gap-2">
            <strong>{model.name}</strong>
            <parts.metrics model={model} />
        </div>
    );
}`,
  },
};

/** A dashboard server card drawn natively, with a swapped part, and as an extension's own layout. */
export function ReplacementDemo() {
  const [variant, setVariant] = useState<Variant>('native');
  const changed = 'rounded-sm bg-accent-soft ring-1 ring-accent/60';

  const metrics = (
    <div className="flex gap-4 font-mono text-mono-md text-fg-muted">
      <span className="flex items-center gap-1.5">
        <Cpu aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />
        41 %
      </span>
      <span className="flex items-center gap-1.5">
        <MemoryStick aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />
        3.3 GiB
      </span>
      <span className="flex items-center gap-1.5">
        <HardDrive aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />
        8.6 GiB
      </span>
    </div>
  );

  return (
    <Widget title="Component replacements" description="Pick a version of the dashboard's server card. The highlighted parts are the extension's.">
      <Segmented<Variant> label="Version" value={variant} onChange={setVariant} options={(Object.keys(VARIANTS) as Variant[]).map((value) => ({ value, label: VARIANTS[value].label }))} />

      <div className="mt-4">
        <PanelFrame>
          {variant === 'layout' ? (
            <div className={`flex flex-col gap-2 rounded-md border border-hairline bg-surface-flat p-3 ${changed}`}>
              <strong className="text-ui text-white">Survival SMP</strong>
              {metrics}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 rounded-md border border-hairline bg-surface-flat p-3">
              <ServerIcon aria-hidden className="size-5 text-fg-faint" strokeWidth={1.75} />
              <div className={`min-w-0 flex-1 ${variant === 'part' ? changed + ' px-1' : ''}`}>
                <p className="text-ui font-semibold text-white">
                  Survival SMP {variant === 'part' && <small className="ml-1 font-normal text-fg-subtle">Paper</small>}
                </p>
                <p className="text-note text-fg-subtle">Community survival world</p>
              </div>
              <p className="flex items-center gap-1.5 font-mono text-mono-md text-fg-muted">
                <Terminal aria-hidden className="size-3.5 text-fg-faint" strokeWidth={1.75} />
                play.example.com:25565
              </p>
              {metrics}
            </div>
          )}
        </PanelFrame>
      </div>

      <p className="mt-4 text-note text-fg-muted">{VARIANTS[variant].text}</p>
      <div className="mt-3">
        <Code code={VARIANTS[variant].code} />
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-note text-fg-faint">
        <FileText aria-hidden className="size-3.5" strokeWidth={1.75} />
        Declare <code className="font-mono text-mono-md">dashboard.serverCard</code> under <code className="font-mono text-mono-md">ui.components</code> and register it with{' '}
        <code className="font-mono text-mono-md">components.replace</code>.
      </p>
    </Widget>
  );
}
