'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Button, Label, Segmented, Status, TextField, Widget } from '../widget';
import { envNameProblem, validateVariable, type RuleResult, type ValidationResult } from './egg-playground/laravel-rules';
import { JsonSyntaxError, panelReplacements, parseOrderedJson, type PanelReplacement, type ReplaceWith } from './egg-playground/panel-config';
import { containerEnvironment, renderStartup, type Segment } from './egg-playground/startup';
import { lookupConfigurationValue, runWingsParser, type Outcome, type PreviewParser } from './egg-playground/wings-parsers';

/* ==================================================================== *
 * Shared pieces
 * ==================================================================== */

type Tone = 'green' | 'red' | 'yellow' | 'blue';

const TONE_TEXT: Record<Tone, string> = { green: 'text-green', red: 'text-red', yellow: 'text-yellow', blue: 'text-blue' };

function Input({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label: string; placeholder?: string }) {
  return (
    <input
      type="text"
      spellCheck={false}
      autoComplete="off"
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full min-w-0 rounded-md border border-hairline bg-surface px-2.5 py-1.5 font-mono text-mono-md text-fg-strong placeholder:text-fg-ghost focus:border-accent focus:outline-none"
    />
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="mb-1 text-ui-sm text-fg-subtle">{label}</p>
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  label,
  rows,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  rows: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      spellCheck={false}
      wrap="off"
      autoComplete="off"
      aria-label={label}
      value={value}
      rows={rows}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="block w-full resize-y rounded-lg border border-hairline bg-surface px-3 py-2 font-mono text-mono-md leading-relaxed text-fg-strong focus:border-accent focus:outline-none disabled:opacity-40"
    />
  );
}

function Check({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-ui-sm text-fg-muted">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-3.5 accent-[var(--color-accent)]" />
      {children}
    </label>
  );
}

