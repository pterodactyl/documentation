'use client';

import { Fragment, useRef, useState, type ReactNode } from 'react';
import { updateSetup, useSetup } from '../setup';
import { Label, Segmented, Status, TextField, Widget } from '../widget';
import {
  buildConfig,
  DEFAULT_API_PORT,
  DEFAULT_FQDN,
  DEFAULT_SFTP_PORT,
  docFor,
  formatScalar,
  type ConfigOptions,
  type Line,
} from './wings-config/schema';

type View = ConfigOptions['view'];

const SECTIONS = ['api', 'system', 'docker', 'throttles', 'remote'] as const;

function inline(text: string): ReactNode {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') ? (
      <code key={i} className="rounded border border-hairline bg-surface-raised px-1 py-px font-mono text-mono-md break-all text-fg-strong">
        {part.slice(1, -1)}
      </code>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

function parsePort(value: string, fallback: number): { port: number; valid: boolean } {
  const n = Number(value);
  const valid = /^\d{1,5}$/.test(value) && n >= 1 && n <= 65535;
  return { port: valid ? n : fallback, valid };
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (value: boolean) => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-hairline bg-surface px-3 py-2.5 text-left transition-colors hover:border-hairline-strong"
    >
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          checked ? 'bg-accent' : 'bg-surface-raised ring-1 ring-hairline-strong'
        }`}
      >
        <span className={`h-3 w-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-3' : ''}`} />
      </span>
      <span className="min-w-0 leading-snug">
        <span className="block text-ui-sm text-fg-strong">{label}</span>
        <span className="mt-0.5 block text-ui-sm text-fg-faint">{hint}</span>
      </span>
    </button>
  );
}

/** One line of the file, coloured the way an editor would. */
function YamlText({ line }: { line: Line }) {
  const indent = '  '.repeat(line.depth);
  const punct = 'text-fg-faint';

  let value: ReactNode = null;
  if (line.secret) {
    value = (
      <span className="rounded bg-surface-raised px-1.5 text-fg-faint">
        <span aria-hidden>{'•••••••• '}</span>secret
      </span>
    );
  } else if (line.empty) {
    value = <span className={punct}>{line.empty}</span>;
  } else if (line.value !== undefined) {
    const isString = typeof line.value === 'string';
    value = <span className={isString ? 'text-fg-muted' : 'text-accent'}>{formatScalar(line.value)}</span>;
  }

  return (
    <span className="whitespace-pre">
      {indent}
      {line.item ? (
        <>
          <span className={punct}>- </span>
          {value}
          {line.comment && <span className="text-fg-dim">{`  # ${line.comment}`}</span>}
        </>
      ) : (
        <>
          <span className="text-white">{line.key}</span>
          <span className={punct}>:</span>
          {value && <> {value}</>}
        </>
      )}
    </span>
  );
}

