// How a server's startup command and environment are built.
//
//   - The Startup page shows StartupCommandService::handle(): it replaces
//     {{SERVER_MEMORY}}, {{SERVER_IP}}, {{SERVER_PORT}} and then each egg variable's
//     {{ENV_NAME}} with one str_replace() call. Variables users can't view become
//     "[hidden]". Any other {{...}} stays as written.
//   - The container's environment comes from EnvironmentService::handle() on the
//     Panel (egg variables, then STARTUP, P_SERVER_LOCATION, P_SERVER_UUID, then
//     pterodactyl.environment_variables) and Server::GetEnvironmentVariables() in
//     Wings, which sets TZ, STARTUP, SERVER_MEMORY, SERVER_IP and SERVER_PORT first,
//     uppercases every other name, and skips names it already set.

export interface StartupVariable {
  name: string;
  env: string;
  /** The value saved for the server. The Panel stores an empty value as ''. */
  saved: string;
  viewable: boolean;
}

export interface ServerContext {
  memory: string;
  ip: string;
  port: string;
}

export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'builtin'; text: string; placeholder: string }
  | { kind: 'variable'; text: string; placeholder: string; index: number }
  | { kind: 'hidden'; text: string; placeholder: string; index: number }
  | { kind: 'unresolved'; text: string };

export interface RenderedStartup {
  /** Exactly what the Startup page shows. */
  command: string;
  /** The command split by origin, or null when replacements overlap and can't be traced. */
  segments: Segment[] | null;
  /** Placeholders left in the command, such as `{{SERVER_JAR}}`. */
  unresolved: string[];
}

type Replacement = { find: string; replace: string; segment: (text: string) => Segment };

/** PHP's str_replace() with arrays: each pair runs over the result of the previous one. */
function strReplace(pairs: Replacement[], subject: string): string {
  return pairs.reduce((out, { find, replace }) => (find === '' ? out : out.split(find).join(replace)), subject);
}

export function renderStartup(template: string, server: ServerContext, variables: StartupVariable[]): RenderedStartup {
  const pairs: Replacement[] = [
    { find: '{{SERVER_MEMORY}}', replace: server.memory, segment: (text) => ({ kind: 'builtin', text, placeholder: 'SERVER_MEMORY' }) },
    { find: '{{SERVER_IP}}', replace: server.ip, segment: (text) => ({ kind: 'builtin', text, placeholder: 'SERVER_IP' }) },
    { find: '{{SERVER_PORT}}', replace: server.port, segment: (text) => ({ kind: 'builtin', text, placeholder: 'SERVER_PORT' }) },
    ...variables.map(
      (variable, index): Replacement => ({
        find: `{{${variable.env}}}`,
        replace: variable.viewable ? variable.saved : '[hidden]',
        segment: (text) =>
          variable.viewable
            ? { kind: 'variable', text, placeholder: variable.env, index }
            : { kind: 'hidden', text, placeholder: variable.env, index },
      }),
    ),
  ];

  const command = strReplace(pairs, template);

  // Trace where each part came from by only replacing inside untouched text.
  let segments: Segment[] = [{ kind: 'text', text: template }];
  for (const pair of pairs) {
    if (pair.find === '') continue;
    segments = segments.flatMap((segment) => {
      if (segment.kind !== 'text' || !segment.text.includes(pair.find)) return [segment];
      const parts = segment.text.split(pair.find);
      return parts.flatMap((part, i): Segment[] => [
        ...(part ? [{ kind: 'text' as const, text: part }] : []),
        ...(i < parts.length - 1 ? [pair.segment(pair.replace)] : []),
      ]);
    });
  }

  const unresolved = new Set<string>();
  segments = segments.flatMap((segment) => {
    if (segment.kind !== 'text') return [segment];
    return segment.text.split(/(\{\{[^{}]*\}\})/).flatMap((part, i): Segment[] => {
      if (part === '') return [];
      if (i % 2 === 1) {
        unresolved.add(part);
        return [{ kind: 'unresolved', text: part }];
      }
      return [{ kind: 'text', text: part }];
    });
  });

  const traced = segments.map((s) => s.text).join('') === command;
  if (!traced) {
    for (const match of command.matchAll(/\{\{[^{}]*\}\}/g)) unresolved.add(match[0]);
  }

  return { command, segments: traced ? segments : null, unresolved: [...unresolved] };
}

export interface EnvironmentRow {
  name: string;
  value: string;
  source: 'Wings' | 'Panel' | 'Egg variable';
  /** Why this variable never reaches the container. */
  dropped?: string;
  note?: string;
}

export interface NodeContext {
  timezone: string;
  dockerInterface: string;
  uuid: string;
  location: string;
  /** The server's allocation limit, or null when it has none. */
  allocationLimit: number | null;
}

/** The environment variables the server's container starts with. */
export function containerEnvironment(
  template: string,
  server: ServerContext,
  variables: StartupVariable[],
  node: NodeContext,
): EnvironmentRow[] {
  // EnvironmentService::handle(): a PHP array, so a later key overwrites an earlier one in place.
  const panel = new Map<string, { value: string; source: EnvironmentRow['source'] }>();
  const overwritten: EnvironmentRow[] = [];
  const set = (key: string, value: string, source: EnvironmentRow['source']) => {
    const previous = panel.get(key);
    if (previous && previous.source === 'Egg variable' && source === 'Panel') {
      overwritten.push({ name: key, value: previous.value, source: previous.source, dropped: `The Panel sets ${key} itself and overwrites this variable.` });
    }
    panel.set(key, { value, source });
  };

  for (const variable of variables) set(variable.env, variable.saved, 'Egg variable');
  set('STARTUP', template, 'Panel');
  set('P_SERVER_LOCATION', node.location, 'Panel');
  set('P_SERVER_UUID', node.uuid, 'Panel');
  // An integer reaches Wings as a JSON number, which Go formats with "%f".
  set('P_SERVER_ALLOCATION_LIMIT', node.allocationLimit === null ? '' : node.allocationLimit.toFixed(6), 'Panel');

  const ip = server.ip === '127.0.0.1' ? node.dockerInterface : server.ip;
  const rows: EnvironmentRow[] = [
    { name: 'TZ', value: node.timezone, source: 'Wings' },
    { name: 'STARTUP', value: template, source: 'Wings', note: 'The command as written, placeholders included.' },
    { name: 'SERVER_MEMORY', value: server.memory, source: 'Wings' },
    {
      name: 'SERVER_IP',
      value: ip,
      source: 'Wings',
      note: server.ip === '127.0.0.1' ? 'Wings swaps 127.0.0.1 for the Docker network interface.' : undefined,
    },
    { name: 'SERVER_PORT', value: server.port, source: 'Wings' },
  ];
  const builtIn = rows.length;

  for (const [key, { value, source }] of panel) {
    const name = key.toUpperCase();
    const index = rows.findIndex((row) => !row.dropped && row.name === name);
    if (index !== -1) {
      if (source === 'Panel' && name === 'STARTUP') continue;
      rows.push({
        name: key,
        value,
        source,
        dropped:
          index < builtIn
            ? `Wings sets ${name} itself and skips this one.`
            : `Another variable also becomes ${name} in the container. Wings keeps only one of them, and which one is not fixed.`,
      });
      continue;
    }
    rows.push({
      name,
      value,
      source,
      note: name !== key ? `Wings uppercases ${key} to ${name}.` : undefined,
    });
  }

  return [...rows, ...overwritten];
}
