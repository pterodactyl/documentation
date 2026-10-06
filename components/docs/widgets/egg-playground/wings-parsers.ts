// What Wings does with a configuration file when the server starts, emulating
// wings/parser (parser.go, helpers.go) and the libraries it calls:
//
//   - properties: github.com/magiconair/properties v1.8.9
//   - ini:        gopkg.in/ini.v1 v1.67.0
//   - json:       github.com/Jeffail/gabs/v2 v2.7.0 and encoding/json
//   - file:       a line-by-line prefix match
//
// yaml and xml are supported by Wings but not emulated here.

import type { ReplaceWith } from './panel-config';

export interface WingsReplacement {
  match: string;
  /** Empty when the entry has no if_value, as Wings reads it. */
  ifValue: string;
  replaceWith: ReplaceWith;
}

export type OutcomeStatus = 'changed' | 'added' | 'unchanged' | 'skipped' | 'none' | 'error';

export interface Outcome {
  status: OutcomeStatus;
  detail: string;
}

export interface ParseResult {
  /** False when Wings gives up and leaves the file as it was. */
  ok: boolean;
  output: string;
  error?: string;
  outcomes: Outcome[];
  notes: string[];
}

class WingsError extends Error {}

/* ------------------------------------------------------------------ *
 * Values
 * ------------------------------------------------------------------ */

/** ReplaceValue.String() and Bytes(). */
export function replaceValueText(rw: ReplaceWith): string {
  switch (rw.type) {
    case 'string':
      return rw.value;
    case 'number':
      return rw.raw;
    case 'boolean':
      return String(rw.value);
    case 'null':
      return '<nil>';
    default:
      return '<invalid>';
  }
}

const CONFIG_ONE = /\{\{[\t\n\f\r ]?config\.([A-Za-z0-9_.-]+)[\t\n\f\r ]?\}\}/;
const CONFIG_ALL = new RegExp(CONFIG_ONE.source, 'g');

/** strcase.ToSnake() for the simple keys Wings' configuration uses. */
function toSnake(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/[-\s.]+/g, '_')
    .toLowerCase();
}

export interface LookedUp {
  value: string;
  note?: { tone: 'green' | 'red' | 'blue'; text: string };
}

/** LookupConfigurationValue(): fills in {{config.*}} from Wings' own configuration. */
export function lookupConfigurationValue(rw: ReplaceWith, dockerInterface: string): LookedUp {
  if (rw.type !== 'string' || !CONFIG_ONE.test(rw.value)) return { value: replaceValueText(rw) };

  const hunt = CONFIG_ONE.exec(rw.value)![1];
  const config: Record<string, unknown> = { docker: { interface: dockerInterface, network: { interface: dockerInterface } } };
  let current: unknown = config;
  for (const segment of hunt.split('.').map(toSnake)) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return {
        value: '',
        note: { tone: 'red', text: `config.${hunt} is not in Wings' configuration, so Wings writes an empty value for the whole setting. Only config.docker.interface and config.docker.network.interface exist.` },
      };
    }
  }
  if (typeof current === 'object') {
    return { value: rw.value, note: { tone: 'red', text: `config.${hunt} is a section, not a value, so Wings leaves the placeholder as written.` } };
  }

  // Every config placeholder in the value gets the first one's value.
  const value = rw.value.replace(CONFIG_ALL, () => String(current));
  const others = [...rw.value.matchAll(CONFIG_ALL)].map((m) => m[1]).filter((h) => h !== hunt);
  return {
    value,
    note: {
      tone: others.length ? 'red' : 'green',
      text: others.length
        ? `Wings looks up only config.${hunt} and uses its value for every config placeholder in this setting.`
        : `Wings fills in config.${hunt} with ${String(current)}.`,
    },
  };
}

/* ------------------------------------------------------------------ *
 * properties
 * ------------------------------------------------------------------ */

const PROP_WS = ' \f\t';

