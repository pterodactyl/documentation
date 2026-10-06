// What the Panel sends Wings for an egg's "config.files" entry, emulating
// EggConfigurationService::replacePlaceholders() and matchAndReplaceKeys().
//
//   - Each `find` key becomes a `match`. A nested object becomes one entry per key,
//     with that key as `if_value`.
//   - In string values, {{server.*}} reads the server's legacy configuration
//     structure, {{env.*}} reads build.env (the server's variables), and
//     {{config.*}} is left for Wings. Anything missing becomes an empty string.
//   - {{env.SERVER_PORT}}, {{env.SERVER_IP}}, {{env.SERVER_MEMORY}} and the
//     server.build.env.* forms are rewritten to their server.* names but never
//     filled in, so the placeholder text reaches the file.
//   - The egg JSON is decoded into PHP arrays, so a key such as "25565" turns into
//     the integer 25565. Wings then fails to read the entry.

/** A JSON value with object key order kept, the way PHP's json_decode() keeps it. */
export type JsonValue =
  | { t: 'object'; entries: Array<[string, JsonValue]> }
  | { t: 'array'; items: JsonValue[] }
  | { t: 'string'; v: string }
  | { t: 'number'; raw: string }
  | { t: 'boolean'; v: boolean }
  | { t: 'null' };

export class JsonSyntaxError extends Error {}

/** A strict JSON parser that keeps object key order and number text. */
export function parseOrderedJson(text: string): JsonValue {
  let i = 0;
  const fail = (what: string): never => {
    const line = text.slice(0, i).split('\n').length;
    throw new JsonSyntaxError(`${what} on line ${line}`);
  };
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++;
  };
  const value = (): JsonValue => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      const entries: Array<[string, JsonValue]> = [];
      ws();
      if (text[i] === '}') {
        i++;
        return { t: 'object', entries };
      }
      for (;;) {
        ws();
        if (text[i] !== '"') fail('Expected a quoted key');
        const key = string();
        ws();
        if (text[i] !== ':') fail('Expected ":"');
        i++;
        const v = value();
        const existing = entries.findIndex(([k]) => k === key);
        if (existing === -1) entries.push([key, v]);
        else entries[existing] = [key, v];
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === '}') {
          i++;
          return { t: 'object', entries };
        }
        fail('Expected "," or "}"');
      }
    }
    if (c === '[') {
      i++;
      const items: JsonValue[] = [];
      ws();
      if (text[i] === ']') {
        i++;
        return { t: 'array', items };
      }
      for (;;) {
        items.push(value());
        ws();
        if (text[i] === ',') {
          i++;
          continue;
        }
        if (text[i] === ']') {
          i++;
          return { t: 'array', items };
        }
        fail('Expected "," or "]"');
      }
    }
    if (c === '"') return { t: 'string', v: string() };
    const number = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
    if (number) {
      i += number[0].length;
      return { t: 'number', raw: number[0] };
    }
    for (const [word, v] of [['true', { t: 'boolean', v: true }], ['false', { t: 'boolean', v: false }], ['null', { t: 'null' }]] as const) {
      if (text.startsWith(word, i)) {
        i += word.length;
        return v;
      }
    }
    return fail(i >= text.length ? 'Unexpected end of input' : `Unexpected "${c}"`);
  };
  const string = (): string => {
    i++;
    let out = '';
    for (;;) {
      if (i >= text.length) fail('Unterminated string');
      const c = text[i++];
      if (c === '"') return out;
      if (c === '\\') {
        const e = text[i++];
        const map: Record<string, string> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
        if (e in map) out += map[e];
        else if (e === 'u' && /^[0-9a-fA-F]{4}$/.test(text.slice(i, i + 4))) {
          out += String.fromCharCode(parseInt(text.slice(i, i + 4), 16));
          i += 4;
        } else fail('Invalid escape');
      } else if (c < ' ') {
        fail('Control character in string');
      } else {
        out += c;
      }
    }
  };
  const result = value();
  ws();
  if (i < text.length) fail(`Unexpected "${text[i]}"`);
  return result;
}

/** True when PHP stores this array key as an integer. */
export function isPhpIntKey(key: string): boolean {
  if (!/^(0|-?[1-9]\d*)$/.test(key)) return false;
  const n = BigInt(key);
  return n >= -(2n ** 63n) && n <= 2n ** 63n - 1n;
}