function Neutral({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded bg-surface-raised px-1.5 py-0.5 font-mono text-mono-sm text-fg-subtle">{children}</span>;
}

function TryRow({ items }: { items: Array<{ label: string; run: () => void }> }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-ui-sm text-fg-subtle">Try:</span>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.run}
          className="rounded-md border border-dashed border-hairline-strong px-2 py-1 text-ui-sm text-fg-muted transition-colors hover:border-accent hover:text-white"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Label>{title}</Label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/* ==================================================================== *
 * Egg variables
 * ==================================================================== */

interface VariableDraft {
  id: number;
  name: string;
  env: string;
  defaultValue: string;
  value: string;
  rules: string;
  viewable: boolean;
}

interface VariablePreset {
  label: string;
  startup: string;
  server: { memory: string; ip: string; port: string };
  variables: Array<Omit<VariableDraft, 'id'>>;
  tries: Array<{ label: string; apply: (state: VariableState) => VariableState }>;
}

interface VariableState {
  startup: string;
  server: { memory: string; ip: string; port: string };
  variables: VariableDraft[];
}

const variable = (name: string, env: string, defaultValue: string, rules: string, value = defaultValue): Omit<VariableDraft, 'id'> => ({
  name,
  env,
  defaultValue,
  value,
  rules,
  viewable: true,
});

const edit = (state: VariableState, env: string, change: Partial<VariableDraft>): VariableState => ({
  ...state,
  variables: state.variables.map((v) => (v.env === env ? { ...v, ...change } : v)),
});

const VARIABLE_PRESETS = {
  minecraft: {
    label: 'Minecraft',
    startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
    server: { memory: '4096', ip: '192.168.1.10', port: '25565' },
    variables: [
      variable('Server Jar File', 'SERVER_JARFILE', 'server.jar', 'required|regex:/^([\\w\\d._-]+)(\\.jar)$/', 'paper.jar'),
      variable('Minecraft Version', 'MINECRAFT_VERSION', 'latest', 'nullable|string|max:20'),
      variable('Build Number', 'BUILD_NUMBER', 'latest', 'required|string|max:20'),
    ],
    tries: [
      { label: 'Jar name without .jar', apply: (s) => edit(s, 'SERVER_JARFILE', { value: 'paper' }) },
      { label: 'Hide the jar file from users', apply: (s) => edit(s, 'SERVER_JARFILE', { viewable: false }) },
      { label: 'Typo in a placeholder', apply: (s) => ({ ...s, startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JAR}}' }) },
      { label: 'Empty Build Number', apply: (s) => edit(s, 'BUILD_NUMBER', { value: '' }) },
    ],
  },
  source: {
    label: "Garry's Mod",
    startup: './srcds_run -game garrysmod -console -port {{SERVER_PORT}} +ip 0.0.0.0 +map {{SRCDS_MAP}} +gamemode {{GAMEMODE}} +maxplayers {{MAX_PLAYERS}} -tickrate {{TICKRATE}} -norestart',
    server: { memory: '2048', ip: '192.168.1.10', port: '27015' },
    variables: [
      variable('Map', 'SRCDS_MAP', 'gm_flatgrass', 'required|string|alpha_dash', 'gm_construct'),
      variable('Gamemode', 'GAMEMODE', 'sandbox', 'required|string'),
      variable('Max Players', 'MAX_PLAYERS', '32', 'required|integer|max:128'),
      variable('Tickrate', 'TICKRATE', '22', 'required|integer|max:100', '66'),
    ],
    tries: [
      { label: '200 players', apply: (s) => edit(s, 'MAX_PLAYERS', { value: '200' }) },
      { label: '200 players without integer', apply: (s) => edit(s, 'MAX_PLAYERS', { value: '200', rules: 'required|max:128' }) },
      { label: 'Map name with a space', apply: (s) => edit(s, 'SRCDS_MAP', { value: 'gm construct' }) },
    ],
  },
  node: {
    label: 'Node.js',
    startup: 'node /home/container/{{MAIN_FILE}} {{NODE_ARGS}}',
    server: { memory: '512', ip: '192.168.1.10', port: '3000' },
    variables: [
      variable('Main File', 'MAIN_FILE', 'index.js', 'required|string|max:64'),
      variable('Extra Arguments', 'NODE_ARGS', '', 'nullable|string'),
      variable('Auto Update', 'AUTO_UPDATE', '0', 'required|boolean'),
    ],
    tries: [
      { label: 'Auto Update set to true', apply: (s) => edit(s, 'AUTO_UPDATE', { value: 'true' }) },
      { label: 'Extra Arguments without nullable', apply: (s) => edit(s, 'NODE_ARGS', { rules: 'string' }) },
      { label: 'Add {{P_SERVER_UUID}} to the command', apply: (s) => ({ ...s, startup: `${s.startup} --id {{P_SERVER_UUID}}` }) },
      { label: 'An egg variable named TZ', apply: (s) => ({ ...s, variables: [...s.variables, { ...variable('Time Zone', 'TZ', 'UTC', 'required|string'), id: Date.now() }] }) },
    ],
  },
} satisfies Record<string, VariablePreset>;

type VariablePresetId = keyof typeof VARIABLE_PRESETS;

function presetState(id: VariablePresetId): VariableState {
  const preset = VARIABLE_PRESETS[id];
  return { startup: preset.startup, server: { ...preset.server }, variables: preset.variables.map((v, i) => ({ ...v, id: i + 1 })) };
}

const NODE = { timezone: 'UTC', dockerInterface: '172.18.0.1', uuid: '6d1f7929-5c2e-4cd4-99af-924dacb15537', location: 'us1', allocationLimit: 1 };

const RULE_TONE: Record<RuleResult['state'], Tone | null> = { pass: 'green', fail: 'red', error: 'red', unknown: 'red', panel: 'yellow', skipped: null };

function RuleList({ result }: { result: ValidationResult }) {
  const details = result.rules.filter((rule) => rule.detail);
  return (
    <div className="mt-3 border-t border-hairline pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {result.passes ? (
          <Status tone={result.uncertain ? 'yellow' : 'green'}>{result.uncertain ? 'saves, if the Panel agrees' : 'saves'}</Status>
        ) : (
          <Status tone="red">rejected</Status>
        )}
        <span className="mx-1 text-fg-faint" aria-hidden="true">
          ·
        </span>
        {result.rules.length === 0 && <span className="text-ui-sm text-fg-subtle">No rules.</span>}
        {result.rules.map((rule, i) => {
          const tone = RULE_TONE[rule.state];
          return tone ? (
            <Status key={i} tone={tone}>
              {rule.raw}
            </Status>
          ) : (
            <Neutral key={i}>{rule.raw}</Neutral>
          );
        })}
      </div>
      {(details.length > 0 || result.trimmed || result.value === null || result.splitRegex) && (
        <ul className="mt-2 space-y-1 text-note">
          {result.value === null && <li className="text-fg-muted">The value is empty, so the Panel checks it as null and saves an empty value.</li>}
          {result.trimmed && <li className="text-fg-muted">The Panel trims the spaces at the ends and saves &quot;{result.value}&quot;.</li>}
          {result.splitRegex && (
            <li className="text-red">The Panel splits the rules at every |, which cuts this regular expression in two.</li>
          )}
          {details.map((rule, i) => {
            const tone = RULE_TONE[rule.state];
            return (
              <li key={i} className={rule.state === 'pass' ? 'text-fg-muted' : tone ? TONE_TEXT[tone] : 'text-fg-subtle'}>
                <span className="font-mono text-mono-md">{rule.raw}</span>: {rule.detail}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function VariableCard({
  draft,
  result,
  duplicate,
  onChange,
  onRemove,
}: {
  draft: VariableDraft;
  result: ValidationResult;
  duplicate: boolean;
  onChange: (change: Partial<VariableDraft>) => void;
  onRemove: () => void;
}) {
  const nameProblem = envNameProblem(draft.env) ?? (duplicate ? 'Another variable uses this name. The container ends up with only one of them.' : null);
  const defaultResult = useMemo(() => validateVariable(draft.rules, draft.defaultValue), [draft.rules, draft.defaultValue]);

  return (
    <div className="@container rounded-lg border border-hairline bg-surface p-3">
      <div className="grid grid-cols-2 gap-2.5 @xl:grid-cols-6">
        <Field label="Name" className="@xl:col-span-2">
          <Input label="Name" value={draft.name} onChange={(name) => onChange({ name })} />
        </Field>
        <Field label="Environment variable" className="@xl:col-span-2">
          <Input label="Environment variable" value={draft.env} onChange={(env) => onChange({ env })} />
          {nameProblem && <p className="mt-1 text-note text-red">{nameProblem}</p>}
        </Field>
        <Field label="Default value" className="@xl:col-span-2">
          <Input label="Default value" value={draft.defaultValue} onChange={(defaultValue) => onChange({ defaultValue })} />
        </Field>
        <Field label="Value a user saves" className="@xl:col-span-2">
          <Input label="Value a user saves" value={draft.value} onChange={(value) => onChange({ value })} placeholder="(empty)" />
        </Field>
        <Field label="Input rules" className="col-span-2 @xl:col-span-4">
          <Input label="Input rules" value={draft.rules} onChange={(rules) => onChange({ rules })} />
        </Field>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <Check checked={draft.viewable} onChange={(viewable) => onChange({ viewable })}>
          Users can view
        </Check>
        <button type="button" onClick={onRemove} className="text-ui-sm text-fg-subtle transition-colors hover:text-red">
          Remove
        </button>
      </div>
      <RuleList result={result} />
      {!defaultResult.passes && (
        <p className="mt-2 text-note text-yellow">The default value fails these rules too, so a user can&apos;t save it back unchanged.</p>
      )}
    </div>
  );
}

function SegmentView({ segment, rejected }: { segment: Segment; rejected: Set<number> }) {
  switch (segment.kind) {
    case 'text':
      return <>{segment.text}</>;
    case 'unresolved':
      return <span className="rounded-sm bg-red/10 text-red underline decoration-wavy decoration-1 underline-offset-4">{segment.text}</span>;
    case 'builtin':
      return (
        <span title={`{{${segment.placeholder}}}`} className="rounded-sm bg-blue/10 text-blue">
          {segment.text}
        </span>
      );
    case 'hidden':
      return (
        <span title={`{{${segment.placeholder}}}`} className="rounded-sm bg-yellow/10 text-yellow">
          {segment.text}
        </span>
      );
    case 'variable': {
      const tone = rejected.has(segment.index) ? 'bg-red/10 text-red' : 'bg-green/10 text-green';
      if (segment.text === '') {
        return <span title={`{{${segment.placeholder}}} is empty`} className="mx-px inline-block h-[1.1em] w-[3px] translate-y-[3px] rounded-sm bg-yellow" />;
      }
      return (
        <span title={`{{${segment.placeholder}}}`} className={`rounded-sm ${tone}`}>
          {segment.text}
        </span>
      );
    }
  }
}

function Legend({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${tone}`} aria-hidden="true" />
      {children}
    </span>
  );
}

const CONTAINER_ONLY = ['TZ', 'STARTUP', 'P_SERVER_UUID', 'P_SERVER_LOCATION', 'P_SERVER_ALLOCATION_LIMIT'];

export function EggVariablePlayground() {
  const [preset, setPreset] = useState<VariablePresetId>('minecraft');
  const [state, setState] = useState<VariableState>(() => presetState('minecraft'));
  const { startup, server, variables } = state;

  const results = useMemo(() => variables.map((v) => validateVariable(v.rules, v.value)), [variables]);
  const saved = variables.map((v, i) => ({ name: v.name, env: v.env, saved: results[i].value ?? '', viewable: v.viewable }));
  const rendered = renderStartup(startup, server, saved);
  const environment = containerEnvironment(startup, server, saved, NODE);
  const rejected = new Set(results.flatMap((r, i) => (r.passes ? [] : [i])));
  const upperNames = variables.map((v) => v.env.toUpperCase());

  const choosePreset = (id: VariablePresetId) => {
    setPreset(id);
    setState(presetState(id));
  };
  const change = (id: number, patch: Partial<VariableDraft>) =>
    setState((s) => ({ ...s, variables: s.variables.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));

  const explain = (placeholder: string): string => {
    const name = placeholder.slice(2, -2);
    const match = variables.find((v) => v.env !== name && v.env.toUpperCase() === name.toUpperCase());
    if (['SERVER_MEMORY', 'SERVER_IP', 'SERVER_PORT'].includes(name.toUpperCase()) && name !== name.toUpperCase()) {
      return `Placeholders are case-sensitive. Write {{${name.toUpperCase()}}}.`;
    }
    if (match) return `Placeholders are case-sensitive. The variable is {{${match.env}}}.`;
    if (CONTAINER_ONLY.includes(name)) {
      return `The Startup page leaves it as written, because the Panel only fills in SERVER_MEMORY, SERVER_IP, SERVER_PORT, and the egg's variables. The container does have ${name}.`;
    }
    const close = variables.find((v) => v.env && (v.env.toUpperCase().startsWith(name.toUpperCase()) || name.toUpperCase().startsWith(v.env.toUpperCase())));
    return `No variable has this name, so the Startup page shows it as written.${close ? ` Did you mean {{${close.env}}}?` : ''}`;
  };

  return (
    <Widget
      title="Startup command playground"
      description="Edit the command, a variable, or its rules. The preview shows what the Panel does with them."
      actions={
        <Segmented
          label="Example egg"
          value={preset}
          onChange={choosePreset}
          options={(Object.keys(VARIABLE_PRESETS) as VariablePresetId[]).map((id) => ({ value: id, label: VARIABLE_PRESETS[id].label }))}
        />
      }
    >
      <div className="@container">
      <Field label="Startup command">
        <TextField aria-label="Startup command" value={startup} onChange={(event) => setState((s) => ({ ...s, startup: event.target.value }))} />
      </Field>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 @md:grid-cols-3">
        <Field label="Memory (MiB)">
          <Input label="Memory in MiB" value={server.memory} onChange={(memory) => setState((s) => ({ ...s, server: { ...s.server, memory } }))} />
        </Field>
        <Field label="Allocation IP">
          <Input label="Allocation IP" value={server.ip} onChange={(ip) => setState((s) => ({ ...s, server: { ...s.server, ip } }))} />
        </Field>
        <Field label="Allocation port">
          <Input label="Allocation port" value={server.port} onChange={(port) => setState((s) => ({ ...s, server: { ...s.server, port } }))} />
        </Field>
      </div>

      <TryRow items={VARIABLE_PRESETS[preset].tries.map((t: VariablePreset['tries'][number]) => ({ label: t.label, run: () => setState((s) => t.apply(s)) }))} />

      <Section title="On the Startup page" aside={<span className="text-ui-sm text-fg-subtle">What users see as the startup command</span>}>
        <pre className="rounded-lg border border-hairline bg-black p-4 font-mono text-mono-lg leading-relaxed whitespace-pre-wrap text-fg-strong [overflow-wrap:anywhere]">
          {rendered.segments ? rendered.segments.map((segment, i) => <SegmentView key={i} segment={segment} rejected={rejected} />) : rendered.command}
        </pre>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-ui-sm text-fg-subtle">
          <Legend tone="bg-blue">built in</Legend>
          <Legend tone="bg-green">variable</Legend>
          <Legend tone="bg-yellow">hidden or empty</Legend>
          <Legend tone="bg-red">rejected or not filled in</Legend>
        </div>
        {rendered.unresolved.length > 0 && (
          <ul className="mt-3 space-y-1 text-note">
            {rendered.unresolved.map((placeholder) => (
              <li key={placeholder} className="text-red">
                <span className="font-mono text-mono-md">{placeholder}</span>: {explain(placeholder)}
              </li>
            ))}
          </ul>
        )}
        {rejected.size > 0 && (
          <p className="mt-2 text-note text-fg-muted">The Panel refuses to save a rejected value, so the server keeps the value it had before.</p>
        )}
      </Section>

      <Section title="Variables">
        <div className="space-y-3">
          {variables.map((draft, i) => (
            <VariableCard
              key={draft.id}
              draft={draft}
              result={results[i]}
              duplicate={upperNames.indexOf(draft.env.toUpperCase()) !== i}
              onChange={(patch) => change(draft.id, patch)}
              onRemove={() => setState((s) => ({ ...s, variables: s.variables.filter((v) => v.id !== draft.id) }))}
            />
          ))}
        </div>
        <div className="mt-3">
          <Button
            onClick={() =>
              setState((s) => ({
                ...s,
                variables: [...s.variables, { ...variable('New Variable', `NEW_VARIABLE_${s.variables.length + 1}`, '', 'required|string|max:20'), id: Date.now() }],
              }))
            }
          >
            Add variable
          </Button>
        </div>
      </Section>

      <details className="group mt-6 rounded-lg border border-hairline">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 text-ui-sm text-fg-muted hover:text-white">
          <span>
            In the container: {environment.filter((row) => !row.dropped).length} environment variables
          </span>
          <span className="text-fg-subtle transition-transform group-open:rotate-90" aria-hidden="true">
            ›
          </span>
        </summary>
        <div className="border-t border-hairline px-3 pb-3">
          <p className="mt-3 text-note text-fg-muted">
            Wings does not fill in the placeholders. It passes the command as written in STARTUP, next to these variables, and leaves running it to the image&apos;s entrypoint. Hidden variables are here too.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left">
              <thead>
                <tr className="text-ui-sm text-fg-subtle">
                  <th className="py-1 pr-3 font-normal">Name</th>
                  <th className="py-1 pr-3 font-normal">Value</th>
                  <th className="py-1 font-normal">Set by</th>
                </tr>
              </thead>
              <tbody>
                {environment.map((row, i) => (
                  <tr key={i} className="border-t border-hairline align-top">
                    <td className={`py-1.5 pr-3 font-mono text-mono-md ${row.dropped ? 'text-red line-through' : 'text-fg-strong'}`}>{row.name}</td>
                    <td className="py-1.5 pr-3 font-mono text-mono-md break-all text-fg-muted">
                      {row.value === '' ? <span className="text-fg-faint">(empty)</span> : row.value}
                      {(row.note || row.dropped) && (
                        <p className={`mt-0.5 font-sans text-note ${row.dropped ? 'text-red' : 'text-fg-subtle'}`}>{row.dropped ?? row.note}</p>
                      )}
                    </td>
                    <td className="py-1.5 text-ui-sm whitespace-nowrap text-fg-subtle">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </details>
      </div>
    </Widget>
  );
}

/* ==================================================================== *
 * Configuration file parsers
 * ==================================================================== */

type ParserId = PreviewParser | 'yaml' | 'xml';

interface ParserSample {
  file: string;
  input: string;
  find: string;
  tries: Array<{ label: string; apply: (draft: ParserDraft) => ParserDraft }>;
}

interface ParserDraft {
  input: string;
  find: string;
  exists: boolean;
}

const json = (value: unknown) => JSON.stringify(value, null, 4);

/** Replaces one key in a find map, keeping the order of the others. */
function withFind(find: string, key: string, value: unknown, replace?: string): string {
  try {
    const parsed = JSON.parse(find) as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    let placed = false;
    for (const [k, v] of Object.entries(parsed)) {
      if (k === (replace ?? key)) {
        out[key] = value;
        placed = true;
      } else out[k] = v;
    }
    if (!placed) out[key] = value;
    return json(out);
  } catch {
    return find;
  }
}

const PARSER_SAMPLES: Record<ParserId, ParserSample> = {
  properties: {
    file: 'server.properties',
    input: [
      '#Minecraft server properties',
      '#Mon Oct 06 12:00:00 UTC 2026',
      'enable-query=false',
      'server-ip=',
      'server-port=25565',
      'query.port=25565',
      '# Shown in the server list',
      'motd=A Minecraft Server',
      'max-players=20',
      '',
    ].join('\n'),
    find: json({
      'server-ip': '0.0.0.0',
      'server-port': '{{server.build.default.port}}',
      'query.port': '{{server.build.default.port}}',
      'max-players': '{{env.MAX_PLAYERS}}',
    }),
    tries: [
      { label: 'Use {{env.SERVER_PORT}}', apply: (d) => ({ ...d, find: withFind(d.find, 'server-port', '{{env.SERVER_PORT}}') }) },
      { label: 'Use {{server.allocations.default.port}}', apply: (d) => ({ ...d, find: withFind(d.find, 'server-port', '{{server.allocations.default.port}}') }) },
      { label: 'Only replace the default motd', apply: (d) => ({ ...d, find: withFind(d.find, 'motd', { 'A Minecraft Server': '{{env.SERVER_NAME}}' }) }) },
      { label: 'Only if the port is 25565', apply: (d) => ({ ...d, find: withFind(d.find, 'server-port', { '25565': '{{server.build.default.port}}' }) }) },
    ],
  },
  ini: {
    file: 'GameUserSettings.ini',
    input: [
      '[ServerSettings]',
      'ServerPassword=',
      'RCONPort=27020',
      '',
      '[SessionSettings]',
      'SessionName=ARK Server',
      'Port=7777',
      'QueryPort=27015',
      '',
      '[/Script/Engine.GameSession]',
      'MaxPlayers=70',
      '',
    ].join('\n'),
    find: json({
      'SessionSettings.Port': '{{server.build.default.port}}',
      'SessionSettings.SessionName': '{{env.SERVER_NAME}}',
      '[/Script/Engine.GameSession].MaxPlayers': '{{env.MAX_PLAYERS}}',
    }),
    tries: [
      { label: 'Section name in lowercase', apply: (d) => ({ ...d, find: withFind(d.find, 'sessionsettings.Port', '{{server.build.default.port}}', 'SessionSettings.Port') }) },
      { label: 'A password with # in it', apply: (d) => ({ ...d, input: d.input.replace(/^ServerPassword=.*$/m, 'ServerPassword=hunter#2') }) },
      { label: 'A line without =', apply: (d) => ({ ...d, input: d.input.replace('RCONPort=27020', 'RCONPort=27020\nRCONEnabled') }) },
    ],
  },
  json: {
    file: 'config.json',
    input: json({
      name: 'My App',
      server: { host: '127.0.0.1', port: 8080 },
      listeners: [
        { host: '127.0.0.1', port: 8080 },
        { host: '127.0.0.1', port: 8081 },
      ],
    }) + '\n',
    find: json({
      'server.host': '0.0.0.0',
      'server.port': '{{server.build.default.port}}',
      'listeners.*.host': '0.0.0.0',
      name: '{{env.SERVER_NAME}}',
    }),
    tries: [
      { label: 'Only if host is 127.0.0.1', apply: (d) => ({ ...d, find: withFind(d.find, 'server.host', { '127.0.0.1': '0.0.0.0' }) }) },
      { label: 'Set a key inside a string', apply: (d) => ({ ...d, find: withFind(d.find, 'name.short', 'App') }) },
      { label: 'The file does not exist yet', apply: (d) => ({ ...d, exists: false }) },
    ],
  },
  file: {
    file: 'serverconfig.txt',
    input: [
      'worldpath=/home/container/saves/Worlds',
      'worldname=world',
      'world=/home/container/saves/Worlds/world.wld',
      'port=7777',
      'maxplayers=8',
      "motd=Please don't cut the purple trees!",
      '',
    ].join('\n'),
    find: json({
      'worldname=': 'worldname={{env.WORLD_NAME}}',
      'world=': 'world=/home/container/saves/Worlds/{{env.WORLD_NAME}}.wld',
      'port=': 'port={{server.build.default.port}}',
      'maxplayers=': 'maxplayers={{env.MAX_PLAYERS}}',
    }),
    tries: [
      { label: 'Match world instead of world=', apply: (d) => ({ ...d, find: withFind(d.find, 'world', 'world=/home/container/saves/Worlds/{{env.WORLD_NAME}}.wld', 'world=') }) },
      { label: 'A line the file does not have', apply: (d) => ({ ...d, find: withFind(d.find, 'password=', 'password=hunter2') }) },
      { label: 'The file does not exist yet', apply: (d) => ({ ...d, exists: false }) },
    ],
  },
  yaml: {
    file: 'config.yml',
    input: ['listeners:', '- host: 0.0.0.0:25577', '  query_port: 25577', 'servers:', '  lobby:', '    address: localhost:25565', ''].join('\n'),
    find: json({
      'listeners[0].host': '0.0.0.0:{{server.build.default.port}}',
      'listeners[0].query_port': '{{server.build.default.port}}',
      'servers.*.address': { 'regex:^(127\\.0\\.0\\.1|localhost)(:\\d{1,5})?$': '{{config.docker.interface}}$2' },
    }),
    tries: [{ label: 'Use {{env.SERVER_IP}}', apply: (d) => ({ ...d, find: withFind(d.find, 'listeners[0].host', '{{env.SERVER_IP}}:{{server.build.default.port}}') }) }],
  },
  xml: {
    file: 'serverconfig.xml',
    input: ['<?xml version="1.0"?>', '<ServerSettings>', '  <Port>26900</Port>', '  <Name value="My Server"/>', '</ServerSettings>', ''].join('\n'),
    find: json({
      'ServerSettings.Port': '{{server.build.default.port}}',
      'ServerSettings.Name': "[value='{{env.SERVER_NAME}}']",
    }),
    tries: [{ label: 'Use {{server.build.port}}', apply: (d) => ({ ...d, find: withFind(d.find, 'ServerSettings.Port', '{{server.build.port}}') }) }],
  },
};

const PARSERS: ParserId[] = ['properties', 'ini', 'json', 'file', 'yaml', 'xml'];

const NOT_PREVIEWED: Record<'yaml' | 'xml', string> = {
  yaml: 'Wings reads the YAML into a map and sets keys the same way as the json parser: dots for nesting, [0] for a list item, and * for every item. It then writes the whole file back with keys sorted, four-space indents, and no comments.',
  xml: "Wings turns the key into an element path, creates missing elements (unless the key has a *), and sets each element's text. A value written as [name='value'] sets that attribute instead. It writes the file back with two-space indents.",
};

function initialDrafts(): Record<ParserId, ParserDraft> {
  return Object.fromEntries(PARSERS.map((p) => [p, { input: PARSER_SAMPLES[p].input, find: PARSER_SAMPLES[p].find, exists: true }])) as Record<ParserId, ParserDraft>;
}

function parseVariables(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) out[line.slice(0, eq).trim()] = line.slice(eq + 1);
  }
  return out;
}

function showValue(rw: ReplaceWith): string {
  switch (rw.type) {
    case 'string':
      return JSON.stringify(rw.value);
    case 'number':
      return rw.raw;
    case 'boolean':
      return String(rw.value);
    case 'null':
      return 'null';
    default:
      return '{…}';
  }
}

type LineMark = 'same' | 'changed' | 'reformatted';

/**
 * Marks each output line. A line-by-line comparison suits the file parser, which
 * keeps one output line per input line; the others get a longest-common-subsequence
 * diff that ignores whitespace, so a line Wings only re-spaced reads as reformatted.
 */
function diffLines(before: string[], after: string[], positional: boolean): { marks: LineMark[]; removed: number } {
  if (positional) {
    return {
      marks: after.map((line, i) => (line === before[i] ? 'same' : 'changed')),
      removed: Math.max(0, before.length - after.length),
    };
  }
  const squash = (line: string) => line.replace(/\s+/g, '');
  const a = before.map(squash);
  const b = after.map(squash);
  const n = a.length;
  const m = b.length;
  const table = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const marks = new Array<LineMark>(m).fill('changed');
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      marks[j] = before[i] === after[j] ? 'same' : 'reformatted';
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) i++;
    else j++;
  }
  const changed = marks.filter((mark) => mark === 'changed').length;
  return { marks, removed: Math.max(0, n - table[0][0] - changed) };
}

const OUTCOME: Record<Outcome['status'], { tone: Tone | null; label: string }> = {
  changed: { tone: 'green', label: 'set' },
  added: { tone: 'blue', label: 'added' },
  unchanged: { tone: null, label: 'same' },
  skipped: { tone: 'yellow', label: 'skipped' },
  none: { tone: 'red', label: 'not applied' },
  error: { tone: 'red', label: 'error' },
};

function splitLines(text: string): string[] {
  const lines = text.split('\n');
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function FileView({ before, after, positional }: { before: string; after: string; positional: boolean }) {
  const beforeLines = splitLines(before);
  const afterLines = after === '' ? [] : splitLines(after);
  const { marks, removed } = diffLines(beforeLines, afterLines, positional);
  const changed = marks.filter((mark) => mark === 'changed').length;
  const reformatted = marks.filter((mark) => mark === 'reformatted').length;
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
  const summary = [
    changed ? `${plural(changed, 'line')} new or changed` : '',
    reformatted ? `${plural(reformatted, 'line')} only re-spaced` : '',
    removed ? `${plural(removed, 'line')} from the original gone` : '',
  ].filter(Boolean);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-hairline bg-black py-3 font-mono text-mono-lg leading-relaxed">
        {afterLines.length === 0 && <p className="px-4 text-fg-faint">(empty file)</p>}
        {afterLines.map((line, i) => (
          <div key={i} className={`flex min-w-max ${marks[i] === 'changed' ? 'bg-green/10' : ''}`}>
            <span className={`w-1 shrink-0 ${marks[i] === 'changed' ? 'bg-green' : marks[i] === 'reformatted' ? 'bg-fg-faint' : ''}`} aria-hidden="true" />
            <span className="w-9 shrink-0 pr-3 text-right text-fg-faint select-none">{i + 1}</span>
            <span className={`pr-4 whitespace-pre ${marks[i] === 'changed' ? 'text-fg-strong' : 'text-fg-muted'}`}>{line === '' ? ' ' : line}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-ui-sm text-fg-subtle">{summary.length ? `${summary.join(', ')}.` : 'No lines changed.'}</p>
    </>
  );
}

function ReplacementRow({ replacement, notes }: { replacement: PanelReplacement; notes: Array<{ tone: Tone; text: string; placeholder?: string }> }) {
  return (
    <li className="border-t border-hairline py-2 first:border-t-0">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-mono-md">
        <span className={replacement.matchIsInt ? 'text-red' : 'text-fg-strong'}>{replacement.match}</span>
        {replacement.ifValue !== null && (
          <span className="text-fg-subtle">
            if <span className={replacement.ifValueIsInt ? 'text-red' : 'text-fg-muted'}>{JSON.stringify(replacement.ifValue)}</span>
          </span>
        )}
        <span className="text-fg-faint" aria-hidden="true">
          →
        </span>
        <span className="break-all text-fg-muted">{showValue(replacement.replaceWith)}</span>
      </div>
      {notes.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-note">
          {notes.map((note, i) => (
            <li key={i} className={TONE_TEXT[note.tone]}>
              {note.placeholder && <span className="font-mono text-mono-md">{note.placeholder}</span>}
              {note.placeholder && ': '}
              {note.text}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

type PanelState = { error: string } | { replacements: PanelReplacement[] };

export function ConfigParserPlayground() {
  const [parser, setParser] = useState<ParserId>('properties');
  const [drafts, setDrafts] = useState<Record<ParserId, ParserDraft>>(initialDrafts);
  const [server, setServer] = useState({ ip: '192.168.1.10', port: '25565', memory: '4096', dockerInterface: '172.18.0.1' });
  const [variablesText, setVariablesText] = useState('MAX_PLAYERS=50\nSERVER_NAME=My Pterodactyl Server\nWORLD_NAME=world');

  const draft = drafts[parser];
  const sample = PARSER_SAMPLES[parser];
  const setDraft = (patch: Partial<ParserDraft>) => setDrafts((all) => ({ ...all, [parser]: { ...all[parser], ...patch } }));

  const env = useMemo(
    () => ({
      ...parseVariables(variablesText),
      STARTUP: 'java -jar {{SERVER_JARFILE}}',
      P_SERVER_LOCATION: 'us1',
      P_SERVER_UUID: '6d1f7929-5c2e-4cd4-99af-924dacb15537',
    }),
    [variablesText],
  );

  const panel = useMemo((): PanelState => {
    try {
      const find = parseOrderedJson(draft.find);
      if (find.t !== 'object' && find.t !== 'array') return { error: 'find must be a JSON object.' };
      return { replacements: panelReplacements(find, { uuid: env.P_SERVER_UUID, ip: server.ip, port: server.port, memory: server.memory, env }) };
    } catch (error) {
      if (error instanceof JsonSyntaxError) return { error: `Not valid JSON: ${error.message}.` };
      throw error;
    }
  }, [draft.find, env, server.ip, server.port, server.memory]);

  const replacements = 'replacements' in panel ? panel.replacements : [];
  const dropped = replacements.some((r) => r.matchIsInt || r.ifValueIsInt);
  const wingsReplacements = dropped ? [] : replacements.map((r) => ({ match: r.match, ifValue: r.ifValue ?? '', replaceWith: r.replaceWith }));
  const previewable = parser !== 'yaml' && parser !== 'xml';
  const result = previewable && 'replacements' in panel ? runWingsParser(parser, draft.input, draft.exists, wingsReplacements, server.dockerInterface) : null;

  const rowNotes = (r: PanelReplacement) => {
    const notes: Array<{ tone: Tone; text: string; placeholder?: string }> = r.notes.map((n) => ({ tone: n.tone, text: n.text, placeholder: n.placeholder }));
    if (r.matchIsInt) notes.push({ tone: 'red', text: `PHP stores the key "${r.match}" as a number, and Wings can't read a number here.` });
    if (r.ifValueIsInt) notes.push({ tone: 'red', text: `PHP stores "${r.ifValue}" as a number, and Wings can't read a number as if_value.` });
    if (parser !== 'file') {
      const looked = lookupConfigurationValue(r.replaceWith, server.dockerInterface);
      if (looked.note) notes.push({ tone: looked.note.tone, text: `Wings: ${looked.note.text}` });
    }
    if (r.ifValue !== null && !r.ifValueIsInt) {
      if (parser === 'properties') {
        notes.push({ tone: 'blue', text: `Wings only replaces the value when it is exactly "${r.ifValue}".` });
      } else if (parser === 'json' || parser === 'yaml') {
        notes.push({
          tone: 'yellow',
          text: r.ifValue.startsWith('regex:')
            ? 'Wings runs a regex: if_value only when the key is missing, so it never changes a value that is already there.'
            : `Wings compares if_value with the whole ${r.match.includes('.*') ? 'item' : 'document'}, not the key, so this only sets the key when it is missing.`,
        });
      } else {
        notes.push({ tone: 'yellow', text: `The ${parser} parser ignores if_value.` });
      }
    }
    if (parser === 'xml' && r.replaceWith.type === 'string') {
      const attribute = /^\[(\w+)='(.*)'\]$/.exec(lookupConfigurationValue(r.replaceWith, server.dockerInterface).value);
      if (attribute) notes.push({ tone: 'blue', text: `Wings sets the ${attribute[1]} attribute to "${attribute[2]}" instead of the element's text.` });
    }
    return notes;
  };

  return (
    <Widget
      title="Configuration file playground"
      description="Pick a parser, then edit the egg's find rules, the server, or the file. The result shows the file after Wings updates it."
    >
      <div className="@container">
      <Segmented label="Parser" value={parser} onChange={setParser} options={PARSERS.map((p) => ({ value: p, label: p }))} />
      <TryRow
        items={sample.tries.map((t) => ({
          label: t.label,
          run: () => setDrafts((all) => ({ ...all, [parser]: t.apply(all[parser]) })),
        }))}
      />

      <div className="mt-5 grid gap-5 @3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <Label>The egg&apos;s configuration files</Label>
          <p className="mb-1.5 font-mono text-mono-md text-fg-subtle">
            &quot;{sample.file}&quot;: {'{'} &quot;parser&quot;: &quot;{parser}&quot;, &quot;find&quot;:
          </p>
          <TextArea label="find" value={draft.find} onChange={(find) => setDraft({ find })} rows={Math.min(12, Math.max(6, draft.find.split('\n').length + 1))} />
          <p className="mt-1.5 font-mono text-mono-md text-fg-subtle">{'}'}</p>
        </div>
        <div className="min-w-0">
          <Label>The server</Label>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Allocation IP">
              <Input label="Allocation IP" value={server.ip} onChange={(ip) => setServer((s) => ({ ...s, ip }))} />
            </Field>
            <Field label="Allocation port">
              <Input label="Allocation port" value={server.port} onChange={(port) => setServer((s) => ({ ...s, port }))} />
            </Field>
            <Field label="Memory (MiB)">
              <Input label="Memory in MiB" value={server.memory} onChange={(memory) => setServer((s) => ({ ...s, memory }))} />
            </Field>
            <Field label="Docker interface">
              <Input label="Docker interface" value={server.dockerInterface} onChange={(dockerInterface) => setServer((s) => ({ ...s, dockerInterface }))} />
            </Field>
          </div>
          <Field label="Variables, one NAME=value per line" className="mt-2.5">
            <TextArea label="Variables" value={variablesText} onChange={setVariablesText} rows={3} />
          </Field>
          <p className="mt-1.5 text-note text-fg-subtle">{'{{env.*}}'} also sees STARTUP, P_SERVER_UUID, and P_SERVER_LOCATION.</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Label>The file before the server starts</Label>
          <Check checked={draft.exists} onChange={(exists) => setDraft({ exists })}>
            The file exists
          </Check>
        </div>
        <TextArea
          label={`${sample.file} before`}
          value={draft.exists ? draft.input : ''}
          onChange={(input) => setDraft({ input })}
          rows={Math.min(14, Math.max(5, draft.input.split('\n').length))}
          disabled={!draft.exists}
        />
      </div>

      <Section title="1. What the Panel sends Wings">
        {'error' in panel ? (
          <p className="text-note text-red">{panel.error}</p>
        ) : replacements.length === 0 ? (
          <p className="text-note text-fg-subtle">No settings. Add keys to find.</p>
        ) : (
          <>
            {dropped && (
              <p className="mb-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-note text-red">
                Wings can&apos;t read this file&apos;s settings, so it drops all of them and only rewrites the file. A key that is a whole number, such as
                &quot;25565&quot;, reaches Wings as a number.
              </p>
            )}
            <ul className="rounded-lg border border-hairline bg-surface px-3 py-1">
              {replacements.map((r, i) => (
                <ReplacementRow key={i} replacement={r} notes={rowNotes(r)} />
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section
        title="2. The file after Wings updates it"
        aside={result && (result.ok ? <Status tone="green">updated</Status> : <Status tone="red">left unchanged</Status>)}
      >
        {!previewable ? (
          <div className="rounded-lg border border-yellow/30 bg-yellow/10 px-3 py-2 text-note text-fg-muted">
            <p className="text-yellow">Wings supports the {parser} parser, but this page can&apos;t preview it.</p>
            <p className="mt-1">{NOT_PREVIEWED[parser as 'yaml' | 'xml']}</p>
          </div>
        ) : !result ? (
          <p className="text-note text-fg-subtle">Fix the find rules first.</p>
        ) : (
          <>
            {!result.ok && (
              <p className="mb-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-note text-red">
                {draft.exists
                  ? 'Wings can’t update the file, logs this error, and starts the server with the file as it was: '
                  : 'Wings creates an empty file, can’t parse it, and leaves it empty: '}
                {result.error}
              </p>
            )}
            {result.outcomes.length > 0 && !dropped && (
              <ul className="mb-3 space-y-1.5">
                {result.outcomes.map((outcome, i) => {
                  const style = OUTCOME[outcome.status];
                  if (!result.ok && outcome.status !== 'error') return null;
                  return (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-note">
                      {style.tone ? <Status tone={style.tone}>{style.label}</Status> : <Neutral>{style.label}</Neutral>}
                      <span className="font-mono text-mono-md text-fg-strong">{replacements[i]?.match}</span>
                      <span className="min-w-0 break-words text-fg-muted">{outcome.detail}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            <FileView before={draft.exists ? draft.input : ''} after={result.output} positional={parser === 'file'} />
            {result.notes.length > 0 && (
              <ul className="mt-2 space-y-1 text-note text-fg-muted">
                {result.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>
      </div>
    </Widget>
  );
}
