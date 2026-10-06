// Validates a variable value the way the Panel does when a user saves it on the
// Startup page:
//
//   - The request middleware trims the value and turns an empty string into null
//     (bootstrap/app.php: trimStrings, plus Laravel's ConvertEmptyStringsToNull).
//   - UpdateStartupVariableRequest::rules() validates it with ['present', ...rules],
//     splitting the rules at every "|" unless the whole string starts with "regex:".
//   - Laravel 13's Validator runs each rule (Validator::validateAttribute(),
//     isValidatable(), shouldStopValidating(), Concerns\ValidatesAttributes).
//
// Rules that are not emulated here come back as `panel`, so the page can say the
// Panel checks them instead of guessing.

import { URL_IPV6, URL_PROTOCOLS } from './laravel-url';

export type RuleState = 'pass' | 'fail' | 'skipped' | 'panel' | 'unknown' | 'error';

export interface RuleResult {
  /** The rule as written, such as `max:20`. */
  raw: string;
  state: RuleState;
  /** The Panel's error message for a failure, or why the rule was skipped or not checked. */
  detail?: string;
}

export interface ValidationResult {
  /** The value the Panel validates and saves: trimmed, with an empty string as null. */
  value: string | null;
  /** True when the trimmed value differs from what was typed. */
  trimmed: boolean;
  rules: RuleResult[];
  /** False when any rule fails, errors, or is unknown. */
  passes: boolean;
  /** True when the outcome depends on a rule this page does not check. */
  uncertain: boolean;
  /** Set when a `regex:` rule containing `|` is split into pieces. */
  splitRegex: boolean;
}

/** Every rule name Laravel 13.34 resolves to a validate* method, in snake case. */
const KNOWN = new Set(
  (
    'accepted,accepted_if,active_url,after,after_or_equal,alpha,alpha_dash,alpha_num,array,array_keys,ascii,attribute,bail,base64,' +
    'before,before_or_equal,between,boolean,confirmed,contains,current_password,date,date_equals,date_format,decimal,declined,' +
    'declined_if,different,digits,digits_between,dimensions,distinct,doesnt_contain,doesnt_end_with,doesnt_start_with,email,' +
    'encoding,ends_with,exclude,exclude_if,exclude_unless,exclude_with,exclude_without,exists,extensions,file,filled,gt,gte,' +
    'hex_color,image,in,in_array,in_array_keys,integer,ip,ipv4,ipv6,json,list,lowercase,lt,lte,mac_address,max,max_digits,' +
    'mimes,mimetypes,min,min_digits,missing,missing_if,missing_unless,missing_with,missing_with_all,multiple_of,not_in,not_regex,' +
    'nullable,numeric,present,present_if,present_unless,present_with,present_with_all,prohibited,prohibited_if,' +
    'prohibited_if_accepted,prohibited_if_declined,prohibited_unless,prohibits,regex,required,required_array_keys,required_if,' +
    'required_if_accepted,required_if_declined,required_unless,required_with,required_with_all,required_without,' +
    'required_without_all,same,size,sometimes,starts_with,string,timezone,ulid,unique,uppercase,url,using_custom_rule,uuid,with_bag'
  )
    .split(',')
    .map((name) => studly(name).toLowerCase()),
);

const IMPLICIT = new Set([
  'Accepted', 'AcceptedIf', 'Declined', 'DeclinedIf', 'Filled', 'Missing', 'MissingIf', 'MissingUnless', 'MissingWith',
  'MissingWithAll', 'Present', 'PresentIf', 'PresentUnless', 'PresentWith', 'PresentWithAll', 'Required', 'RequiredIf',
  'RequiredIfAccepted', 'RequiredIfDeclined', 'RequiredUnless', 'RequiredWith', 'RequiredWithAll', 'RequiredWithout',
  'RequiredWithoutAll',
]);

const NUMERIC_RULES = ['Numeric', 'Integer', 'Decimal'];