/** A value as Wings reads it from the Panel's JSON. */
export type ReplaceWith =
  | { type: 'string'; value: string }
  | { type: 'number'; raw: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }
  | { type: 'object' };

export interface PlaceholderNote {
  placeholder: string;
  tone: 'green' | 'red' | 'yellow' | 'blue';
  text: string;
}

export interface PanelReplacement {
  match: string;
  /** The PHP array key was an integer, so Wings can't read `match`. */
  matchIsInt: boolean;
  ifValue: string | null;
  ifValueIsInt: boolean;
  replaceWith: ReplaceWith;
  notes: PlaceholderNote[];
}

export interface ConfigServer {
  uuid: string;
  ip: string;
  port: string;
  memory: string;
  /** The server's environment on the Panel: egg variables, STARTUP, P_SERVER_*. */
  env: Record<string, string>;
}

/** ServerConfigurationStructureService::returnLegacyFormat(), which {{server.*}} reads. */
function legacyStructure(server: ConfigServer): unknown {
  const asInt = (value: string) => (/^-?\d+$/.test(value.trim()) ? Number(value.trim()) : value);
  return {
    uuid: server.uuid,
    build: {
      default: { ip: server.ip, port: asInt(server.port) },
      ports: { [server.ip]: [asInt(server.port)] },
      env: server.env,
      oom_disabled: false,
      memory: asInt(server.memory),
      swap: 0,
      io: 500,
      cpu: 0,
      threads: null,
      disk: 10240,
      image: 'ghcr.io/pterodactyl/yolks:java_21',
    },
    service: { egg: '9e1a5b1c-1f0d-4b6e-8a7a-4f0b9a1f2c3d', skip_scripts: false },
    rebuild: false,
    suspended: 0,
  };
}

const MISSING = Symbol('missing');

/** Laravel's Arr::get() with dot notation. */
function arrGet(data: unknown, key: string): unknown {
  const isArray = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
  if (!isArray(data)) return MISSING;
  if (key in data) return data[key];
  if (!key.includes('.')) return MISSING;
  let current: unknown = data;
  for (const segment of key.split('.')) {
    if (isArray(current) && segment in current) current = current[segment];
    else return MISSING;
  }
  return current;
}

/** EggConfigurationService::placeholderValue(). */
function placeholderValue(value: unknown): string {
  if (value === null || value === MISSING) return '';
  if (typeof value === 'boolean') return value ? '1' : '';
  if (typeof value === 'object') return 'Array';
  return String(value);
}

const LEGACY: Record<string, string> = {
  'config.docker.interface': 'config.docker.network.interface',
  'server.build.env.SERVER_MEMORY': 'server.build.memory',
  'env.SERVER_MEMORY': 'server.build.memory',
  'server.build.env.SERVER_IP': 'server.build.default.ip',
  'env.SERVER_IP': 'server.build.default.ip',
  'server.build.env.SERVER_PORT': 'server.build.default.port',
  'env.SERVER_PORT': 'server.build.default.port',
};

