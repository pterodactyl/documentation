/**
 * The parts of composer/semver the Panel uses on an extension manifest, ported so the docs can
 * run them in the browser:
 *
 * - `normalize()` and `parseConstraints()` from vendor/composer/semver/src/VersionParser.php
 *   (VersionParser::normalize at line 108, ::parseConstraints at 258, ::parseConstraint at 309,
 *   ::manipulateVersionString at 543). ExtensionManifestValidator.php:31-41 calls both.
 * - `satisfies()` from Semver::satisfies, with Constraint::matchSpecific and ::versionCompare
 *   (vendor/composer/semver/src/Constraint/Constraint.php), which ExtensionCompatibility.php:129
 *   calls for requires.panel, requires.sdk and requires.php.
 * - PHP's own version_compare() (php-src ext/standard/versioning.c), which Composer calls last.
 *
 * PCRE possessive quantifiers (`++`, `*+`, `{1,5}+`) become greedy ones; none of these patterns
 * can match differently because of it. Error messages are copied verbatim.
 */

export class VersionError extends Error {}

// VersionParser.php:39 and :42
const MODIFIER = '[._-]?(?:(stable|beta|b|RC|alpha|a|patch|pl|p)((?:[.-]?\\d+)*)?)?([.-]?dev)?';
const STABILITIES = 'stable|RC|beta|alpha|dev';

type Match = ReadonlyArray<string | undefined>;

/** PHP's empty() on a regex group: unset, '' and '0' are all empty. */
function empty(value: string | undefined | null): boolean {
  return value === undefined || value === null || value === '' || value === '0';
}

/** `isset($m[$i]) && '' !== $m[$i] && null !== $m[$i]`, inverted. */
function blank(value: string | undefined): boolean {
  return value === undefined || value === '';
}

/** PHP's trim() default character list. */
function phpTrim(value: string): string {
  return value.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');
}