/** Laravel's Str::studly(): `alpha_dash` becomes `AlphaDash`. */
export function studly(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .split(/\s+/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/** PHP's trim() with its default character list. */
function phpTrim(value: string): string {
  return value.replace(/^[ \t\n\r\v\0]+|[ \t\n\r\v\0]+$/g, '');
}

/** PHP's str_getcsv() for a rule's parameters. An empty string gives [null]. */
function strGetCsv(input: string): Array<string | null> {
  if (input === '') return [null];
  const out: string[] = [];
  let field = '';
  let quoted = false;
  let atStart = true;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '\\' && i + 1 < input.length) {
        field += c + input[++i];
      } else if (c === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === ',') {
      out.push(field);
      field = '';
      atStart = true;
      continue;
    } else if (c === '"' && atStart) {
      quoted = true;
    } else {
      field += c;
    }
    atStart = false;
  }
  out.push(field);
  return out;
}

interface ParsedRule {
  raw: string;
  /** Studly name after Laravel's normalization, such as `Integer` for `int`. */
  name: string;
  params: Array<string | null>;
  known: boolean;
}

function parseRule(raw: string): ParsedRule {
  let name = raw;
  let params: Array<string | null> = [];
  const colon = raw.indexOf(':');
  if (colon !== -1) {
    name = raw.slice(0, colon);
    const parameter = raw.slice(colon + 1);
    params = ['regex', 'not_regex', 'notregex'].includes(name.toLowerCase()) ? [parameter] : strGetCsv(parameter);
  }

  let studlyName = studly(phpTrim(name));
  if (studlyName === 'Int') studlyName = 'Integer';
  if (studlyName === 'Bool') studlyName = 'Boolean';

  return { raw, name: studlyName, params, known: KNOWN.has(studlyName.toLowerCase()) };
}

/** Thrown for input that makes the Panel error instead of returning a validation message. */
class RuleError extends Error {}

/** Thrown when a rule can't be checked faithfully in the browser. */
class NotEmulated extends Error {}

/* ------------------------------------------------------------------ *
 * PHP helpers
 * ------------------------------------------------------------------ */

/** PHP 8's is_numeric() for strings. */
function isNumeric(value: string | null): boolean {
  return value !== null && /^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?[ \t\n\r\v\f]*$/.test(value);
}

/** filter_var($value, FILTER_VALIDATE_INT) !== false. */
function isFilterInt(value: string | null): boolean {
  if (value === null) return false;
  const match = /^[ \t\n\r\v]*([+-]?)(0|[1-9]\d*)[ \t\n\r\v]*$/.exec(value);
  if (!match) return false;
  const n = BigInt(match[1] + match[2]);
  return n >= -(2n ** 63n) && n <= 2n ** 63n - 1n;
}

/** Brick\Math's BigNumber::of() for the plain decimal forms rules use. Null when it would throw. */
function bigNumber(value: string | number): number | null {
  if (typeof value === 'number') return value;
  const trimmed = phpTrim(value);
  if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) return null;
  return Number(trimmed);
}

function mbStrlen(value: string | null): number {
  return [...(value ?? '')].length;
}