function Detail({ path, changed }: { path: string; changed: boolean }) {
  const found = docFor(path);
  if (!found) return null;
  const { doc } = found;

  const rows: Array<[string, string | undefined]> = [
    ['What it does', doc.what],
    ['Default', doc.def],
    ['When to change it', doc.change],
    ['If it is wrong', doc.breaks],
  ];

  return (
    <div>
      <p className="font-mono text-mono-lg break-all text-white">{found.path}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {doc.panel && <Status tone="blue">written by the Panel</Status>}
        {doc.secret && <Status tone="yellow">secret</Status>}
        {changed && <Status tone="green">changed by your choices</Status>}
      </div>
      {doc.secret && (
        <p className="mt-3 rounded-md border border-yellow/30 bg-yellow/10 px-3 py-2 text-note text-fg-strong">
          Filled in by the Panel&apos;s auto-deploy command. Never share it, and remove it before you post this file anywhere.
        </p>
      )}
      <dl className="mt-3 space-y-3">
        {rows.map(([label, text]) =>
          text ? (
            <div key={label}>
              <dt className="eyebrow mb-0.5">{label}</dt>
              <dd className="text-note text-fg-muted">{inline(text)}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </div>
  );
}

export function WingsConfigExplorer() {
  const setup = useSetup();
  const [view, setView] = useState<View>('disk');
  const [nodeSsl, setNodeSsl] = useState<boolean | null>(null);
  const [proxy, setProxy] = useState(false);
  const [fqdn, setFqdn] = useState('');
  const [apiPortText, setApiPortText] = useState(String(DEFAULT_API_PORT));
  const [sftpPortText, setSftpPortText] = useState(String(DEFAULT_SFTP_PORT));
  const [selected, setSelected] = useState('token');
  const [hovered, setHovered] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<string, HTMLButtonElement>());

  // The node follows the Panel's scheme until the reader sets it.
  const ssl = nodeSsl ?? setup.ssl;
  const apiPort = parsePort(apiPortText, DEFAULT_API_PORT);
  const sftpPort = parsePort(sftpPortText, DEFAULT_SFTP_PORT);
  const node = fqdn.trim() || DEFAULT_FQDN;
  const remote = setup.domain ? `${setup.ssl ? 'https' : 'http'}://${setup.domain}` : `${setup.ssl ? 'https' : 'http'}://panel.example.com`;

  const options: ConfigOptions = { view, remote, fqdn: node, ssl, proxy, apiPort: apiPort.port, sftpPort: sftpPort.port };
  const lines = buildConfig(options);
  // Lines that differ from a stock node: no SSL, no proxy, default FQDN and ports.
  const stock = new Map(
    buildConfig({ ...options, ssl: false, proxy: false, fqdn: DEFAULT_FQDN, apiPort: DEFAULT_API_PORT, sftpPort: DEFAULT_SFTP_PORT }).map((l) => [l.id, l.text]),
  );
  const changed = new Set(lines.filter((l) => stock.get(l.id) !== l.text).map((l) => l.path));

  const active = hovered ?? selected;
  const activeExists = lines.some((l) => l.path === active);
  const shownPath = activeExists ? active : lines.some((l) => l.path === selected) ? selected : 'remote';

  /** Select a key and bring its line into view inside the file, without moving the page. */
  const focus = (path: string) => {
    setSelected(path);
    setHovered(null);
    requestAnimationFrame(() => {
      const el = lineRefs.current.get(path);
      const box = scroller.current;
      if (!el || !box) return;
      const top = el.offsetTop - box.clientHeight / 3;
      box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    });
  };

  const warnings: Array<{ tone: 'red' | 'yellow' | 'blue'; text: string }> = [];
  if (setup.ssl && !ssl && !proxy) {
    warnings.push({ tone: 'red', text: 'The Panel uses HTTPS but Wings does not. Browsers block the console and file transfers from a secure page.' });
  }
  if (ssl && !proxy) {
    warnings.push({ tone: 'blue', text: `Wings needs a certificate for ${node.toLowerCase()} at the cert and key paths before it starts.` });
  }
  if (proxy) {
    warnings.push({
      tone: 'blue',
      text: `Wings serves plain HTTP on port ${apiPort.port}. The Panel and browsers still connect to https://${node.toLowerCase()}:${apiPort.port}, so your proxy must accept HTTPS there and forward it to Wings.`,
    });
  }
  if (apiPort.port !== DEFAULT_API_PORT || sftpPort.port !== DEFAULT_SFTP_PORT) {
    warnings.push({ tone: 'yellow', text: 'Set the same ports on the node in the Panel (Daemon Port and Daemon SFTP Port), and open them in the firewall.' });
  }

  return (
    <Widget
      title="Explore Wings' config.yml"
      description="Hover or click a key to see what it does. Change the options above the file to see which lines they change."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <Label>Your Panel</Label>
          <div className="space-y-2">
            <TextField
              aria-label="Panel domain"
              placeholder="panel.example.com"
              value={setup.domain}
              onChange={(e) => {
                updateSetup({ domain: e.target.value });
                focus('remote');
              }}
            />
            <Toggle
              checked={setup.ssl}
              onChange={(value) => {
                updateSetup({ ssl: value });
                focus('remote');
              }}
              label="Panel uses HTTPS"
              hint="Sets the scheme of remote. Saved with your setup."
            />
          </div>
        </div>
        <div>
          <Label>This node</Label>
          <div className="space-y-2">
            <TextField
              aria-label="Node FQDN"
              placeholder={DEFAULT_FQDN}
              value={fqdn}
              onChange={(e) => {
                setFqdn(e.target.value.replace(/[^A-Za-z0-9.-]/g, '').slice(0, 253));
                focus('api.ssl.cert');
              }}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Toggle
                checked={ssl}
                onChange={(value) => {
                  setNodeSsl(value);
                  focus('api.ssl.enabled');
                }}
                label="Node uses SSL"
                hint="Communicate Over SSL"
              />
              <Toggle
                checked={proxy}
                onChange={(value) => {
                  setProxy(value);
                  focus(view === 'disk' && value ? 'api.trusted_proxies' : 'api.ssl.enabled');
                }}
                label="Behind a reverse proxy"
                hint="Behind Proxy"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="mb-1 block text-ui-sm text-fg-subtle">API port</span>
                <TextField
                  inputMode="numeric"
                  value={apiPortText}
                  aria-invalid={!apiPort.valid}
                  className={apiPort.valid ? '' : 'border-red'}
                  onChange={(e) => {
                    setApiPortText(e.target.value.replace(/\D/g, '').slice(0, 5));
                    focus('api.port');
                  }}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-ui-sm text-fg-subtle">SFTP port</span>
                <TextField
                  inputMode="numeric"
                  value={sftpPortText}
                  aria-invalid={!sftpPort.valid}
                  className={sftpPort.valid ? '' : 'border-red'}
                  onChange={(e) => {
                    setSftpPortText(e.target.value.replace(/\D/g, '').slice(0, 5));
                    focus('system.sftp.bind_port');
                  }}
                />
              </label>
            </div>
            {(!apiPort.valid || !sftpPort.valid) && <p className="text-ui-sm text-red">Ports run from 1 to 65535. The file keeps the default until you fix it.</p>}
          </div>
        </div>
      </div>

      {warnings.length > 0 && (
        <ul className="mt-4 space-y-1.5" aria-live="polite">
          {warnings.map((w) => (
            <li key={w.text} className="flex items-start gap-2 text-note text-fg-muted">
              <span className="shrink-0">
                <Status tone={w.tone}>{w.tone === 'red' ? 'breaks' : w.tone === 'yellow' ? 'also' : 'note'}</Status>
              </span>
              <span className="min-w-0 break-words">{w.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented<View>
          label="Which file"
          value={view}
          onChange={(v) => {
            setView(v);
            setHovered(null);
          }}
          options={[
            { value: 'disk', label: 'After Wings starts' },
            { value: 'panel', label: 'From the Panel' },
          ]}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ui-sm text-fg-faint">Jump to</span>
          {SECTIONS.filter((s) => lines.some((l) => l.path === s)).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => focus(s)}
              className="rounded-md border border-hairline px-2 py-0.5 font-mono text-mono-sm text-fg-muted transition-colors hover:border-hairline-strong hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-note text-fg-subtle">
        {view === 'disk'
          ? 'This is /etc/pterodactyl/config.yml once Wings has started: it fills in every key the Panel left out with its default, and saves the whole file.'
          : "This is the short file the node's Configuration tab shows and the auto-deploy command fetches. Wings adds everything else when it starts."}{' '}
        <span className="whitespace-nowrap">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-accent-soft align-middle shadow-[inset_2px_0_0_var(--color-accent)]" /> marks lines your
          choices changed.
        </span>
      </p>

      <div className="mt-3 grid overflow-hidden rounded-lg border border-hairline lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div
          ref={scroller}
          className="relative max-h-[20rem] overflow-auto bg-black py-2 font-mono text-mono-lg leading-6 sm:max-h-[26rem] lg:max-h-[34rem]"
          onMouseLeave={() => setHovered(null)}
          role="group"
          aria-label="config.yml"
        >
          {lines.map((line, i) => {
            const isActive = line.path === shownPath;
            const isChanged = changed.has(line.path);
            return (
              <button
                key={line.id}
                ref={(el) => {
                  if (el) lineRefs.current.set(line.id, el);
                  else lineRefs.current.delete(line.id);
                }}
                type="button"
                aria-pressed={line.path === selected}
                onClick={() => setSelected(line.path)}
                onMouseEnter={() => setHovered(line.path)}
                onFocus={() => setHovered(line.path)}
                className={`flex w-full min-w-max items-start pr-4 text-left transition-colors focus:outline-none focus-visible:bg-surface-raised ${
                  isChanged ? 'bg-accent-soft shadow-[inset_2px_0_0_var(--color-accent)]' : isActive ? 'bg-surface-raised' : 'hover:bg-surface'
                } ${isActive && isChanged ? 'ring-1 ring-inset ring-accent/40' : ''}`}
              >
                <span aria-hidden className="w-10 shrink-0 pr-3 text-right text-fg-ghost select-none">
                  {i + 1}
                </span>
                <YamlText line={line} />
              </button>
            );
          })}
        </div>
        <div className="border-t border-hairline bg-surface p-4 lg:max-h-[34rem] lg:overflow-auto lg:border-t-0 lg:border-l">
          <Detail path={shownPath} changed={changed.has(shownPath)} />
        </div>
      </div>
    </Widget>
  );
}