/** PHP's preg_quote(). */
function pregQuote(value: string): string {
  return value.replace(/[.\\+*?[^\]$(){}=!<>|:\-#/]/g, '\\$&');
}

// VersionParser::expandStability, line 573
function expandStability(stability: string): string {
  const lower = stability.toLowerCase();
  switch (lower) {
    case 'a':
      return 'alpha';
    case 'b':
      return 'beta';
    case 'p':
    case 'pl':
      return 'patch';
    case 'rc':
      return 'RC';
    default:
      return lower;
  }
}

// VersionParser::parseStability, line 52
function parseStability(input: string): 'stable' | 'RC' | 'beta' | 'alpha' | 'dev' {
  const version = input.replace(/#.+$/, '');
  if (version.startsWith('dev-') || version.endsWith('-dev')) return 'dev';

  const match = new RegExp(`${MODIFIER}(?:\\+.*)?$`, 'i').exec(version.toLowerCase());
  if (match && !empty(match[3])) return 'dev';
  if (match && !empty(match[1])) {
    if (match[1] === 'beta' || match[1] === 'b') return 'beta';
    if (match[1] === 'alpha' || match[1] === 'a') return 'alpha';
    if (match[1] === 'rc') return 'RC';
  }

  return 'stable';
}

// VersionParser::normalizeBranch, line 217
function normalizeBranch(input: string): string {
  const name = phpTrim(input);
  const match = /^v?(\d+)(\.(?:\d+|[xX*]))?(\.(?:\d+|[xX*]))?(\.(?:\d+|[xX*]))?$/i.exec(name);
  if (match) {
    let version = '';
    for (let i = 1; i < 5; i++) {
      version += match[i] !== undefined ? match[i]!.replace(/[*X]/g, 'x') : '.x';
    }
    return version.replace(/x/g, '9999999') + '-dev';
  }

  return 'dev-' + name;
}

/** VersionParser::normalize, line 108. Throws a VersionError with Composer's message. */
export function normalize(input: string, fullVersionInput?: string): string {
  let version = phpTrim(String(input));
  const origVersion = version;
  const fullVersion = fullVersionInput ?? version;

  let match = /^([^,\s]+) +as +([^,\s]+)$/.exec(version);
  if (match) version = match[1]!;

  match = new RegExp(`@(?:${STABILITIES})$`, 'i').exec(version);
  if (match) version = version.slice(0, version.length - match[0].length);

  if (['master', 'trunk', 'default'].includes(version)) version = 'dev-' + version;

  if (version.toLowerCase().startsWith('dev-')) return 'dev-' + version.slice(4);

  match = /^([^,\s+]+)\+[^\s]+$/.exec(version);
  if (match) version = match[1]!;

  let matches: RegExpExecArray | null;
  let index: number | undefined;
  if ((matches = new RegExp(`^v?(\\d{1,5})(\\.\\d+)?(\\.\\d+)?(\\.\\d+)?${MODIFIER}$`, 'i').exec(version))) {
    version =
      matches[1]! +
      (!empty(matches[2]) ? matches[2] : '.0') +
      (!empty(matches[3]) ? matches[3] : '.0') +
      (!empty(matches[4]) ? matches[4] : '.0');
    index = 5;
  } else if (
    (matches = new RegExp(`^v?(\\d{4}(?:[.:-]?\\d{2}){1,6}(?:[.:-]?\\d{1,3}){0,2})${MODIFIER}$`, 'i').exec(version))
  ) {
    version = matches[1]!.replace(/\D/g, '.');
    index = 2;
  }

  if (index !== undefined && matches) {
    const stability = matches[index];
    if (!empty(stability)) {
      if (stability === 'stable') return version;
      const number = matches[index + 1];
      version += '-' + expandStability(stability!) + (number !== undefined && number !== '' ? number.replace(/^[.-]+/, '') : '');
    }
    if (!empty(matches[index + 2])) version += '-dev';

    return version;
  }

  match = /(.*?)[.-]?dev$/i.exec(version);
  if (match) {
    try {
      const normalized = normalizeBranch(match[1]!);
      if (!normalized.includes('dev-')) return normalized;
    } catch {
      // Composer swallows this and falls through to the error below.
    }
  }

  let extra = '';
  if (new RegExp(` +as +${pregQuote(version)}(?:@(?:${STABILITIES}))?$`).test(fullVersion)) {
    extra = ` in "${fullVersion}", the alias must be an exact version`;
  } else if (new RegExp(`^${pregQuote(version)}(?:@(?:${STABILITIES}))? +as +`).test(fullVersion)) {
    extra = ` in "${fullVersion}", the alias source must be an exact version, if it is a branch name you should prefix it with dev-`;
  }

  throw new VersionError(`Invalid version string "${origVersion}"${extra}`);
}

export type ConstraintNode =
  | { kind: 'all' }
  | { kind: 'version'; operator: '==' | '!=' | '<' | '<=' | '>' | '>='; version: string }
  | { kind: 'multi'; conjunctive: boolean; constraints: ConstraintNode[] };

// Constraint::__construct maps '=' and '==' to OP_EQ and '<>' and '!=' to OP_NE.
function versionConstraint(operator: string, version: string): ConstraintNode {
  const normalized = operator === '=' ? '==' : operator === '<>' ? '!=' : operator;
  return { kind: 'version', operator: normalized as '==', version };
}

// VersionParser::manipulateVersionString, line 543
function manipulateVersionString(input: Match, position: number, increment = 0, pad = '0'): string {
  const matches = [...input];
  for (let i = 4; i > 0; i--) {
    if (i > position) {
      matches[i] = pad;
    } else if (i === position && increment) {
      matches[i] = String(Number(matches[i]) + increment);
    }
  }

  return `${matches[1]}.${matches[2]}.${matches[3]}.${matches[4]}`;
}

// VersionParser::parseConstraint, line 309
function parseConstraint(input: string): ConstraintNode[] {
  let constraint = input;
  let stabilityModifier: string | undefined;

  let match = /^([^,\s]+) +as +([^,\s]+)$/.exec(constraint);
  if (match) constraint = match[1]!;

  match = new RegExp(`^([^,\\s]*?)@(${STABILITIES})$`, 'i').exec(constraint);
  if (match) {
    constraint = match[1] !== '' ? match[1]! : '*';
    if (match[2] !== 'stable') stabilityModifier = match[2];
  }

  match = /^(dev-[^,\s@]+?|[^,\s@]+?\.x-dev)#.+$/i.exec(constraint);
  if (match) constraint = match[1]!;

  match = /^(v)?[xX*](\.[xX*])*$/i.exec(constraint);
  if (match) {
    if (!empty(match[1]) || !empty(match[2])) return [versionConstraint('>=', '0.0.0.0-dev')];
    return [{ kind: 'all' }];
  }

  const versionRegex = `v?(\\d+)(?:\\.(\\d+))?(?:\\.(\\d+))?(?:\\.(\\d+))?(?:${MODIFIER}|\\.([xX*][.-]?dev))(?:\\+[^\\s]+)?`;

  // Tilde range
  let matches = new RegExp(`^~>?${versionRegex}$`, 'i').exec(constraint);
  if (matches) {
    if (constraint.startsWith('~>')) {
      throw new VersionError(
        `Could not parse version constraint ${constraint}: Invalid operator "~>", you probably meant to use the "~" operator`
      );
    }
    let position = !blank(matches[4]) ? 4 : !blank(matches[3]) ? 3 : !blank(matches[2]) ? 2 : 1;
    if (!empty(matches[8])) position++;
    const suffix = empty(matches[5]) && empty(matches[7]) && empty(matches[8]) ? '-dev' : '';
    const low = normalize((constraint + suffix).slice(1));
    const high = manipulateVersionString(matches, Math.max(1, position - 1), 1) + '-dev';
    return [versionConstraint('>=', low), versionConstraint('<', high)];
  }

  // Caret range
  matches = new RegExp(`^\\^${versionRegex}($)`, 'i').exec(constraint);
  if (matches) {
    let position: number;
    if (matches[1] !== '0' || blank(matches[2])) position = 1;
    else if (matches[2] !== '0' || blank(matches[3])) position = 2;
    else position = 3;
    const suffix = empty(matches[5]) && empty(matches[7]) && empty(matches[8]) ? '-dev' : '';
    const low = normalize((constraint + suffix).slice(1));
    const high = manipulateVersionString(matches, position, 1) + '-dev';
    return [versionConstraint('>=', low), versionConstraint('<', high)];
  }

  // X range
  matches = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.[xX*])+$/.exec(constraint);
  if (matches) {
    const position = !blank(matches[3]) ? 3 : !blank(matches[2]) ? 2 : 1;
    const low = manipulateVersionString(matches, position) + '-dev';
    const high = manipulateVersionString(matches, position, 1) + '-dev';
    if (low === '0.0.0.0-dev') return [versionConstraint('<', high)];
    return [versionConstraint('>=', low), versionConstraint('<', high)];
  }

  // Hyphen range. The named groups are numbered too, so the indexes match Composer's.
  matches = new RegExp(`^(?<from>${versionRegex}) +- +(?<to>${versionRegex})($)`, 'i').exec(constraint);
  if (matches) {
    const zeroSafeEmpty = (value: string | undefined) => value !== '0' && empty(value);
    const lowSuffix = empty(matches[6]) && empty(matches[8]) && empty(matches[9]) ? '-dev' : '';
    const lower = versionConstraint('>=', normalize(matches.groups!.from!) + lowSuffix);
    let upper: ConstraintNode;
    if (
      (!zeroSafeEmpty(matches[12]) && !zeroSafeEmpty(matches[13])) ||
      !empty(matches[15]) ||
      !empty(matches[17]) ||
      !empty(matches[18])
    ) {
      upper = versionConstraint('<=', normalize(matches.groups!.to!));
    } else {
      const highMatch = ['', matches[11], matches[12], matches[13], matches[14]];
      normalize(matches.groups!.to!);
      upper = versionConstraint('<', manipulateVersionString(highMatch, zeroSafeEmpty(matches[12]) ? 1 : 2, 1) + '-dev');
    }
    return [lower, upper];
  }

  // Basic comparators
  let failure: Error | undefined;
  matches = /^(<>|!=|>=?|<=?|==?)?\s*(.*)/.exec(constraint);
  if (matches) {
    try {
      const target = matches[2]!;
      let version: string;
      try {
        version = normalize(target);
      } catch (error) {
        if (target.endsWith('-dev') && /^[0-9a-zA-Z-./]+$/.test(target)) {
          version = normalize('dev-' + target.slice(0, -4));
        } else {
          throw error;
        }
      }

      const operator = matches[1] || '=';
      if (operator !== '==' && operator !== '=' && stabilityModifier && parseStability(version) === 'stable') {
        version += '-' + stabilityModifier;
      } else if (operator === '<' || operator === '>=') {
        if (!new RegExp(`-${MODIFIER}$`).test(target.toLowerCase()) && !target.startsWith('dev-')) {
          version += '-dev';
        }
      }

      return [versionConstraint(operator, version)];
    } catch (error) {
      failure = error as Error;
    }
  }

  throw new VersionError(`Could not parse version constraint ${constraint}${failure ? `: ${failure.message}` : ''}`);
}

/** VersionParser::parseConstraints, line 258. Throws a VersionError with Composer's message. */
export function parseConstraints(constraints: string): ConstraintNode {
  const orGroups: ConstraintNode[] = [];
  for (const orConstraint of phpTrim(String(constraints)).split(/\s*\|\|?\s*/)) {
    const andConstraints = orConstraint.split(/(?<!^|as|[=>< ,]) *(?<!-)[, ](?!-) *(?!,|as|$)/);
    const parsed = andConstraints.length > 1 ? andConstraints.flatMap(parseConstraint) : parseConstraint(andConstraints[0]!);
    orGroups.push(parsed.length === 1 ? parsed[0]! : { kind: 'multi', conjunctive: true, constraints: parsed });
  }

  return orGroups.length === 1 ? orGroups[0]! : { kind: 'multi', conjunctive: false, constraints: orGroups };
}

// ---------------------------------------------------------------------------------------------
// PHP's version_compare(), from php-src ext/standard/versioning.c
// ---------------------------------------------------------------------------------------------

const isDigit = (char: string | undefined) => char !== undefined && char >= '0' && char <= '9';

// php_canonicalize_version
function canonicalize(version: string): string {
  if (version.length === 0) return '';
  const isNonDigit = (char: string) => !isDigit(char) && char !== '.';
  const isSpecial = (char: string) => char === '-' || char === '_' || char === '+';

  let out = version[0]!;
  let previous = version[0]!;
  for (let i = 1; i < version.length; i++) {
    const char = version[i]!;
    const last = out[out.length - 1];
    if (isSpecial(char)) {
      if (last !== '.') out += '.';
    } else if ((isNonDigit(previous) && isDigit(char)) || (isDigit(previous) && isNonDigit(char))) {
      if (last !== '.') out += '.';
      out += char;
    } else if (!/[A-Za-z0-9]/.test(char)) {
      if (last !== '.') out += '.';
    } else {
      out += char;
    }
    previous = char;
  }

  return out;
}

// compare_special_version_forms: unknown words sort below "dev".
const SPECIAL_FORMS: ReadonlyArray<[string, number]> = [
  ['dev', 0],
  ['alpha', 1],
  ['a', 1],
  ['beta', 2],
  ['b', 2],
  ['RC', 3],
  ['rc', 3],
  ['#', 4],
  ['pl', 5],
  ['p', 5],
];

function compareSpecialForms(form1: string, form2: string): number {
  const order = (form: string) => SPECIAL_FORMS.find(([name]) => form.startsWith(name))?.[1] ?? -1;
  return Math.sign(order(form1) - order(form2));
}

// php_version_compare
function compareVersions(version1: string, version2: string): number {
  if (!version1 || !version2) {
    if (!version1 && !version2) return 0;
    return version1 ? 1 : -1;
  }

  const a = version1[0] === '#' ? version1 : canonicalize(version1);
  const b = version2[0] === '#' ? version2 : canonicalize(version2);
  let p1 = 0;
  let p2 = 0;
  let n1: number | null = 0;
  let n2: number | null = 0;
  let compare = 0;

  while (p1 < a.length && p2 < b.length && n1 !== null && n2 !== null) {
    const dot1 = a.indexOf('.', p1);
    const dot2 = b.indexOf('.', p2);
    n1 = dot1 === -1 ? null : dot1;
    n2 = dot2 === -1 ? null : dot2;
    const part1 = a.slice(p1, n1 ?? a.length);
    const part2 = b.slice(p2, n2 ?? b.length);

    if (isDigit(part1[0]) && isDigit(part2[0])) {
      compare = Math.sign(parseInt(part1, 10) - parseInt(part2, 10));
    } else if (!isDigit(part1[0]) && !isDigit(part2[0])) {
      compare = compareSpecialForms(part1, part2);
    } else {
      compare = isDigit(part1[0]) ? compareSpecialForms('#N#', part2) : compareSpecialForms(part1, '#N#');
    }
    if (compare !== 0) break;
    if (n1 !== null) p1 = n1 + 1;
    if (n2 !== null) p2 = n2 + 1;
  }

  if (compare === 0) {
    if (n1 !== null) {
      compare = isDigit(a[p1]) ? 1 : compareVersions(a.slice(p1), '#N#');
    } else if (n2 !== null) {
      compare = isDigit(b[p2]) ? -1 : compareVersions('#N#', b.slice(p2));
    }
  }

  return compare;
}

function versionCompare(a: string, b: string, operator: string): boolean {
  const compare = compareVersions(a, b);
  switch (operator) {
    case '<':
      return compare === -1;
    case '<=':
      return compare !== 1;
    case '>':
      return compare === 1;
    case '>=':
      return compare !== -1;
    case '==':
      return compare === 0;
    default:
      return compare !== 0;
  }
}

// Constraint::versionCompare with $compareBranches = false: dev branches never match a range.
function constraintVersionCompare(a: string, b: string, operator: string): boolean {
  const aIsBranch = a.startsWith('dev-');
  const bIsBranch = b.startsWith('dev-');
  if (operator === '!=' && (aIsBranch || bIsBranch)) return a !== b;
  if (aIsBranch && bIsBranch) return operator === '==' && a === b;
  if (aIsBranch || bIsBranch) return false;
  return versionCompare(a, b, operator);
}

function matches(node: ConstraintNode, version: string): boolean {
  switch (node.kind) {
    case 'all':
      return true;
    case 'multi':
      return node.conjunctive
        ? node.constraints.every((child) => matches(child, version))
        : node.constraints.some((child) => matches(child, version));
    default:
      // Constraint::matchSpecific against the '==' provider Semver::satisfies builds reduces to this.
      return constraintVersionCompare(version, node.version, node.operator);
  }
}

/** Semver::satisfies. Throws a VersionError when the version or the constraint does not parse. */
export function satisfies(version: string, constraints: string): boolean {
  return matches(parseConstraints(constraints), normalize(version));
}