/** Converts a PHP (PCRE) pattern such as `/^[\w.-]+$/i` to a JavaScript RegExp. */
function phpRegex(pattern: string, subject: string): RegExp {
  const p = pattern.replace(/^[ \t\n\r\v\f]+/, '');
  if (p === '') throw new RuleError('preg_match(): Empty regular expression');

  const delimiter = p[0];
  if (/[A-Za-z0-9\\\0]/.test(delimiter)) throw new RuleError('preg_match(): Delimiter must not be alphanumeric, backslash, or NUL');

  const closers: Record<string, string> = { '(': ')', '[': ']', '{': '}', '<': '>' };
  const closer = closers[delimiter] ?? delimiter;
  let end = -1;
  let depth = 1;
  for (let i = 1; i < p.length; i++) {
    if (p[i] === '\\' && i + 1 < p.length) {
      i++;
    } else if (p[i] === closer && --depth === 0) {
      end = i;
      break;
    } else if (closer !== delimiter && p[i] === delimiter) {
      depth++;
    }
  }
  if (end === -1) throw new RuleError(`preg_match(): No ending delimiter '${closer}' found`);

  const body = p.slice(1, end);
  let flags = '';
  let dollarEndOnly = false;
  for (const modifier of p.slice(end + 1)) {
    if (modifier === ' ' || modifier === '\n' || modifier === '\r' || modifier === 'S') continue;
    if ('ims'.includes(modifier)) flags += flags.includes(modifier) ? '' : modifier;
    else if (modifier === 'u') flags += flags.includes('u') ? '' : 'u';
    else if (modifier === 'D') dollarEndOnly = true;
    else if ('xAUXJn'.includes(modifier)) throw new NotEmulated(`the /${modifier} modifier`);
    else throw new RuleError(`preg_match(): Unknown modifier '${modifier}'`);
  }

  const syntax = '^$\\.*+?()[]{}|/';
  const literal = (ch: string, inClass: boolean) =>
    inClass ? (']\\^-'.includes(ch) ? '\\' + ch : ch) : syntax.includes(ch) ? '\\' + ch : ch;

  let out = '';
  let inClass = false;
  let classStart = false;
  let afterQuantifier = false;
  let usesClassEscapes = false;
  let usesProperties = false;
  const multiline = flags.includes('m');

  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    const wasQuantifier: boolean = afterQuantifier;
    afterQuantifier = false;

    if (c === '\\') {
      const n = body[i + 1];
      if (n === undefined) throw new RuleError('preg_match(): \\ at end of pattern');
      i++;
      classStart = false;
      if (!/[A-Za-z0-9]/.test(n)) {
        out += literal(n, inClass);
        continue;
      }
      if (inClass && n === 'b') out += '\\x08';
      else if (!inClass && n === 'A') out += '(?<![\\s\\S])';
      else if (!inClass && n === 'z') out += '(?![\\s\\S])';
      else if (!inClass && n === 'Z') out += '(?=\\n?(?![\\s\\S]))';
      else if ('dDwWsS'.includes(n) || (!inClass && 'bB'.includes(n))) {
        usesClassEscapes = true;
        out += '\\' + n;
      } else if ('nrtf'.includes(n) || /[0-9]/.test(n)) out += '\\' + n;
      else if (n === 'e') out += '\\x1b';
      else if (n === 'a') out += '\\x07';
      else if (n === 'x') {
        if (body[i + 1] === '{') {
          const close = body.indexOf('}', i);
          if (close === -1) throw new NotEmulated('\\x{...}');
          out += `\\u{${body.slice(i + 2, close)}}`;
          flags += flags.includes('u') ? '' : 'u';
          i = close;
        } else {
          const hex = /^[0-9a-fA-F]{0,2}/.exec(body.slice(i + 1))![0];
          out += '\\x' + hex.padStart(2, '0');
          i += hex.length;
        }
      } else if (n === 'p' || n === 'P') {
        usesProperties = true;
        if (body[i + 1] === '{') {
          const close = body.indexOf('}', i);
          if (close === -1) throw new RuleError('preg_match(): malformed \\p sequence');
          out += '\\' + n + body.slice(i + 1, close + 1);
          i = close;
        } else if (body[i + 1] !== undefined) {
          out += `\\${n}{${body[i + 1]}}`;
          i++;
        } else {
          throw new RuleError('preg_match(): malformed \\p sequence');
        }
      } else {
        throw new NotEmulated(`\\${n}`);
      }
      continue;
    }

    if (inClass) {
      if (c === ']' && !classStart) {
        inClass = false;
        out += c;
      } else if (c === ']' && classStart) {
        out += '\\]';
      } else if (c === '[' && body[i + 1] === ':') {
        throw new NotEmulated('POSIX classes such as [:alpha:]');
      } else if (c === '^' && classStart && body[i - 1] === '[') {
        out += c;
        continue;
      } else {
        out += c === '[' ? '\\[' : c;
      }
      classStart = false;
      continue;
    }

    if (c === '[') {
      inClass = true;
      classStart = true;
      out += c;
      continue;
    }
    if (c === '(' && body[i + 1] === '?') {
      const rest = body.slice(i + 2);
      if (rest.startsWith('P<')) {
        out += '(?<';
        i += 3;
        continue;
      }
      if (rest.startsWith('P=')) {
        const close = body.indexOf(')', i);
        out += `\\k<${body.slice(i + 4, close)}>`;
        i = close;
        continue;
      }
      if (!(rest.startsWith(':') || rest.startsWith('=') || rest.startsWith('!') || rest.startsWith('<=') || rest.startsWith('<!') || /^<[A-Za-z_]/.test(rest))) {
        throw new NotEmulated(`the group (?${rest.slice(0, 2)}`);
      }
      out += c;
      continue;
    }
    if (c === '$' && !multiline && !dollarEndOnly) {
      out += '(?=\\n?(?![\\s\\S]))';
      continue;
    }
    if (c === '*' || c === '+' || c === '?') {
      if (wasQuantifier && c === '+') throw new NotEmulated('possessive quantifiers');
      out += c;
      afterQuantifier = c !== '?' || !wasQuantifier;
      continue;
    }
    if (c === '{') {
      const quantifier = /^\{\d+(,\d*)?\}/.exec(body.slice(i));
      if (quantifier) {
        out += quantifier[0];
        i += quantifier[0].length - 1;
        afterQuantifier = true;
        continue;
      }
      out += '\\{';
      continue;
    }
    if (c === '}') {
      out += '\\}';
      continue;
    }
    out += c;
  }
  if (inClass) throw new RuleError('preg_match(): missing terminating ] for character class');

  // Without /u, PHP matches bytes, not characters.
  const ascii = /^[\x00-\x7f]*$/.test(subject);
  if (!ascii && !flags.includes('u')) throw new NotEmulated('byte matching on non-ASCII text');

  // With /u PHP also turns on Unicode properties for \w, \d, \s and \b.
  if (flags.includes('u') && usesClassEscapes && !ascii) throw new NotEmulated('Unicode-aware \\w, \\d, \\s, or \\b');
  if (usesProperties && !flags.includes('u')) flags += 'u';

  try {
    return new RegExp(out, flags);
  } catch {
    throw new NotEmulated('PCRE syntax that JavaScript reads differently');
  }
}