/** matchAndReplaceKeys() for one string, with a note for each placeholder. */
function replaceKeys(input: string, structure: unknown, server: ConfigServer, notes: PlaceholderNote[]): string {
  let value = input;
  const keys = [...input.matchAll(/\{\{([A-Za-z0-9_.-]*)\}\}/g)].map((m) => m[1]);
  const legacyKeys: Array<[string, string]> = [];

  for (const key of keys) {
    const placeholder = `{{${key}}}`;
    if (!/^(server|env|config)\./.test(key)) {
      notes.push({ placeholder, tone: 'yellow', text: 'The Panel only fills in server., env., and config. placeholders, so this one stays as written.' });
      continue;
    }

    const legacy = LEGACY[key];
    if (legacy) value = value.split(placeholder).join(`{{${legacy}}}`);

    if (key.startsWith('config.')) {
      notes.push({
        placeholder,
        tone: 'blue',
        text: legacy ? `The Panel rewrites it to {{${legacy}}} and leaves it for Wings.` : 'The Panel leaves it for Wings.',
      });
      continue;
    }

    if (legacy) {
      // Checked at the end: a later {{server.*}} placeholder in the same value can still fill it in.
      legacyKeys.push([placeholder, legacy]);
      continue;
    }

    const path = key.startsWith('server.') ? key.slice('server.'.length) : `build.env.${key.slice('env.'.length)}`;
    const plucked = arrGet(structure, path);
    const replacement = placeholderValue(plucked);
    value = value.split(placeholder).join(replacement);

    if (plucked === MISSING) {
      let hint = '';
      if (key.startsWith('env.')) {
        const name = key.slice(4);
        const other = Object.keys(server.env).find((env) => env.toLowerCase() === name.toLowerCase());
        hint = other ? ` Names are case-sensitive: the variable is ${other}.` : ' No variable has this name.';
      } else if (key.startsWith('server.allocations')) {
        hint = ' Placeholders read the older structure. Use {{server.build.default.port}} or {{server.build.default.ip}}.';
      }
      notes.push({ placeholder, tone: 'red', text: `Missing, so the Panel writes an empty value.${hint}` });
    } else if (typeof plucked === 'object' && plucked !== null) {
      notes.push({ placeholder, tone: 'yellow', text: 'This is a list, not a single value, so the Panel writes the word Array.' });
    } else if (typeof plucked === 'boolean' || plucked === null) {
      notes.push({ placeholder, tone: 'yellow', text: `The value is ${plucked === null ? 'null' : plucked}, which the Panel writes as "${replacement}".` });
    } else {
      notes.push({ placeholder, tone: 'green', text: replacement === '' ? 'Filled in with an empty value.' : `Filled in with ${replacement}.` });
    }
  }

  for (const [placeholder, legacy] of legacyKeys) {
    notes.push(
      value.includes(`{{${legacy}}}`)
        ? {
            placeholder,
            tone: 'red',
            text: `The Panel rewrites it to {{${legacy}}} but never fills that in, so the placeholder text ends up in the file. Write {{${legacy}}} instead.`,
          }
        : { placeholder, tone: 'yellow', text: `The Panel rewrites it to {{${legacy}}}, which a later placeholder in this value happens to fill in.` },
    );
  }

  for (const match of input.matchAll(/\{\{\s+[^{}]*?\s*\}\}|\{\{[^{}]*?\s+\}\}/g)) {
    notes.push({
      placeholder: match[0],
      tone: 'yellow',
      text: /config\./.test(match[0])
        ? 'The Panel skips it because of the spaces. Wings still reads a {{config.*}} placeholder with one space on each side.'
        : 'The spaces stop the Panel from reading it, so it stays as written.',
    });
  }

  return value;
}

/** PHP json_encode() of a decoded number, which Wings then reads as raw text. */
function phpNumber(raw: string): string {
  if (/^-?\d+$/.test(raw) && isPhpIntKey(raw.replace(/^-0$/, '0'))) return String(BigInt(raw));
  const n = Number(raw);
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = String(n);
  return s.includes('e') && !s.split('e')[0].includes('.') ? s.replace('e', '.0e') : s;
}

function toReplaceWith(value: JsonValue, structure: unknown, server: ConfigServer, notes: PlaceholderNote[]): ReplaceWith {
  switch (value.t) {
    case 'string':
      return { type: 'string', value: replaceKeys(value.v, structure, server, notes) };
    case 'number':
      return { type: 'number', raw: phpNumber(value.raw) };
    case 'boolean':
      return { type: 'boolean', value: value.v };
    case 'null':
      return { type: 'null' };
    default:
      return { type: 'object' };
  }
}

/** Turns an egg's `find` object into the replacements the Panel sends Wings. */
export function panelReplacements(find: JsonValue, server: ConfigServer): PanelReplacement[] {
  if (find.t !== 'object' && find.t !== 'array') return [];
  const structure = legacyStructure(server);
  const entries: Array<[string, JsonValue]> = find.t === 'object' ? find.entries : find.items.map((item, index) => [String(index), item]);
  const out: PanelReplacement[] = [];

  for (const [match, value] of entries) {
    const matchIsInt = isPhpIntKey(match);
    if (value.t === 'object' || value.t === 'array') {
      const inner: Array<[string, JsonValue]> = value.t === 'object' ? value.entries : value.items.map((item, index) => [String(index), item]);
      for (const [ifValue, replaceWith] of inner) {
        const notes: PlaceholderNote[] = [];
        out.push({
          match,
          matchIsInt,
          ifValue,
          ifValueIsInt: isPhpIntKey(ifValue),
          replaceWith: toReplaceWith(replaceWith, structure, server, notes),
          notes,
        });
      }
      continue;
    }
    const notes: PlaceholderNote[] = [];
    out.push({ match, matchIsInt, ifValue: null, ifValueIsInt: false, replaceWith: toReplaceWith(value, structure, server, notes), notes });
  }

  return out;
}