/** properties.Load(): the magiconair lexer and parser. */
function loadProperties(input: string): { keys: string[]; values: Map<string, string>; comments: number } {
  const r = [...input];
  let pos = 0;
  const EOF = '';
  const next = () => (pos < r.length ? r[pos++] : (pos++, EOF));
  const peek = () => (pos < r.length ? r[pos] : EOF);
  const isEOL = (c: string) => c === '\n' || c === '\r';
  const line = () => r.slice(0, Math.min(pos, r.length)).filter((c) => c === '\n').length + 1;
  const fail = (message: string): never => {
    throw new WingsError(`properties: Line ${line()}: ${message}`);
  };

  const escape = (out: string[]) => {
    const c = next();
    if (' :=fnrt'.includes(c) && c !== EOF) {
      out.push({ f: '\f', n: '\n', r: '\r', t: '\t' }[c] ?? c);
    } else if (c === 'u') {
      const digits = [next(), next(), next(), next()];
      if (digits.some((d) => d === EOF || !/[0-9a-fA-F]/.test(d))) fail('invalid unicode literal');
      out.push(String.fromCodePoint(parseInt(digits.join(''), 16)));
    } else if (c === EOF) {
      fail('premature EOF');
    } else {
      out.push(c);
    }
  };

  const keys: string[] = [];
  const values = new Map<string, string>();
  let comments = 0;

  for (;;) {
    // lexBeforeKey
    const c = next();
    if (c === EOF) break;
    if (isEOL(c) || PROP_WS.includes(c)) continue;
    if (c === '#' || c === '!') {
      while (PROP_WS.includes(peek()) && peek() !== EOF) next();
      let ch = next();
      while (ch !== EOF && !isEOL(ch)) ch = next();
      comments++;
      continue;
    }
    pos--;

    // lexKey
    const key: string[] = [];
    let ended = false;
    for (;;) {
      const k = next();
      if (k === '\\') escape(key);
      else if (k !== EOF && ' \f\t\r\n:='.includes(k)) {
        pos--;
        break;
      } else if (k === EOF) {
        ended = true;
        break;
      } else key.push(k);
    }
    const name = key.join('');
    if (name === '' && !ended) fail('unexpected value: a line starts with = or :');
    if (name !== '' && !values.has(name)) keys.push(name);
    if (ended) {
      if (name !== '') values.set(name, '');
      break;
    }

    // lexBeforeValue
    while (PROP_WS.includes(peek()) && peek() !== EOF) next();
    if (peek() === ':' || peek() === '=') next();
    while (PROP_WS.includes(peek()) && peek() !== EOF) next();

    // lexValue
    const value: string[] = [];
    for (;;) {
      const v = next();
      if (v === '\\') {
        if (isEOL(peek())) {
          next();
          while (PROP_WS.includes(peek()) && peek() !== EOF) next();
        } else escape(value);
      } else if (isEOL(v) || v === EOF) {
        break;
      } else value.push(v);
    }
    values.set(name, value.join(''));
    if (pos > r.length) break;
  }

  return { keys, values, comments };
}

/** properties' ${key} expansion. Unknown keys come from Wings' own process environment. */
function expandProperty(s: string, chain: string[], values: Map<string, string>, envUsed: Set<string>): string {
  if (chain.length > 64) throw new WingsError('expansion too deep');
  let out = s;
  for (;;) {
    const start = out.indexOf('${');
    if (start === -1) return out;
    const keyLen = out.slice(start + 2).indexOf('}');
    if (keyLen === -1) throw new WingsError('malformed expression');
    const key = out.slice(start + 2, start + 2 + keyLen);
    if (chain.includes(key)) throw new WingsError(`circular reference in: ${chain.join(', ')}`);
    let val = values.get(key);
    if (val === undefined) {
      envUsed.add(key);
      val = '';
    }
    out = out.slice(0, start) + expandProperty(val, [...chain, key], values, envUsed) + out.slice(start + 3 + keyLen);
  }
}

/** strconv.QuoteToASCII() without the surrounding quotes, then strings.Trim(s, "\""). */
function quoteToAsciiTrimmed(value: string): string {
  let out = '"';
  for (const ch of value) {
    const cp = ch.codePointAt(0)!;
    if (ch === '"' || ch === '\\') out += '\\' + ch;
    else if (cp >= 0x20 && cp < 0x7f) out += ch;
    else if (ch === '\x07') out += '\\a';
    else if (ch === '\b') out += '\\b';
    else if (ch === '\f') out += '\\f';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\v') out += '\\v';
    else if (cp < 0x20 || cp === 0x7f) out += '\\x' + cp.toString(16).padStart(2, '0');
    else if (cp >= 0xd800 && cp <= 0xdfff) out += '\\ufffd';
    else if (cp < 0x10000) out += '\\u' + cp.toString(16).padStart(4, '0');
    else out += '\\U' + cp.toString(16).padStart(8, '0');
  }
  out += '"';
  return out.replace(/^"+|"+$/g, '');
}