let urlPattern: RegExp | null = null;
const URL_REST = String.raw`(((?:[_.\p{L}\p{N}-]|%[0-9A-Fa-f]{2})+:)?((?:[_.\p{L}\p{N}-]|%[0-9A-Fa-f]{2})+)@)?((?:(?:(?:[\p{L}\p{N}\p{S}\p{M}\-_]+\.)+(?:(?:xn--[a-z0-9-]+)|(?:[\p{L}\p{N}\p{M}]+)))|[a-z0-9\-_]+)\.?|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|\[${URL_IPV6}\])(:[0-9]+)?(?:\/(?:[\p{L}\p{N}\-._~!$&'()*+,;=:@]|%[0-9A-Fa-f]{2})*)*(?:\?(?:[\p{L}\p{N}\-._~!$&'\[\]()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?(?:#(?:[\p{L}\p{N}\-._~!$&'()*+,;=:@\/?]|%[0-9A-Fa-f]{2})*)?`;

/** Laravel's Str::isUrl(). */
function isUrl(value: string | null, protocols: Array<string | null>): boolean {
  if (value === null) return false;
  let re: RegExp;
  if (protocols.length === 0) {
    urlPattern ??= new RegExp(`^(${URL_PROTOCOLS})://${URL_REST}(?=\\n?(?![\\s\\S]))`, 'iu');
    re = urlPattern;
  } else {
    try {
      re = new RegExp(`^(${protocols.join('|')})://${URL_REST}(?=\\n?(?![\\s\\S]))`, 'iu');
    } catch {
      throw new NotEmulated('these url protocols');
    }
  }
  return re.test(value);
}

/* ------------------------------------------------------------------ *
 * The validator
 * ------------------------------------------------------------------ */

const MESSAGES: Record<string, string> = {
  Required: 'The value field is required.',
  Filled: 'The value field is required.',
  String: 'The value must be a string.',
  Integer: 'The value must be an integer.',
  Numeric: 'The value must be a number.',
  Boolean: 'The value field must be true or false.',
  In: 'The selected value is invalid.',
  NotIn: 'The selected value is invalid.',
  Regex: 'The value format is invalid.',
  NotRegex: 'The value field format is invalid.',
  AlphaDash: 'The value may only contain letters, numbers, and dashes.',
  AlphaNum: 'The value may only contain letters and numbers.',
  Alpha: 'The value may only contain letters.',
  Lowercase: 'The value field must be lowercase.',
  Uppercase: 'The value field must be uppercase.',
  Url: 'The value format is invalid.',
  Accepted: 'The value must be accepted.',
  Declined: 'The value field must be declined.',
};

const EMULATED = [
  'Present', 'Nullable', 'Sometimes', 'Bail', 'Required', 'Filled', 'String', 'Integer', 'Numeric', 'Boolean', 'Accepted',
  'Declined', 'In', 'NotIn', 'Regex', 'NotRegex', 'Min', 'Max', 'Size', 'Between', 'AlphaDash', 'AlphaNum', 'Alpha', 'Digits',
  'DigitsBetween', 'StartsWith', 'EndsWith', 'Lowercase', 'Uppercase', 'Url',
];
const CANONICAL = new Map(EMULATED.map((name) => [name.toLowerCase(), name]));

function canonical(name: string): string {
  return CANONICAL.get(name.toLowerCase()) ?? name;
}

function message(rule: ParsedRule, numeric: boolean): string {
  const p = rule.params.map((param) => param ?? '');
  const name = canonical(rule.name);
  // The message is looked up by the rule as written, so `REQUIRED` finds no translation.
  if (name !== rule.name) return `validation.${rule.name.replace(/(.)(?=[A-Z])/gu, '$1_').toLowerCase()}`;
  switch (name) {
    case 'Min':
      return numeric ? `The value must be at least ${p[0]}.` : `The value must be at least ${p[0]} characters.`;
    case 'Max':
      return numeric ? `The value may not be greater than ${p[0]}.` : `The value may not be greater than ${p[0]} characters.`;
    case 'Between':
      return numeric ? `The value must be between ${p[0]} and ${p[1]}.` : `The value must be between ${p[0]} and ${p[1]} characters.`;
    case 'Size':
      return numeric ? `The value must be ${p[0]}.` : `The value must be ${p[0]} characters.`;
    case 'Digits':
      return `The value must be ${p[0]} digits.`;
    case 'DigitsBetween':
      return `The value must be between ${p[0]} and ${p[1]} digits.`;
    case 'StartsWith':
      return `The value field must start with one of the following: ${p.join(', ')}.`;
    case 'EndsWith':
      return `The value field must end with one of the following: ${p.join(', ')}.`;
    default:
      return MESSAGES[name] ?? 'The value is invalid.';
  }
}

function requireParams(rule: ParsedRule, count: number) {
  if (rule.params.length < count) {
    throw new RuleError(`Validation rule ${canonical(rule.name).replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()} requires at least ${count} parameters.`);
  }
}

/**
 * Runs one rule. Returns whether it passes, or throws RuleError (the Panel would
 * error) or NotEmulated (this page can't tell).
 */