function parsePropertiesFile(input: string, replacements: WingsReplacement[], dockerInterface: string): ParseResult {
  const outcomes: Outcome[] = replacements.map(() => ({ status: 'none', detail: '' }));
  const notes: string[] = [];

  // Comment lines at the top survive; Wings copies them before writing the settings.
  const lines = input.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  let header = '';
  let headerLines = 0;
  for (const raw of lines) {
    const text = raw.replace(/\r$/, '');
    if (text.length > 0 && text[0] !== '#') break;
    header += text + '\n';
    headerLines++;
  }

  let props: ReturnType<typeof loadProperties>;
  const envUsed = new Set<string>();
  try {
    props = loadProperties(input);
    for (const [key, value] of props.values) expandProperty(value, [key], props.values, envUsed);
  } catch (error) {
    return fail(input, `could not load properties file for configuration update: ${(error as Error).message}`, outcomes);
  }

  const { keys, values } = props;
  const get = (key: string) => (values.has(key) ? expandProperty(values.get(key)!, [key], values, envUsed) : undefined);

  for (const [i, replacement] of replacements.entries()) {
    const data = lookupConfigurationValue(replacement.replaceWith, dockerInterface).value;
    const before = get(replacement.match);

    if (replacement.ifValue !== '' && before !== replacement.ifValue) {
      outcomes[i] = {
        status: 'skipped',
        detail:
          before === undefined
            ? `if_value only replaces an existing value, and ${replacement.match} is not in the file.`
            : `The value is "${before}", not "${replacement.ifValue}".`,
      };
      continue;
    }
    if (replacement.match === '') {
      outcomes[i] = { status: 'none', detail: 'An empty key is ignored.' };
      continue;
    }

    const previous = values.get(replacement.match);
    values.set(replacement.match, data);
    try {
      expandProperty(data, [replacement.match], values, envUsed);
    } catch (error) {
      if (previous === undefined) values.delete(replacement.match);
      else values.set(replacement.match, previous);
      return fail(input, `failed to set replacement value: ${(error as Error).message}`, outcomes);
    }
    if (previous === undefined) keys.push(replacement.match);

    const after = get(replacement.match)!;
    outcomes[i] =
      before === undefined
        ? { status: 'added', detail: `Not in the file, so Wings adds ${replacement.match}=${after}.` }
        : before === after
          ? { status: 'unchanged', detail: `Already ${after}.` }
          : { status: 'changed', detail: `${before === '' ? '(empty)' : before} → ${after === '' ? '(empty)' : after}` };
  }

  let output = header;
  for (const key of keys) {
    const value = get(key);
    if (value === undefined) continue;
    output += `${key}=${quoteToAsciiTrimmed(value)}\n`;
  }

  const headerComments = lines.slice(0, headerLines).filter((l) => l.startsWith('#')).length;
  if (props.comments > headerComments) {
    notes.push('Wings keeps the comment lines at the top of the file and drops every comment after the first setting.');
  }
  if ([...values.values()].some((v) => /[^\x20-\x7e]/.test(v))) {
    notes.push('Wings writes characters outside plain ASCII as \\u escapes, such as § as \\u00a7.');
  }
  if (envUsed.size) {
    notes.push(`\${${[...envUsed].join('}, ${')}} is not a key in the file, so Wings fills it from its own process environment. It is shown empty here.`);
  }

  return { ok: true, output, outcomes, notes };
}

/* ------------------------------------------------------------------ *
 * ini
 * ------------------------------------------------------------------ */

interface IniKey {
  name: string;
  value: string;
  comment: string;
  autoIncrement: boolean;
}

interface IniSection {
  name: string;
  comment: string;
  keys: IniKey[];
}

const utf8Length = (value: string) => new TextEncoder().encode(value).length;
const goTrimSpace = (value: string) => value.replace(/^[\s\u0085]+|[\s\u0085]+$/gu, '');