function runRule(rule: ParsedRule, value: string | null, all: ParsedRule[]): boolean {
  const hasNumeric = all.some((r) => NUMERIC_RULES.includes(r.name));
  const size = (): number => (hasNumeric && isNumeric(value) ? Number(phpTrim(value!)) : mbStrlen(value));
  const p = rule.params;

  // PHP method names ignore case, so `REQUIRED` still runs validateRequired().
  switch (canonical(rule.name)) {
    case 'Present':
    case 'Nullable':
    case 'Sometimes':
    case 'Bail':
      return true;
    case 'Required':
    case 'Filled':
      return value !== null && phpTrim(value) !== '';
    case 'String':
      return value !== null;
    case 'Integer':
      return p[0] === 'strict' ? false : isFilterInt(value);
    case 'Numeric':
      return p[0] === 'strict' ? false : isNumeric(value);
    case 'Boolean':
      return p[0] === 'strict' ? false : value === '0' || value === '1';
    case 'Accepted':
      return value !== null && ['yes', 'on', '1', 'true'].includes(value);
    case 'Declined':
      return value !== null && ['no', 'off', '0', 'false'].includes(value);
    case 'In':
      return p.includes(value ?? '');
    case 'NotIn':
      return !p.includes(value ?? '');
    case 'Regex':
    case 'NotRegex': {
      if (value === null) return false;
      requireParams(rule, 1);
      const matches = phpRegex(p[0] ?? '', value).test(value);
      return rule.name === 'Regex' ? matches : !matches;
    }
    case 'Min':
    case 'Max':
    case 'Size': {
      requireParams(rule, 1);
      const limit = bigNumber(p[0] ?? '');
      if (limit === null) return false;
      const s = size();
      return rule.name === 'Min' ? s >= limit : rule.name === 'Max' ? s <= limit : s === limit;
    }
    case 'Between': {
      requireParams(rule, 2);
      const min = bigNumber(p[0] ?? '');
      const max = bigNumber(p[1] ?? '');
      if (min === null || max === null) return false;
      const s = size();
      return s >= min && s <= max;
    }
    case 'AlphaDash':
      if (value === null) return false;
      return p[0] === 'ascii' ? /^[a-zA-Z0-9_-]+$/.test(value) : /^[\p{L}\p{M}\p{N}_-]+$/u.test(value);
    case 'AlphaNum':
      if (value === null) return false;
      return p[0] === 'ascii' ? /^[a-zA-Z0-9]+$/.test(value) : /^[\p{L}\p{M}\p{N}]+$/u.test(value);
    case 'Alpha':
      if (value === null) return false;
      return p[0] === 'ascii' ? /^[a-zA-Z]+$/.test(value) : /^[\p{L}\p{M}]+$/u.test(value);
    case 'Digits':
      requireParams(rule, 1);
      return value !== null && !/[^0-9]/.test(value) && String(value.length) === String(Number(p[0]));
    case 'DigitsBetween':
      requireParams(rule, 2);
      return value !== null && !/[^0-9]/.test(value) && value.length >= Number(p[0]) && value.length <= Number(p[1]);
    case 'StartsWith':
      return value !== null && p.some((needle) => needle !== null && needle !== '' && value.startsWith(needle));
    case 'EndsWith':
      return value !== null && p.some((needle) => needle !== null && needle !== '' && value.endsWith(needle));
    case 'Lowercase':
      return value !== null && value.toLowerCase() === value;
    case 'Uppercase':
      return value !== null && value.toUpperCase() === value;
    case 'Url':
      return isUrl(value, p);
    default:
      throw new NotEmulated(rule.raw);
  }
}

/**
 * Validates `input` (the value as typed) against an egg variable's rule string,
 * as the Startup page's save request does.
 */
export function validateVariable(rules: string, input: string): ValidationResult {
  const trimmedInput = input.replace(/^[\s​‎﻿]+|[\s​‎﻿]+$/gu, '');
  const value = trimmedInput === '' ? null : trimmedInput;

  const pieces = rules.startsWith('regex:') ? [rules] : rules.split('|');
  const parsed = [parseRule('present'), ...pieces.map(parseRule)];
  const splitRegex = !rules.startsWith('regex:') && pieces.some((piece) => /^\s*(not_)?regex:/i.test(piece)) && /regex:.*\|/is.test(rules);

  const hasNullable = parsed.some((r) => r.name === 'Nullable');
  const hasBail = parsed.some((r) => r.name === 'Bail');
  const hasNumeric = parsed.some((r) => NUMERIC_RULES.includes(r.name));

  const results: RuleResult[] = [];
  const failed: string[] = [];
  let stopped: string | null = null;
  let uncertain = false;

  for (const rule of parsed.slice(1)) {
    if (rule.name === '') continue;

    if (!rule.known) {
      results.push({ raw: rule.raw, state: 'unknown', detail: 'Not a Laravel rule. The Panel refuses to save a rule set that contains it.' });
      continue;
    }
    if (stopped) {
      results.push({ raw: rule.raw, state: 'skipped', detail: stopped });
      continue;
    }

    const implicit = IMPLICIT.has(rule.name);
    if (value === null && hasNullable && !implicit) {
      results.push({ raw: rule.raw, state: 'skipped', detail: 'Skipped: the value is empty and the rules include nullable.' });
      continue;
    }

    try {
      if (runRule(rule, value, parsed)) {
        const sizeRule = ['Min', 'Max', 'Between', 'Size'].includes(canonical(rule.name));
        results.push({
          raw: rule.raw,
          state: 'pass',
          detail:
            sizeRule && !hasNumeric && value !== null && isNumeric(value)
              ? `Counts characters (${mbStrlen(value)}), not the number, because the rules have no integer or numeric rule.`
              : undefined,
        });
      } else {
        failed.push(rule.name);
        results.push({ raw: rule.raw, state: 'fail', detail: message(rule, hasNumeric) });
      }
    } catch (error) {
      if (error instanceof RuleError) {
        failed.push(rule.name);
        results.push({ raw: rule.raw, state: 'error', detail: `The Panel errors on this rule: ${error.message}` });
        stopped = 'Skipped: the Panel stops at the error above.';
        continue;
      } else if (error instanceof NotEmulated) {
        uncertain = true;
        results.push({ raw: rule.raw, state: 'panel', detail: 'Checked by the Panel. This page does not emulate it.' });
      } else {
        throw error;
      }
    }

    if (hasBail && failed.length > 0) stopped = 'Skipped: bail stops at the first failure.';
    else if (failed.some((name) => IMPLICIT.has(name))) stopped = `Skipped: ${failed.find((name) => IMPLICIT.has(name))!.toLowerCase()} already failed.`;
  }

  const passes = results.every((r) => r.state === 'pass' || r.state === 'skipped' || r.state === 'panel');

  return { value, trimmed: trimmedInput !== input && input.trim() !== '', rules: results, passes, uncertain: passes && uncertain, splitRegex };
}

/** Egg variable names the Panel reserves (EggVariable::RESERVED_ENV_NAMES), compared without case. */
export const RESERVED_ENV_NAMES = ['SERVER_MEMORY', 'SERVER_IP', 'SERVER_PORT', 'ENV', 'HOME', 'USER', 'STARTUP', 'SERVER_UUID', 'UUID'];

/** Checks an environment variable name the way StoreVariableRequest does. Null when it is accepted. */
export function envNameProblem(name: string): string | null {
  if (!/^\w{1,191}$/.test(name)) return 'Use 1 to 191 letters, numbers, or underscores.';
  if (RESERVED_ENV_NAMES.includes(name.toUpperCase())) return `${name.toUpperCase()} is reserved. The Panel refuses it in any letter case.`;
  return null;
}