/** ini.Load() with default options. */
function loadIni(input: string): IniSection[] {
  const text = input.replace(/^﻿/, '');
  const raw = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  let index = 0;
  const readLine = () => (index < raw.length ? raw[index++] : null);

  const sections: IniSection[] = [{ name: 'DEFAULT', comment: '', keys: [] }];
  const sectionNamed = (name: string) => {
    let section = sections.find((s) => s.name === name);
    if (!section) {
      section = { name, comment: '', keys: [] };
      sections.push(section);
    }
    return section;
  };
  let section = sections[0];
  let comment = '';
  let count = 1;

  const cleanComment = (rest: string) => {
    const i = rest.search(/[#;]/);
    return i === -1 ? null : rest.slice(i);
  };

  for (let line = readLine(); line !== null; line = readLine()) {
    const trimmed = line.replace(/^\s+/u, '');
    if (trimmed === '') continue;

    if (trimmed[0] === '#' || trimmed[0] === ';') {
      comment += trimmed;
      continue;
    }

    if (trimmed[0] === '[') {
      const close = trimmed.lastIndexOf(']');
      if (close === -1) throw new WingsError(`unclosed section: ${trimmed.trimEnd()}`);
      const name = trimmed.slice(1, close);
      if (name === '') throw new WingsError('empty section name');
      section = sectionNamed(name);
      const inline = cleanComment(trimmed.slice(close + 1));
      if (inline) comment += inline;
      section.comment = goTrimSpace(comment);
      comment = '';
      count = 1;
      continue;
    }

    // readKeyName()
    let keyName: string;
    let offset: number;
    const quote = trimmed.startsWith('"""') && trimmed.length > 6 ? '"""' : trimmed[0] === '"' ? '"' : trimmed[0] === '`' ? '`' : '';
    if (quote) {
      const pos = trimmed.indexOf(quote, quote.length);
      if (pos === -1) throw new WingsError(`missing closing key quote: ${trimmed.trimEnd()}`);
      const delimiter = trimmed.slice(pos + quote.length).search(/[=:]/);
      if (delimiter < 0) throw new WingsError(`key-value delimiter not found: ${trimmed.trimEnd()}`);
      keyName = goTrimSpace(trimmed.slice(quote.length, pos));
      offset = pos + delimiter + quote.length + 1;
    } else {
      const end = trimmed.search(/[=:]/);
      if (end < 0) throw new WingsError(`key-value delimiter not found: ${trimmed.trimEnd()}`);
      if (end === 0) throw new WingsError(`empty key name: ${trimmed.trimEnd()}`);
      keyName = goTrimSpace(trimmed.slice(0, end));
      offset = end + 1;
    }

    let autoIncrement = false;
    if (keyName === '-') {
      autoIncrement = true;
      keyName = `#${count++}`;
    }

    // readValue()
    let value: string;
    const rest = trimmed.slice(offset).replace(/^\s+/u, '');
    const valueQuote = rest.length > 3 && rest.startsWith('"""') ? '"""' : rest[0] === '`' ? '`' : '';
    if (rest === '') {
      value = '';
    } else if (valueQuote) {
      const pos = rest.slice(valueQuote.length).lastIndexOf(valueQuote);
      if (pos !== -1) {
        value = rest.slice(valueQuote.length, pos + valueQuote.length);
      } else {
        let multi = rest.slice(valueQuote.length);
        for (;;) {
          const next = readLine();
          if (next === null) throw new WingsError(`missing closing key quote from ${JSON.stringify(rest)}`);
          const close = next.lastIndexOf(valueQuote);
          if (close > -1) {
            multi += next.slice(0, close);
            const inline = cleanComment(next.slice(close));
            if (inline) comment += goTrimSpace(inline);
            break;
          }
          multi += next;
          if (index >= raw.length) throw new WingsError(`missing closing key quote from ${JSON.stringify(rest)}`);
        }
        value = multi;
      }
    } else {
      let v = goTrimSpace(rest);
      if (v.endsWith('\\')) {
        v = v.slice(0, -1);
        for (;;) {
          const next = readLine();
          if (next === null) break;
          const part = goTrimSpace(next);
          if (part === '') break;
          v += part;
          if (!v.endsWith('\\')) break;
          v = v.slice(0, -1);
        }
        value = v;
      } else {
        const i = v.search(/[#;]/);
        if (i > -1) {
          comment += v.slice(i);
          v = goTrimSpace(v.slice(0, i));
        }
        const surrounded = (q: string) => v.length >= 2 && v[0] === q && v[v.length - 1] === q && v.indexOf(q, 1) === v.length - 1;
        if (surrounded("'") || surrounded('"')) v = v.slice(1, -1);
        value = v;
      }
    }

    let key = section.keys.find((k) => k.name === keyName);
    if (key) key.value = value;
    else {
      key = { name: keyName, value, comment: '', autoIncrement };
      section.keys.push(key);
    }
    key.comment = goTrimSpace(comment);
    comment = '';
  }

  return sections;
}

/** File.WriteTo() with the package defaults (PrettyFormat, PrettySection). */
function writeIni(sections: IniSection[]): string {
  let out = '';
  const formatComment = (comment: string, trimPlain: boolean) =>
    comment
      .split('\n')
      .map((line) => {
        if (line[0] !== '#' && line[0] !== ';') return '; ' + (trimPlain ? goTrimSpace(line) : line);
        return line[0] + ' ' + goTrimSpace(line.slice(1));
      })
      .join('\n') + '\n';

  sections.forEach((section, i) => {
    if (section.comment) out += formatComment(section.comment, false);
    if (i > 0 || section.name.toUpperCase() !== 'DEFAULT') out += `[${section.name}]\n`;
    else if (section.keys.length === 0) return;

    let align = 0;
    for (const key of section.keys) {
      let length = utf8Length(key.name);
      if (key.name.includes('"') || /[=:]/.test(key.name)) length += 2;
      else if (key.name.includes('`')) length += 6;
      align = Math.max(align, length);
    }

    for (const key of section.keys) {
      if (key.comment) out += formatComment(key.comment, true);
      let name = key.name;
      if (key.autoIncrement) name = '-';
      else if (name.includes('"') || /[=:]/.test(name)) name = '`' + name + '`';
      else if (name.includes('`')) name = '"""' + name + '"""';

      let value = key.value;
      if (/[\n`]/.test(value)) value = '"""' + value + '"""';
      else if (/[#;]/.test(value)) value = '`' + value + '`';
      else if (goTrimSpace(value).length !== value.length) value = '"' + value + '"';

      out += name + ' '.repeat(Math.max(0, align - utf8Length(name))) + ' = ' + value + '\n';
    }

    if (i !== sections.length - 1) out += '\n';
  });

  return out;
}

function parseIniFile(input: string, replacements: WingsReplacement[], dockerInterface: string): ParseResult {
  const outcomes: Outcome[] = replacements.map(() => ({ status: 'none', detail: '' }));
  const notes: string[] = [];
  let sections: IniSection[];
  try {
    sections = loadIni(input);
  } catch (error) {
    return fail(input, (error as Error).message, outcomes);
  }

  for (const [i, replacement] of replacements.entries()) {
    // Split "Section.Key" at the first dot outside brackets; brackets themselves are dropped.
    const path: string[] = [];
    let depth = 0;
    let current = '';
    for (const c of replacement.match) {
      if (c === '[') depth++;
      else if (c === ']') depth--;
      else if (c === '.' && !(depth > 0 || path.length === 1)) {
        path.push(current);
        current = '';
      } else current += c;
    }
    path.push(current);

    const value = lookupConfigurationValue(replacement.replaceWith, dockerInterface).value;
    let sectionName = 'DEFAULT';
    let keyName = path[0];
    if (path.length === 2) {
      keyName = path[1];
      sectionName = path[0] === '' ? 'DEFAULT' : path[0];
    }

    let section = sections.find((s) => s.name === sectionName);
    const createdSection = !section;
    if (!section) {
      section = { name: sectionName, comment: '', keys: [] };
      sections.push(section);
    }

    // Section.GetKey() falls back to parent sections split at ".".
    let key = section.keys.find((k) => k.name === keyName);
    let owner = section.name;
    if (!key) {
      let name = section.name;
      while (!key && name.lastIndexOf('.') > -1) {
        name = name.slice(0, name.lastIndexOf('.'));
        const parent = sections.find((s) => s.name === name);
        key = parent?.keys.find((k) => k.name === keyName);
        if (key) owner = name;
      }
    }

    const where = sectionName === 'DEFAULT' ? 'before any section' : `in [${sectionName}]`;
    const ignored = replacement.ifValue !== '' ? ' The ini parser ignores if_value.' : '';
    if (key) {
      const before = key.value;
      key.value = value;
      outcomes[i] =
        before === value
          ? { status: 'unchanged', detail: `Already ${value}.${ignored}` }
          : {
              status: 'changed',
              detail: `${before === '' ? '(empty)' : before} → ${value === '' ? '(empty)' : value}${owner !== sectionName ? ` (the key in [${owner}])` : ''}.${ignored}`,
            };
    } else {
      if (keyName === '') return fail(input, 'error creating new key: empty key name', outcomes);
      section.keys.push({ name: keyName, value, comment: '', autoIncrement: false });
      outcomes[i] = {
        status: 'added',
        detail: `${createdSection ? `No [${sectionName}] section, so Wings creates it and adds ${keyName}.` : `Not in the file, so Wings adds ${keyName} ${where}.`}${ignored}`,
      };
    }
  }

  if (/^\s*[#;]/m.test(input) || /=.*[#;]/.test(input)) {
    notes.push('Wings rewrites the whole file: comments move above the setting they belong to, and an inline comment after a value moves to the line above.');
  } else {
    notes.push('Wings rewrites the whole file, lining up the = signs in each section.');
  }

  return { ok: true, output: writeIni(sections), outcomes, notes };
}

/* ------------------------------------------------------------------ *
 * json
 * ------------------------------------------------------------------ */

/** An integer from strconv.Atoi(), kept exact for encoding. */
class GoInt {
  readonly value: bigint;
  constructor(value: bigint) {
    this.value = value;
  }
}

type Json = null | boolean | number | string | GoInt | Json[] | { [key: string]: Json };

const isObject = (v: Json | undefined): v is { [key: string]: Json } => typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof GoInt);

/** encoding/json string escaping, including its HTML-safe escapes. */
function goJsonString(value: string): string {
  let out = '"';
  for (const ch of value) {
    const cp = ch.codePointAt(0)!;
    if (ch === '"') out += '\\"';
    else if (ch === '\\') out += '\\\\';
    else if (ch === '\n') out += '\\n';
    else if (ch === '\r') out += '\\r';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\b') out += '\\b';
    else if (ch === '\f') out += '\\f';
    else if (cp < 0x20 || ch === '<' || ch === '>' || ch === '&' || cp === 0x2028 || cp === 0x2029) out += '\\u' + cp.toString(16).padStart(4, '0');
    else if (cp >= 0xd800 && cp <= 0xdfff) out += '\ufffd';
    else out += ch;
  }
  return out + '"';
}

/** encoding/json's Marshal (indent '') or MarshalIndent with sorted keys. */
function goJson(value: Json, indent: string, depth = 0): string {
  const pad = (d: number) => (indent ? '\n' + indent.repeat(d) : '');
  const sep = indent ? ': ' : ':';
  if (value === null) return 'null';
  if (value instanceof GoInt) return value.value.toString();
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'string') return goJsonString(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[' + value.map((item) => pad(depth + 1) + goJson(item, indent, depth + 1)).join(',') + pad(depth) + ']';
  }
  const keys = Object.keys(value).sort((a, b) => {
    const ea = new TextEncoder().encode(a);
    const eb = new TextEncoder().encode(b);
    for (let i = 0; i < Math.min(ea.length, eb.length); i++) if (ea[i] !== eb[i]) return ea[i] - eb[i];
    return ea.length - eb.length;
  });
  if (keys.length === 0) return '{}';
  return '{' + keys.map((key) => pad(depth + 1) + goJsonString(key) + sep + goJson(value[key], indent, depth + 1)).join(',') + pad(depth) + '}';
}

/** A gabs.Container: a box around a JSON value. Objects and arrays are shared by reference. */
class Container {
  object: Json | undefined;
  constructor(object: Json | undefined) {
    this.object = object;
  }
}

const ERR_PATH_COLLISION = 'encountered value collision whilst building path';
class GabsError extends Error {}
class NotFound extends Error {}

/** gabs.DotPathToSlice(): split at dots, with ~1 for a literal dot and ~0 for a tilde. */
function dotPath(path: string): string[] {
  return path.split('.').map((segment) => segment.replace(/~1/g, '.').replace(/~0/g, '~'));
}

function atoi(value: string): bigint | null {
  if (!/^[+-]?\d+$/.test(value)) return null;
  const n = BigInt(value);
  return n >= -(2n ** 63n) && n <= 2n ** 63n - 1n ? n : null;
}

/** gabs searchStrict() with wildcards allowed. Undefined when nothing is there. */
function search(container: Container, hierarchy: string[]): Container | undefined {
  let object = container.object;
  for (let target = 0; target < hierarchy.length; target++) {
    const segment = hierarchy[target];
    if (isObject(object)) {
      if (!(segment in object)) return undefined;
      object = object[segment];
    } else if (Array.isArray(object)) {
      if (segment === '*') {
        const found =
          target + 1 >= hierarchy.length
            ? object
            : object.flatMap((item) => {
                const result = search(new Container(item), hierarchy.slice(target + 1));
                return result ? [result.object as Json] : [];
              });
        return found.length === 0 ? undefined : new Container(found);
      }
      const index = atoi(segment);
      if (index === null || index < 0n || index >= BigInt(object.length)) return undefined;
      object = object[Number(index)];
    } else {
      return undefined;
    }
  }
  return new Container(object);
}

/** gabs Container.Set(). */
function gabsSet(container: Container, value: Json, hierarchy: string[]) {
  if (hierarchy.length === 0) {
    container.object = value;
    return;
  }
  if (container.object === null || container.object === undefined) container.object = {};
  let object: Json = container.object;
  for (let target = 0; target < hierarchy.length; target++) {
    const segment = hierarchy[target];
    if (isObject(object)) {
      if (target === hierarchy.length - 1) {
        object[segment] = value;
        object = value;
      } else {
        const child: Json | undefined = object[segment];
        if (child === undefined || child === null) {
          object[segment] = {};
          object = object[segment];
        } else {
          object = child;
        }
      }
    } else if (Array.isArray(object)) {
      if (segment === '-') {
        if (target < 1) throw new GabsError('unable to append new array index at root of path');
        const item: Json = target === hierarchy.length - 1 ? value : {};
        object.push(item);
        object = item;
        continue;
      }
      const index = atoi(segment);
      if (index === null) throw new GabsError(`failed to resolve path segment '${target}': found array but segment value '${segment}' could not be parsed into array index`);
      if (index < 0n) throw new GabsError(`failed to resolve path segment '${target}': found array but index '${segment}' is invalid`);
      if (index >= BigInt(object.length)) {
        throw new GabsError(`failed to resolve path segment '${target}': found array but index '${segment}' exceeded target array size of '${object.length}'`);
      }
      if (target === hierarchy.length - 1) {
        object[Number(index)] = value;
        object = value;
      } else {
        const child: Json = object[Number(index)];
        if (child === null) throw new GabsError(`failed to resolve path segment '${target}': field '${segment}' was not found`);
        object = child;
      }
    } else {
      throw new GabsError(ERR_PATH_COLLISION);
    }
  }
}

/** setValueAtPath() in wings/parser/helpers.go. */
function setValueAtPath(container: Container, path: string, value: Json) {
  const match = /^([^[\]]+)\[(\d+)](\..+)?$/.exec(path);
  if (!match) {
    gabsSet(container, value, dotPath(path));
    return;
  }

  const i = Number(atoi(match[2]) ?? 0n);
  const array = search(container, dotPath(match[1]))?.object;
  let element: Container;
  if (!Array.isArray(array) || i >= array.length) {
    const reason = !Array.isArray(array) ? 'not an array' : 'out of bounds';
    if (i !== 0 || reason === 'out of bounds') throw new GabsError(`error while parsing array element at path: ${reason}`);
    // Go's FindStringSubmatch always returns four entries, so Wings always seeds an object.
    gabsSet(container, [{}], dotPath(match[1]));
    element = new Container((search(container, dotPath(match[1]))!.object as Json[])[0]);
  } else {
    element = new Container(array[i]);
  }

  try {
    gabsSet(element, value, dotPath((match[3] ?? '').replace(/^\./, '')));
  } catch (error) {
    throw new GabsError(`failed to set value at config path: ${path}: ${(error as Error).message}`);
  }
}

/** getKeyValue(): booleans stay booleans, anything strconv.Atoi() reads becomes an integer. */
function keyValue(replacement: WingsReplacement, value: string): Json {
  if (replacement.replaceWith.type === 'boolean') return value === 'true';
  const n = atoi(value);
  return n === null ? value : new GoInt(n);
}

/** Go's Regexp.Expand() for $1, ${1} and ${name}. */
function goExpand(template: string, match: RegExpExecArray): string {
  return template.replace(/\$(\$|\{([A-Za-z0-9_]+)\}|([A-Za-z0-9_]+))/g, (_, all: string, braced?: string, bare?: string) => {
    if (all === '$') return '$';
    const name = braced ?? bare ?? '';
    if (/^\d+$/.test(name)) return match[Number(name)] ?? '';
    return match.groups?.[name] ?? '';
  });
}

/** SetAtPathway(): applies if_value before setting. Throws NotFound to skip quietly. */
function setAtPathway(container: Container, path: string, value: string, replacement: WingsReplacement, root: Container): string {
  if (replacement.ifValue === '') {
    setValueAtPath(container, path, keyValue(replacement, value));
    return 'set';
  }

  if (replacement.ifValue.startsWith('regex:')) {
    if (search(container, dotPath(path))) throw new NotFound('regex if_value: the key exists, and Wings only runs the regex when it does not');
    let re: RegExp;
    try {
      re = new RegExp(replacement.ifValue.slice('regex:'.length).replace(/\(\?P</g, '(?<'), 'g');
    } catch {
      throw new NotFound('regex if_value: the pattern does not compile');
    }
    // The key is missing, so the text Wings tests is "null".
    const current = 'null';
    if (!new RegExp(re.source).test(current)) throw new NotFound('regex if_value: the key is missing, so Wings tests the text "null", which does not match');
    let result = '';
    let last = 0;
    for (const m of current.matchAll(re)) {
      result += current.slice(last, m.index) + goExpand(value, m);
      last = m.index + m[0].length;
    }
    setValueAtPath(container, path, result + current.slice(last));
    return 'set';
  }

  if (search(container, dotPath(path)) && goJson(container.object ?? null, '') !== replacement.ifValue) {
    throw new NotFound(
      container === root
        ? `if_value: the key exists, and Wings compares if_value with the whole document instead of the key's value, so it never matches`
        : `if_value: the key exists, and Wings compares if_value with the whole parent item, so it never matches`,
    );
  }
  setValueAtPath(container, path, keyValue(replacement, value));
  return 'set';
}

function parseJsonFile(input: string, replacements: WingsReplacement[], dockerInterface: string): ParseResult {
  const outcomes: Outcome[] = replacements.map(() => ({ status: 'none', detail: '' }));
  let data: Json;
  try {
    if (input.trim() === '') throw new SyntaxError('unexpected end of JSON input');
    data = JSON.parse(input) as Json;
  } catch (error) {
    return fail(input, input.trim() === '' ? 'unexpected end of JSON input' : `invalid JSON: ${(error as Error).message}`, outcomes);
  }

  const root = new Container(data);
  const snapshot = (path: string, c: Container = root) => {
    const found = search(c, dotPath(path.replace(/\[(\d+)]/g, '.$1')));
    return found ? goJson(found.object ?? null, '') : undefined;
  };

  for (const [i, replacement] of replacements.entries()) {
    const value = lookupConfigurationValue(replacement.replaceWith, dockerInterface).value;
    try {
      if (replacement.match.includes('.*')) {
        const cut = replacement.match.indexOf('.*');
        const parent = replacement.match.slice(0, cut).replace(/^\.+|\.+$/g, '');
        const rest = replacement.match.slice(cut + 2).replace(/^\.+|\.+$/g, '');
        const found = search(root, dotPath(parent))?.object;
        const children = Array.isArray(found) ? found : isObject(found) ? Object.values(found) : [];
        let set = 0;
        let skipped = '';
        for (const child of children) {
          try {
            setAtPathway(new Container(child), rest, value, replacement, root);
            if (child !== null && typeof child === 'object') set++;
          } catch (error) {
            if (error instanceof NotFound) skipped = error.message;
            else throw new GabsError(`failed to set config value of array child: ${(error as Error).message}`);
          }
        }
        outcomes[i] =
          children.length === 0
            ? { status: 'none', detail: `Nothing under ${parent} to go through, so nothing changes.` }
            : set === 0
              ? { status: 'skipped', detail: skipped ? `Skipped, ${skipped}.` : `None of the ${children.length} items under ${parent} is an object.` }
              : { status: 'changed', detail: `Set ${rest} on ${set} item${set === 1 ? '' : 's'} under ${parent}.` };
        continue;
      }

      const before = snapshot(replacement.match);
      setAtPathway(root, replacement.match, value, replacement, root);
      const after = snapshot(replacement.match);
      outcomes[i] =
        before === undefined
          ? { status: 'added', detail: `Not in the file, so Wings creates ${replacement.match} = ${after ?? goJson(keyValue(replacement, value), '')}.` }
          : before === after
            ? { status: 'unchanged', detail: `Already ${after}.` }
            : { status: 'changed', detail: `${before} → ${after}` };
    } catch (error) {
      if (error instanceof NotFound) {
        outcomes[i] = { status: 'skipped', detail: `Skipped, ${error.message}.` };
        continue;
      }
      const message = (error as Error).message;
      outcomes[i] = { status: 'error', detail: message };
      return fail(input, message.startsWith('failed to set config value of array child') ? message : `unable to set config value at pathway: ${replacement.match}: ${message}`, outcomes);
    }
  }

  const output = root.object === undefined || root.object === null ? 'null' : goJson(root.object, '    ');
  return {
    ok: true,
    output,
    outcomes,
    notes: ['Wings rewrites the whole file: keys sorted, four-space indents, and no newline at the end.'],
  };
}

/* ------------------------------------------------------------------ *
 * file
 * ------------------------------------------------------------------ */

function parseTextFile(input: string, replacements: WingsReplacement[]): ParseResult {
  const lines = input.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const hits = replacements.map(() => 0);
  const multiple: number[] = [];
  let output = '';

  lines.forEach((raw, lineIndex) => {
    const line = raw.replace(/\r$/, '');
    let replaced = 0;
    replacements.forEach((replacement, i) => {
      if (!line.startsWith(replacement.match)) return;
      output += replaceValueText(replacement.replaceWith);
      hits[i]++;
      replaced++;
    });
    if (replaced > 1) multiple.push(lineIndex + 1);
    if (!replaced) output += line;
    output += '\n';
  });

  const outcomes: Outcome[] = replacements.map((replacement, i) => {
    const note = replacement.ifValue !== '' ? ' The file parser ignores if_value.' : '';
    if (hits[i] === 0) return { status: 'none', detail: `No line starts with "${replacement.match}", so nothing is written. The file parser never adds lines.${note}` };
    return { status: 'changed', detail: `Replaced ${hits[i] === 1 ? '1 line that starts' : `${hits[i]} lines that start`} with "${replacement.match}".${note}` };
  });

  const notes = [];
  if (multiple.length) {
    notes.push(
      `Line ${multiple.join(', ')} starts with more than one key, so Wings writes every matching value on the same line. Make each key specific, such as "world=" instead of "world".`,
    );
  }
  if (replacements.some((r) => r.replaceWith.type === 'string' && CONFIG_ONE.test(r.replaceWith.value))) {
    notes.push('The file parser does not fill in {{config.*}} placeholders. Wings writes them as text.');
  }

  return { ok: true, output, outcomes, notes };
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function fail(input: string, error: string, outcomes: Outcome[]): ParseResult {
  return { ok: false, output: input, error, outcomes, notes: [] };
}

export type PreviewParser = 'properties' | 'ini' | 'json' | 'file';

/**
 * Runs Wings' parser over `input`. `exists` is false when the server has no such
 * file yet: Wings skips it for the file parser and otherwise creates it empty.
 */
export function runWingsParser(parser: PreviewParser, input: string, exists: boolean, replacements: WingsReplacement[], dockerInterface: string): ParseResult {
  if (!exists && parser === 'file') {
    return {
      ok: true,
      output: '',
      outcomes: replacements.map(() => ({ status: 'none', detail: 'Skipped: the file does not exist yet.' })),
      notes: ['The file parser skips files that do not exist yet. It never creates one.'],
    };
  }
  const source = exists ? input : '';
  try {
    switch (parser) {
      case 'properties':
        return parsePropertiesFile(source, replacements, dockerInterface);
      case 'ini':
        return parseIniFile(source, replacements, dockerInterface);
      case 'json':
        return parseJsonFile(source, replacements, dockerInterface);
      case 'file':
        return parseTextFile(source, replacements);
    }
  } catch (error) {
    return fail(source, (error as Error).message, replacements.map(() => ({ status: 'none', detail: '' })));
  }
}
