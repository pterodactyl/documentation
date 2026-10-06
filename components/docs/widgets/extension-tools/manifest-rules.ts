/**
 * The checks the Panel runs on an extension.json, ported to run in the browser for the
 * ManifestChecker widget. Keep this file in step with the Panel (2.0-develop):
 *
 *   app/Services/Extensions/ExtensionManifest.php            constants (ID_REGEX, prefixes, ...)
 *   app/Services/Extensions/ExtensionManifestValidator.php   fromDirectory() and its helpers
 *   app/Services/Extensions/ExtensionRepository.php:64        directory must match the id
 *   app/Services/Extensions/ExtensionProviderLoader.php:117   provider found via autoload
 *   app/Services/Extensions/ExtensionCompatibility.php:121    requires.panel/sdk/php at enable
 *   app/Services/Extensions/ExtensionStylesheetInspector.php  builds need ui.prefix
 *   resources/scripts/extensions/registry.ts:562-583          screen path collisions at load
 *
 * The structure rules run through a small copy of the Laravel validator behaviour they rely on
 * (implicit rules, `sometimes`, wildcard expansion order, first-error reporting), with the
 * Panel's resources/lang/en/validation.php messages and Laravel's for the keys it lacks.
 *
 * Not ported: the Panel also refuses root prefixes that match the first segment of any core
 * route or an entry in public/, which only the Panel can list; it is noted in the result.
 */

import { VersionError, normalize, parseConstraints, satisfies } from './composer-semver';

// ---------------------------------------------------------------------------------------------
// ExtensionManifest.php constants
// ---------------------------------------------------------------------------------------------

/** ExtensionManifest.php:14 */
export const UI_ENTRY = 'dist/client.js';

/** ExtensionManifest.php:16-21 */
export const COMPONENT_NAMES = ['dashboard.serverCard', 'server.files.details', 'server.files.editor', 'server.files.manager'];

/** ExtensionManifest.php:24. PCRE `$` without the D modifier also matches before a final newline. */
export const ID_REGEX = '/^[a-z][a-z0-9-]{0,47}$/';

/** ExtensionManifest.php:27 */
export const ICON_REGEX = '/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/';

/** ExtensionManifest.php:30 */
export const RESERVED_IDS = ['pterodactyl', 'panel', 'core'];

/** ExtensionManifest.php:33 */
export const ROOT_PREFIX_REGEX = '/^[a-z][a-z0-9-]{0,47}$/';

/** ExtensionManifest.php:41-44 */
export const RESERVED_ROOT_PREFIXES = [
  'account', 'admin', 'api', 'assets', 'auth', 'daemon', 'extension-files', 'extensions',
  'favicons', 'locales', 'panel', 'sanctum', 'server', 'servers', 'storage', 'themes', 'up',
];

/** ExtensionManifest.php:47 */
export const UI_PREFIX_REGEX = '/^[a-z]{2,12}$/D';

/** ExtensionManifest.php:56-67 */
export const RESERVED_UI_PREFIXES = [
  'accent', 'active', 'after', 'animate', 'aria', 'aspect', 'autofill', 'backdrop', 'background',
  'before', 'blur', 'border', 'breakpoint', 'card', 'caution', 'chart', 'checked', 'color',
  'container', 'core', 'dark', 'data', 'default', 'destructive', 'disabled', 'drop', 'ease', 'editor',
  'empty', 'enabled', 'even', 'file', 'first', 'focus', 'font', 'foreground', 'group', 'has', 'hover',
  'in', 'inert', 'input', 'inset', 'invalid', 'landscape', 'last', 'layout', 'leading', 'lg', 'ltr',
  'marker', 'max', 'md', 'min', 'muted', 'noscript', 'not', 'nth', 'odd', 'only', 'open', 'optional',
  'panel', 'peer', 'perspective', 'placeholder', 'popover', 'portrait', 'primary', 'print', 'ptero',
  'radius', 'radix', 'required', 'ring', 'rtl', 'scrollbar', 'secondary', 'selection', 'shadow',
  'sidebar', 'sm', 'spacing', 'spinner', 'starting', 'state', 'success', 'sunken', 'supports', 'target',
  'terminal', 'text', 'theme', 'tracking', 'tw', 'valid', 'visited', 'warning', 'xl',
];

/** A PCRE literal such as '/^[a-z]+$/D' as a RegExp, keeping PCRE's meaning of a final `$`. */
export function pcre(literal: string): RegExp {
  const end = literal.lastIndexOf(literal[0]!);
  let body = literal.slice(1, end);
  const modifiers = literal.slice(end + 1);
  if (!modifiers.includes('D') && body.endsWith('$') && !body.endsWith('\\$')) {
    body = body.slice(0, -1) + '(?=\\n?$)';
  }
  return new RegExp(body, modifiers.includes('i') ? 'i' : '');
}

const isUsableUiPrefix = (prefix: string) => pcre(UI_PREFIX_REGEX).test(prefix) && !RESERVED_UI_PREFIXES.includes(prefix);

/** ExtensionManifest::defaultUiPrefix, line 138: initials, else letters, else letters + "ui". */
export function defaultUiPrefix(id: string): string {
  const words = id
    .split('-')
    .map((word) => [...word].filter((char) => char >= 'a' && char <= 'z').join(''))
    .filter((word) => word !== '');
  const letters = words.join('');
  const fallback = [...letters].slice(0, 10).join('') + 'ui';
  const initials = words.map((word) => word[0]).join('');
  return [initials.slice(0, 12), letters.slice(0, 12)].find(isUsableUiPrefix) ?? fallback;
}

// ---------------------------------------------------------------------------------------------
// PHP value helpers. json_decode($json, true) turns objects and lists into PHP arrays.
// ---------------------------------------------------------------------------------------------

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type PhpArray = Json[] | { [key: string]: Json };

const isArray = (value: unknown): value is PhpArray => typeof value === 'object' && value !== null;
const keysOf = (value: PhpArray) => Object.keys(value);
const count = (value: PhpArray) => keysOf(value).length;

/** array_is_list() */
const isList = (value: PhpArray) => Array.isArray(value) || keysOf(value).every((key, index) => key === String(index));

/** (string) $value */
function phpString(value: Json | undefined): string {
  if (value === true) return '1';
  if (value === false || value === null || value === undefined) return '';
  return String(value);
}

const phpTrim = (value: string) => value.replace(/^[ \t\n\r\0\x0B]+|[ \t\n\r\0\x0B]+$/g, '');

/** is_numeric() */
function isNumeric(value: Json | undefined): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && /^[ \t\n\r\v\f]*[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?[ \t\n\r\v\f]*$/.test(value);
}

/** filter_var($value, FILTER_VALIDATE_INT) !== false */
function isInteger(value: Json | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isSafeInteger(value);
  return typeof value === 'string' && /^[ \t\r\n\v]*[+-]?(0|[1-9]\d*)[ \t\r\n\v]*$/.test(value) && Number.isSafeInteger(Number(value));
}

/** Arr::get / Arr::has on dot paths. */
function lookup(data: Json, path: string): { found: boolean; value: Json | undefined } {
  let current: Json | undefined = data;
  for (const segment of path.split('.')) {
    if (!isArray(current) || !Object.hasOwn(current, segment)) return { found: false, value: undefined };
    current = (current as Record<string, Json>)[segment];
  }
  return { found: true, value: current };
}
const get = (data: Json, path: string) => lookup(data, path).value ?? null;
const has = (data: Json, path: string) => lookup(data, path).found;

// ---------------------------------------------------------------------------------------------
// The Laravel validator, as far as ExtensionManifestValidator::validateManifestStructure needs it
// ---------------------------------------------------------------------------------------------

interface Rule {
  name: string;
  params: string[];
  /** Rule::in / Rule::notIn / regex keep their parameter whole. */
  pattern?: RegExp;
}

function rule(source: string): Rule {
  const colon = source.indexOf(':');
  if (colon === -1) return { name: source, params: [] };
  const name = source.slice(0, colon);
  const parameter = source.slice(colon + 1);
  if (name === 'regex') return { name, params: [parameter], pattern: pcre(parameter) };
  return { name, params: parameter.split(',') };
}

const inRule = (values: readonly string[]): Rule => ({ name: 'in', params: [...values] });
const notInRule = (values: readonly string[]): Rule => ({ name: 'not_in', params: [...values] });

export interface StructureRule {
  attribute: string;
  rules: Rule[];
  /** What the rule asks for, in plain words, for the checklist. */
  label: string;
  /** ExtensionManifestValidator.php line. */
  line: number;
}

const r = (attribute: string, rules: Array<string | Rule>, label: string, line: number): StructureRule => ({
  attribute,
  rules: rules.map((item) => (typeof item === 'string' ? rule(item) : item)),
  label,
  line,
});

const eggRules = (key: 'eggFeatures' | 'eggTags', line: number) => [
  r(`ui.screens.*.when.${key}`, ['sometimes', 'prohibited_unless:ui.screens.*.area,server', 'array:any,all'], 'Server screens only; an object with any and/or all', line),
  r(`ui.screens.*.when.${key}.*`, ['required', 'array', 'list', 'min:1', 'max:32'], 'A list of 1 to 32 values', line + 1),
  r(`ui.screens.*.when.${key}.*.*`, ['required', 'string', 'max:100'], 'Strings of up to 100 characters', line + 2),
];

/** ExtensionManifestValidator.php:92-140, in the same order. */
export const STRUCTURE_RULES: StructureRule[] = [
  r('id', ['required', 'string'], 'Required, a string', 93),
  r('name', ['required', 'string'], 'Required, a string', 94),
  r('version', ['required', 'string', 'max:64'], 'Required, a string of up to 64 characters', 95),
  r('description', ['nullable', 'string'], 'A string or null', 96),
  r('author', ['nullable', 'string'], 'A string or null', 97),
  r('provider', ['nullable', 'string'], 'A string or null', 98),
  r('autoload', ['sometimes', 'array'], 'An object', 99),
  r('requires', ['sometimes', 'array:panel,sdk,php,extensions'], 'An object with only panel, sdk, php and extensions', 100),
  r('requires.panel', ['sometimes', 'string', 'max:255'], 'A string of up to 255 characters', 101),
  r('requires.sdk', ['required_with:ui.components', 'string', 'max:255'], 'A string of up to 255 characters, required with ui.components', 102),
  r('requires.php', ['sometimes', 'string', 'max:255'], 'A string of up to 255 characters', 103),
  r('requires.extensions', ['sometimes', 'array', 'max:64'], 'An object of up to 64 entries', 104),
  r('requires.extensions.*', ['required', 'string', 'max:255'], 'Each constraint a string of up to 255 characters', 105),
  r('ui', ['sometimes', 'array'], 'An object', 106),
  r('ui.entry', ['required_with:ui', 'string'], 'Required with ui, a string', 107),
  r('ui.mode', ['sometimes', 'string'], 'A string', 108),
  r('ui.prefix', ['sometimes', 'filled', 'string', `regex:${UI_PREFIX_REGEX}`, notInRule(RESERVED_UI_PREFIXES)], '2 to 12 lowercase letters, not a reserved name', 109),
  r('ui.components', ['sometimes', 'array', 'list', 'max:64'], 'A list of up to 64 names', 110),
  r('ui.components.*', ['required', 'string', 'distinct:strict', inRule(COMPONENT_NAMES)], 'Supported component names, each once', 111),
  r('ui.screens', ['sometimes', 'array', 'list', 'max:64'], 'A list of up to 64 screens', 112),
  r('ui.screens.*', ['required', 'array:id,area,path,nav,permission,parent,when'], 'An object with only id, area, path, nav, permission, parent and when', 113),
  r('ui.screens.*.id', ['required', 'string', 'max:48', 'regex:/^[a-z][a-z0-9-]*$/', 'distinct:strict'], 'Required; lowercase letters, numbers and hyphens, starting with a letter; unique', 114),
  r('ui.screens.*.area', ['required', 'string', 'in:account,server,admin'], 'Required; account, server or admin', 115),
  r('ui.screens.*.path', ['required', 'string', 'max:255', 'regex:~^[a-z][a-z0-9-]*(?:/(?:[a-z][a-z0-9-]*|\\$[a-zA-Z][a-zA-Z0-9_]*))*/?$~'], 'Required; a static first segment, then static or $named segments', 116),
  r('ui.screens.*.parent', ['sometimes', 'string', 'prohibited_unless:ui.screens.*.area,admin', 'in:admin.node,admin.server,admin.egg,admin.user'], 'Admin screens only; admin.node, admin.server, admin.egg or admin.user', 117),
  r('ui.screens.*.nav', ['sometimes', 'array:label,exact,params,order,group,badge,icon', 'required_array_keys:label'], 'An object with a label, and only label, exact, params, order, group, badge and icon', 118),
  r('ui.screens.*.nav.label', ['required_with:ui.screens.*.nav', 'string', 'max:100'], 'A string of up to 100 characters', 119),
  r('ui.screens.*.nav.exact', ['sometimes', 'boolean:strict'], 'true or false', 120),
  r('ui.screens.*.nav.params', ['sometimes', 'array'], 'An object', 121),
  r('ui.screens.*.nav.params.*', ['required', 'string', 'max:255'], 'Non-empty strings of up to 255 characters', 122),
  r('ui.screens.*.nav.order', ['sometimes', 'integer', 'between:-10000,10000'], 'An integer from -10000 to 10000', 123),
  r('ui.screens.*.nav.group', ['sometimes', 'string', 'max:100'], 'A string of up to 100 characters', 124),
  r('ui.screens.*.nav.badge', ['sometimes', 'string', 'max:32'], 'A string of up to 32 characters', 125),
  r('ui.screens.*.nav.icon', ['sometimes', 'string', 'max:64', `regex:${ICON_REGEX}`], 'A lucide icon name such as life-buoy', 126),
  r('ui.screens.*.when', ['sometimes', 'array:eggFeatures,eggTags,match,runtime'], 'An object with only eggFeatures, eggTags, match and runtime', 127),
  ...eggRules('eggFeatures', 128),
  ...eggRules('eggTags', 131),
  r('ui.screens.*.when.match', ['sometimes', 'string', 'in:all,any'], 'all or any', 134),
  r('ui.screens.*.when.runtime', ['sometimes', 'boolean:strict'], 'true or false', 135),
  r('ui.screens.*.permission', ['sometimes', 'prohibited_unless:ui.screens.*.area,server', 'array', 'list'], 'Server screens only; a list', 136),
  r('ui.screens.*.permission.*', ['required', 'string', 'max:100'], 'Strings of up to 100 characters', 137),
  r('routes', ['sometimes', 'array:root'], 'An object with only root', 138),
  r('routes.root', ['sometimes', 'array', 'list', 'max:8'], 'A list of up to 8 prefixes', 139),
  r('routes.root.*', ['required', 'string', 'distinct:strict', `regex:${ROOT_PREFIX_REGEX}`], 'Lowercase slugs, each once', 140),
];

/** ExtensionManifestValidator.php:141-167 */
const CUSTOM_MESSAGES: Record<string, string> = {
  'id.required': 'Manifest field "id" is required and must be a string.',
  'id.string': 'Manifest field "id" is required and must be a string.',
  'name.required': 'Manifest field "name" is required and must be a string.',
  'name.string': 'Manifest field "name" is required and must be a string.',
  'version.required': 'Manifest field "version" is required and must be a string.',
  'version.string': 'Manifest field "version" is required and must be a string.',
  'version.max': 'Manifest field "version" must not be longer than 64 characters.',
  'provider.string': 'Manifest "provider" must be a class name string.',
  'autoload.array': 'Manifest "autoload" must map "Vendor\\\\Prefix\\\\" to a source directory.',
  'ui.array': 'Manifest "ui" must be an object with an "entry" path.',
  'ui.entry.required_with': 'Manifest "ui" must be an object with an "entry" path.',
  'ui.entry.string': 'Manifest "ui" must be an object with an "entry" path.',
  'ui.mode.string': 'Manifest "ui.mode" must be a string.',
  'ui.prefix.filled': `Manifest "ui.prefix" must match ${UI_PREFIX_REGEX}.`,
  'ui.prefix.string': `Manifest "ui.prefix" must match ${UI_PREFIX_REGEX}.`,
  'ui.prefix.regex': `Manifest "ui.prefix" must match ${UI_PREFIX_REGEX}.`,
  'ui.prefix.not_in': 'Manifest "ui.prefix" is a Tailwind variant, theme namespace or panel name and cannot be used as a prefix.',
  'requires.sdk.required_with': 'Component replacements must declare a "requires.sdk" version constraint.',
  'ui.components.*.in': 'Manifest "ui.components" must contain supported component names.',
  'ui.screens.*.permission.prohibited_unless': 'Screen "permission" is only supported on server screens.',
  'ui.screens.*.nav.icon.regex': 'Navigation "icon" must be a lucide icon name such as "life-buoy".',
  'ui.screens.*.when.eggFeatures.prohibited_unless': 'Screen "when" egg rules are only supported on server screens.',
  'ui.screens.*.when.eggTags.prohibited_unless': 'Screen "when" egg rules are only supported on server screens.',
  'routes.array': 'Manifest "routes" must be an object with a "root" list.',
  'routes.root.*.regex': `Manifest "routes.root" prefixes must match ${ROOT_PREFIX_REGEX}.`,
  'routes.root.*.distinct': 'Manifest "routes.root" prefixes must be unique.',
};

/** resources/lang/en/validation.php, falling back to Laravel's own lines for list, prohibited_unless and required_array_keys. */
const LINES: Record<string, string | Record<'numeric' | 'string' | 'array', string>> = {
  array: 'The :attribute must be an array.',
  between: {
    numeric: 'The :attribute must be between :min and :max.',
    string: 'The :attribute must be between :min and :max characters.',
    array: 'The :attribute must have between :min and :max items.',
  },
  boolean: 'The :attribute field must be true or false.',
  distinct: 'The :attribute field has a duplicate value.',
  filled: 'The :attribute field is required.',
  in: 'The selected :attribute is invalid.',
  integer: 'The :attribute must be an integer.',
  list: 'The :attribute field must be a list.',
  max: {
    numeric: 'The :attribute may not be greater than :max.',
    string: 'The :attribute may not be greater than :max characters.',
    array: 'The :attribute may not have more than :max items.',
  },
  min: {
    numeric: 'The :attribute must be at least :min.',
    string: 'The :attribute must be at least :min characters.',
    array: 'The :attribute must have at least :min items.',
  },
  not_in: 'The selected :attribute is invalid.',
  prohibited_unless: 'The :attribute field is prohibited unless :other is in :values.',
  regex: 'The :attribute format is invalid.',
  required: 'The :attribute field is required.',
  required_array_keys: 'The :attribute field must contain entries for: :values.',
  required_with: 'The :attribute field is required when :values is present.',
  string: 'The :attribute must be a string.',
};

const IMPLICIT = new Set(['required', 'required_with', 'filled']);
const SIZE_RULES = new Set(['max', 'min', 'between']);
const DEPENDENT = new Set(['required_with', 'prohibited_unless']);

/**
 * Concrete attributes for a wildcard pattern, in the order ValidationData::initializeAndGatherData
 * yields them: nothing unless the path before the first `*` exists, every key of each `*`, and
 * literal segments after a `*` whether or not they exist (data_set fills them in).
 */
function expandWildcard(data: Json, pattern: string): string[] {
  const leading = pattern.split('*')[0]!.replace(/\.$/, '');
  if (leading && !has(data, leading)) return [];

  const out: string[] = [];
  const walk = (segments: string[], value: Json | undefined, prefix: string) => {
    if (segments.length === 0) {
      out.push(prefix);
      return;
    }
    const [segment, ...rest] = segments as [string, ...string[]];
    const join = (key: string) => (prefix ? `${prefix}.${key}` : key);
    if (segment === '*') {
      if (isArray(value)) for (const key of keysOf(value)) walk(rest, (value as Record<string, Json>)[key], join(key));
      return;
    }
    const child = isArray(value) && Object.hasOwn(value, segment) ? (value as Record<string, Json>)[segment] : undefined;
    walk(rest, child, join(segment));
  };
  walk(pattern.split('.'), data, '');
  return out;
}

/** Str::snake, then underscores to spaces, as getDisplayableAttribute does for explicit attributes. */
function displayable(attribute: string, implicit: Set<string>): string {
  if (implicit.has(attribute)) return attribute;
  const snake = /^[a-z0-9_.]*$/.test(attribute) ? attribute : attribute.replace(/(.)(?=[A-Z])/g, '$1_').toLowerCase();
  return snake.replace(/_/g, ' ');
}

export interface StructureFailure {
  attribute: string;
  pattern: string;
  rule: string;
  message: string;
}

export interface StructureOutcome {
  /** Every failure, in the order Laravel adds them. The first is what the Panel reports. */
  failures: StructureFailure[];
  /** Concrete attributes per rule pattern. */
  attributes: Map<string, string[]>;
}

/** ExtensionManifestValidator::validateManifestStructure, lines 88-173. */
export function validateStructure(data: Json): StructureOutcome {
  // ValidationRuleParser::explodeRules keeps explicit attributes in place and appends each
  // wildcard's concrete attributes after them, so those are validated last.
  const explicit: Array<[string, StructureRule]> = [];
  const expanded: Array<[string, StructureRule]> = [];
  const implicit = new Set<string>();
  const attributes = new Map<string, string[]>();
  for (const structure of STRUCTURE_RULES) {
    if (structure.attribute.includes('*')) {
      const concrete = expandWildcard(data, structure.attribute);
      attributes.set(structure.attribute, concrete);
      for (const attribute of concrete) {
        implicit.add(attribute);
        expanded.push([attribute, structure]);
      }
    } else {
      attributes.set(structure.attribute, [structure.attribute]);
      explicit.push([structure.attribute, structure]);
    }
  }

  const failures: StructureFailure[] = [];

  const required = (value: Json | undefined) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && phpTrim(value) === '') return false;
    if (isArray(value) && count(value) < 1) return false;
    return true;
  };

  for (const [attribute, structure] of [...explicit, ...expanded]) {
    const value = get(data, attribute);
    const ruleNames = structure.rules.map((item) => item.name);
    const hasNumeric = ruleNames.includes('integer');
    const failed = new Set<string>();

    // Validator::getExplicitKeys + replaceAsterisksInParameters for dependent rules.
    const wildcardKeys = (() => {
      const regex = new RegExp('^' + structure.attribute.split('.').map((part) => (part === '*' ? '([^.]*)' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))).join('\\.') + '$');
      return regex.exec(attribute)?.slice(1) ?? [];
    })();
    const resolve = (parameter: string) => {
      let index = 0;
      return parameter.replace(/\*/g, () => wildcardKeys[index++] ?? '*');
    };

    const size = (subject: Json | undefined) => {
      if (hasNumeric && isNumeric(subject)) return Number(phpTrim(String(subject)));
      if (isArray(subject)) return count(subject);
      return [...phpString(subject)].length;
    };
    const sizeType = hasNumeric ? 'numeric' : ruleNames.includes('array') || ruleNames.includes('list') ? 'array' : 'string';

    for (const item of structure.rules) {
      if (item.name === 'sometimes' || item.name === 'nullable') continue;
      const params = DEPENDENT.has(item.name) ? item.params.map(resolve) : item.params;

      // Validator::isValidatable
      const isImplicit = IMPLICIT.has(item.name);
      const present = typeof value === 'string' && phpTrim(value) === '' ? isImplicit : has(data, attribute) || isImplicit;
      const optional = !ruleNames.includes('sometimes') || has(data, attribute);
      const nullable = isImplicit || !ruleNames.includes('nullable') || value !== null || !has(data, attribute);
      if (!(present && optional && nullable)) continue;

      let ok: boolean;
      switch (item.name) {
        case 'required':
          ok = required(value);
          break;
        case 'required_with':
          ok = params.every((other) => !required(get(data, other))) ? true : required(value);
          break;
        case 'filled':
          ok = has(data, attribute) ? required(value) : true;
          break;
        case 'string':
          ok = typeof value === 'string';
          break;
        case 'array':
          ok = isArray(value) && (params.length === 0 || keysOf(value).every((key) => params.includes(key)));
          break;
        case 'list':
          ok = isArray(value) && isList(value);
          break;
        case 'max':
          ok = size(value) <= Number(params[0]);
          break;
        case 'min':
          ok = size(value) >= Number(params[0]);
          break;
        case 'between':
          ok = size(value) >= Number(params[0]) && size(value) <= Number(params[1]);
          break;
        case 'integer':
          ok = isInteger(value);
          break;
        case 'boolean':
          ok = value === true || value === false;
          break;
        case 'in':
          ok = !isArray(value) && params.includes(phpString(value));
          break;
        case 'not_in':
          ok = !(!isArray(value) && params.includes(phpString(value)));
          break;
        case 'regex':
          ok = (typeof value === 'string' || isNumeric(value)) && item.pattern!.test(phpString(value));
          break;
        case 'distinct': {
          const siblings = (attributes.get(structure.attribute) ?? []).filter((other) => other !== attribute);
          const same = (other: Json | undefined) =>
            isArray(value) || isArray(other) ? JSON.stringify(other) === JSON.stringify(value) : other === value;
          ok = !siblings.some((other) => {
            const sibling = lookup(data, other);
            return sibling.found && !isArray(sibling.value) && same(sibling.value);
          });
          break;
        }
        case 'prohibited_unless': {
          const [otherPath, ...allowed] = params as [string, ...string[]];
          const other = get(data, otherPath);
          const matches =
            typeof other === 'boolean'
              ? allowed.some((candidate) => (candidate === 'true') === other && (candidate === 'true' || candidate === 'false'))
              : other === null
                ? allowed.includes('null')
                : allowed.includes(phpString(other));
          ok = matches ? true : !required(value);
          break;
        }
        case 'required_array_keys':
          ok = isArray(value) && params.every((key) => Object.hasOwn(value, key));
          break;
        default:
          ok = true;
      }

      if (!ok) {
        failed.add(item.name);
        failures.push({ attribute, pattern: structure.attribute, rule: item.name, message: message(attribute, item.name, params, sizeType) });
      }

      // Validator::shouldStopValidating: a failed implicit rule ends this attribute.
      if (ruleNames.some((name) => IMPLICIT.has(name)) && [...failed].some((name) => IMPLICIT.has(name))) break;
    }
  }

  function message(attribute: string, ruleName: string, params: string[], sizeType: 'numeric' | 'string' | 'array'): string {
    // FormatsMessages::getFromLocalArray: custom keys may hold `*`, matching one segment.
    for (const [key, text] of Object.entries(CUSTOM_MESSAGES)) {
      const regex = new RegExp('^' + key.split('*').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^.]*') + '$');
      if (regex.test(`${attribute}.${ruleName}`)) return text;
    }
    const line = LINES[ruleName] ?? 'The :attribute is invalid.';
    let text = typeof line === 'string' ? line : line[SIZE_RULES.has(ruleName) ? sizeType : 'string'];
    text = text.replace(':attribute', displayable(attribute, implicit));
    switch (ruleName) {
      case 'max':
        return text.replace(':max', params[0]!);
      case 'min':
        return text.replace(':min', params[0]!);
      case 'between':
        return text.replace(':min', params[0]!).replace(':max', params[1]!);
      case 'required_with':
        return text.replace(':values', params.map((other) => displayable(other, implicit)).join(' / '));
      case 'prohibited_unless':
        return text.replace(':other', displayable(params[0]!, implicit)).replace(':values', params.slice(1).join(', '));
      case 'required_array_keys':
        return text.replace(':values', params.join(', '));
      default:
        return text;
    }
  }

  return { failures, attributes };
}

// ---------------------------------------------------------------------------------------------
// The full check: structure, then the rest of fromDirectory(), then discovery and later checks
// ---------------------------------------------------------------------------------------------

export type Stage = 'read' | 'discover' | 'enable' | 'build' | 'browser';
export type Status = 'pass' | 'fail' | 'warn' | 'skip';

export interface CheckResult {
  key: string;
  /** Which part of the Panel runs the check. */
  stage: Stage;
  /** A heading the checklist groups rows under. */
  group: string;
  label: string;
  path: string;
  status: Status;
  /** The Panel's message for this failure or warning. */
  message?: string;
  /** A short note on what the check cannot see from here. */
  note?: string;
  source: string;
}

export interface ManifestReport {
  results: CheckResult[];
  /** What the Panel reports when it reads the manifest (install, enable, discovery), if anything. */
  rejection?: CheckResult;
  /** The id the checks used, when there is one. */
  id?: string;
}

export interface CheckOptions {
  directory: string;
  installed: { panel: string; sdk: string; php: string };
}

const V = 'ExtensionManifestValidator.php';

/** Core paths per area and resource tab, as buildRouteTree passes them to prepareExtensions (routeTree.ts:1162-1175). */
const CORE_PATHS: Record<string, string[]> = {
  account: ['api', 'ssh', 'activity'],
  server: ['files', 'databases', 'schedules', 'users', 'backups', 'network', 'startup', 'settings', 'activity'],
  admin: ['activity', 'settings', 'users', 'locations', 'nodes', 'servers', 'databases', 'mounts', 'eggs', 'tags', 'extensions', 'api'],
  'admin.node': ['settings', 'configuration', 'allocation', 'servers'],
  'admin.server': ['details', 'build', 'startup', 'database', 'mounts', 'manage', 'delete'],
  'admin.egg': ['tags', 'variables', 'script'],
  'admin.user': [],
};

export function checkManifest(source: string, options: CheckOptions): ManifestReport {
  const results: CheckResult[] = [];
  const add = (result: CheckResult) => results.push(result);

  // ExtensionManifestValidator.php:23-27
  let data: Json;
  try {
    data = JSON.parse(source) as Json;
  } catch {
    const result: CheckResult = {
      key: 'json',
      stage: 'read',
      group: 'File',
      label: 'Parses as JSON',
      path: 'extension.json',
      status: 'fail',
      message: `extensions/${options.directory}/extension.json is not valid JSON.`,
      source: `${V}:23-27`,
    };
    return { results: [result], rejection: result };
  }

  // ExtensionManifestValidator.php:90
  if (!isArray(data)) {
    const result: CheckResult = {
      key: 'object',
      stage: 'read',
      group: 'File',
      label: 'Is a JSON object',
      path: 'extension.json',
      status: 'fail',
      message: 'The extension manifest must be a JSON object.',
      source: `${V}:90`,
    };
    return { results: [result], rejection: result };
  }

  // Structure (Laravel validator)
  const structure = validateStructure(data);
  const firstStructureFailure = structure.failures[0];
  for (const item of STRUCTURE_RULES) {
    const concrete = structure.attributes.get(item.attribute) ?? [];
    const failure = structure.failures.find((candidate) => candidate.pattern === item.attribute);
    const applies = concrete.some((attribute) => has(data, attribute));
    add({
      key: `structure:${item.attribute}`,
      stage: 'read',
      group: 'Structure',
      label: item.label,
      path: failure?.attribute ?? item.attribute,
      status: failure ? 'fail' : applies ? 'pass' : 'skip',
      message: failure?.message,
      source: `${V}:${item.line}`,
    });
  }

  const value = (path: string) => get(data, path);
  const str = (path: string) => (typeof value(path) === 'string' ? (value(path) as string) : undefined);
  const id = str('id');
  const requires = isArray(value('requires')) ? (value('requires') as Record<string, Json>) : {};

  // Versions: ExtensionManifestValidator.php:31-41. Composer messages are wrapped.
  const versionRow = (key: string, path: string, label: string, run: () => void) => {
    let status: Status = 'pass';
    let message: string | undefined;
    try {
      run();
    } catch (error) {
      status = 'fail';
      message = 'Invalid extension version or requirement: ' + (error instanceof VersionError ? error.message : String(error));
    }
    add({ key, stage: 'read', group: 'Versions', label, path, status, message, source: `${V}:31-41` });
  };
  if (str('version') !== undefined) {
    versionRow('version', 'version', 'Parses as a Composer version', () => normalize(str('version')!));
  }
  for (const runtime of ['panel', 'sdk', 'php'] as const) {
    const constraint = requires[runtime];
    if (typeof constraint === 'string') {
      versionRow(`requires.${runtime}`, `requires.${runtime}`, 'Parses as a Composer constraint', () => parseConstraints(constraint));
    }
  }
  const dependencies = isArray(requires.extensions) ? (requires.extensions as Record<string, Json>) : {};
  for (const [dependency, constraint] of Object.entries(dependencies)) {
    if (typeof constraint === 'string') {
      versionRow(`requires.extensions.${dependency}`, `requires.extensions.${dependency}`, 'Parses as a Composer constraint', () => parseConstraints(constraint));
    }
  }

  // ExtensionManifestValidator.php:43-45
  for (const dependency of Object.keys(dependencies)) {
    const ok = pcre(ID_REGEX).test(dependency) && dependency !== id;
    add({
      key: `dependency:${dependency}`,
      stage: 'read',
      group: 'Versions',
      label: 'Names a valid extension id other than this one',
      path: `requires.extensions.${dependency}`,
      status: ok ? 'pass' : 'fail',
      message: ok ? undefined : 'Extension dependencies must be valid identifiers other than the extension itself.',
      source: `${V}:43-45`,
    });
  }

  // Screens: ExtensionManifestValidator.php:47-60 and validateScreenCondition, 181-189
  const screens = Array.isArray(value('ui.screens')) ? (value('ui.screens') as Json[]) : [];
  screens.forEach((screen, index) => {
    if (!isArray(screen) || Array.isArray(screen)) return;
    const base = `ui.screens.${index}`;
    const path = screen.path;
    if (typeof path !== 'string') return;
    const parameters = path.split('/').filter((segment) => segment.startsWith('$'));

    let paramMessage: string | undefined;
    if (parameters.includes('$id')) paramMessage = 'The id path parameter is reserved for the panel.';
    else if (new Set(parameters).size !== parameters.length) paramMessage = 'Screen path parameters must be unique.';
    add({
      key: `screen:${index}:params`,
      stage: 'read',
      group: 'Screens',
      label: 'Path parameters are unique, and $id is not one of them',
      path: `${base}.path`,
      status: paramMessage ? 'fail' : parameters.length ? 'pass' : 'skip',
      message: paramMessage,
      source: `${V}:48-50`,
    });

    if (screen.nav !== undefined && screen.nav !== null) {
      const names = parameters.map((parameter) => parameter.slice(1));
      const nav = screen.nav;
      const defaults = isArray(nav) && isArray((nav as Record<string, Json>).params) ? Object.keys((nav as Record<string, Json>).params as PhpArray) : [];
      const ok = names.every((name) => defaults.includes(name)) && defaults.every((name) => names.includes(name));
      add({
        key: `screen:${index}:nav-params`,
        stage: 'read',
        group: 'Screens',
        label: 'nav.params supplies exactly the path parameters',
        path: `${base}.nav.params`,
        status: ok ? (names.length || defaults.length ? 'pass' : 'skip') : 'fail',
        message: ok ? undefined : 'Navigation params must supply exactly the screen path parameters.',
        source: `${V}:51-55`,
      });
    }

    if (screen.when !== undefined && screen.when !== null && isArray(screen.when)) {
      const when = screen.when as Record<string, Json>;
      const rules = (['eggFeatures', 'eggTags'] as const).filter((name) => Object.hasOwn(when, name));
      let conditionMessage: string | undefined;
      if (rules.length === 0 && when.runtime !== true) conditionMessage = 'Screen "when" must declare an egg rule or "runtime": true.';
      else if (when.match !== undefined && when.match !== null && rules.length < 2)
        conditionMessage = 'Screen "when.match" combines "eggFeatures" with "eggTags" and requires both.';
      else {
        const emptyRule = rules.find((name) => isArray(when[name]) && count(when[name] as PhpArray) === 0);
        if (emptyRule) conditionMessage = `Screen "when.${emptyRule}" must list "any" or "all" values.`;
      }
      add({
        key: `screen:${index}:when`,
        stage: 'read',
        group: 'Screens',
        label: 'when restricts something',
        path: `${base}.when`,
        status: conditionMessage ? 'fail' : 'pass',
        message: conditionMessage,
        source: `${V}:181-189`,
      });
    }
  });

  // Root prefixes: ExtensionManifestValidator.php:200-216 (static list only)
  const roots = Array.isArray(value('routes.root')) ? (value('routes.root') as Json[]) : [];
  roots.forEach((prefix, index) => {
    if (typeof prefix !== 'string') return;
    const reserved = RESERVED_ROOT_PREFIXES.includes(prefix);
    add({
      key: `root:${index}`,
      stage: 'read',
      group: 'Routes',
      label: 'Not a prefix the Panel uses',
      path: `routes.root.${index}`,
      status: reserved ? 'fail' : 'pass',
      message: reserved ? `Root path prefix "/${prefix}" is reserved by the panel.` : undefined,
      note: reserved ? undefined : 'The Panel also rejects the first segment of any core route and anything in public/.',
      source: `${V}:200-216`,
    });
  });

  // Identity: ExtensionManifestValidator.php:64-67
  if (id !== undefined) {
    const matchesRegex = pcre(ID_REGEX).test(id);
    add({
      key: 'id:regex',
      stage: 'read',
      group: 'Identity',
      label: `Matches ${ID_REGEX}`,
      path: 'id',
      status: matchesRegex ? 'pass' : 'fail',
      message: matchesRegex ? undefined : `Extension id "${id}" must match ${ID_REGEX}.`,
      source: `${V}:64-65`,
    });
    const reserved = RESERVED_IDS.includes(id);
    add({
      key: 'id:reserved',
      stage: 'read',
      group: 'Identity',
      label: 'Is not pterodactyl, panel or core',
      path: 'id',
      status: reserved ? 'fail' : 'pass',
      message: reserved ? `Extension id "${id}" is reserved.` : undefined,
      source: `${V}:67`,
    });
  }

  // Autoload: normalizeAutoload, ExtensionManifestValidator.php:223-235
  const autoload = value('autoload');
  const autoloadPrefixes: string[] = [];
  if (isArray(autoload)) {
    for (const [prefix, directory] of Object.entries(autoload)) {
      // json_decode turns decimal integer keys into ints, which is_string() rejects.
      const prefixIsString = !/^(0|-?[1-9]\d*)$/.test(prefix);
      const mapOk = prefixIsString && typeof directory === 'string' && prefix.endsWith('\\');
      add({
        key: `autoload:${prefix}:map`,
        stage: 'read',
        group: 'Autoload',
        label: 'Maps a namespace prefix ending in \\ to a directory',
        path: `autoload."${prefix}"`,
        status: mapOk ? 'pass' : 'fail',
        message: mapOk ? undefined : 'Manifest "autoload" must map "Vendor\\\\Prefix\\\\" to a source directory.',
        source: `${V}:227`,
      });
      if (typeof directory === 'string') {
        const relative = !directory.startsWith('/') && !directory.includes('..');
        add({
          key: `autoload:${prefix}:relative`,
          stage: 'read',
          group: 'Autoload',
          label: 'Directory is a relative path inside the package',
          path: `autoload."${prefix}"`,
          status: relative ? 'pass' : 'fail',
          message: relative ? undefined : 'Manifest "autoload" directories must be relative paths inside the package.',
          source: `${V}:229`,
        });
      }
      if (mapOk) autoloadPrefixes.push(prefix);
    }
  }

  // UI: normalizeUi, ExtensionManifestValidator.php:241-256
  const ui = value('ui');
  const hasUi = ui !== null && ui !== undefined;
  if (isArray(ui)) {
    const entry = (ui as Record<string, Json>).entry;
    if (typeof entry === 'string') {
      const normalized = entry.replace(/\\/g, '/');
      const relative = !normalized.startsWith('/') && !normalized.includes('..');
      add({
        key: 'ui:entry:relative',
        stage: 'read',
        group: 'Frontend',
        label: 'Entry is a relative path inside the package',
        path: 'ui.entry',
        status: relative ? 'pass' : 'fail',
        message: relative ? undefined : 'Manifest "ui.entry" must be a relative path inside the package.',
        source: `${V}:247-248`,
      });
      const exact = normalized === UI_ENTRY;
      add({
        key: 'ui:entry:exact',
        stage: 'read',
        group: 'Frontend',
        label: `Entry is ${UI_ENTRY}`,
        path: 'ui.entry',
        status: exact ? 'pass' : 'fail',
        message: exact ? undefined : `Manifest "ui.entry" must be "${UI_ENTRY}".`,
        source: `${V}:250`,
      });
    } else if (count(ui) === 0) {
      // An empty "ui" passes the validator, then $ui['entry'] is read anyway.
      add({
        key: 'ui:entry:missing',
        stage: 'read',
        group: 'Frontend',
        label: 'Has an entry',
        path: 'ui.entry',
        status: 'fail',
        message: 'Undefined array key "entry"',
        note: 'A PHP warning rather than a manifest error, so the command fails without the usual message.',
        source: `${V}:247`,
      });
    }
    const mode = (ui as Record<string, Json>).mode ?? 'native';
    if (typeof mode === 'string') {
      const native = mode === 'native';
      add({
        key: 'ui:mode',
        stage: 'read',
        group: 'Frontend',
        label: 'Mode is native',
        path: 'ui.mode',
        status: native ? 'pass' : 'fail',
        message: native ? undefined : `Unsupported ui.mode "${mode}" - this panel supports: native.`,
        source: `${V}:252-253`,
      });
    }
  }

  // ExtensionManifestValidator.php:72-73
  const provider = value('provider');
  if (typeof provider === 'string') {
    add({
      key: 'provider',
      stage: 'read',
      group: 'Backend',
      label: 'Provider is not an empty string',
      path: 'provider',
      status: provider === '' ? 'fail' : 'pass',
      message: provider === '' ? 'Manifest "provider" must be a class name string.' : undefined,
      source: `${V}:72-73`,
    });
  }

  // ExtensionRepository.php:64-66
  if (id !== undefined) {
    const matches = id === options.directory;
    add({
      key: 'directory',
      stage: 'discover',
      group: 'Identity',
      label: 'Matches the directory name',
      path: 'id',
      status: matches ? 'pass' : 'fail',
      message: matches ? undefined : `Extension directory "${options.directory}" must match its manifest id "${id}".`,
      source: 'ExtensionRepository.php:64-66',
    });
  }

  // ExtensionProviderLoader.php:117-118. Composer's vendor/autoload.php may also provide it.
  if (typeof provider === 'string' && provider !== '') {
    const found = autoloadPrefixes.some((prefix) => provider.startsWith(prefix));
    add({
      key: 'provider:autoload',
      stage: 'enable',
      group: 'Backend',
      label: 'Provider class sits under an autoload prefix',
      path: 'provider',
      status: found ? 'pass' : 'warn',
      message: found ? undefined : `Provider class ${provider} was not found via the manifest autoload map.`,
      note: found ? undefined : 'Unless a bundled vendor/autoload.php defines the class, loading the extension fails with this message.',
      source: 'ExtensionProviderLoader.php:117-118',
    });
  }

  // ExtensionCompatibility::runtimeFailureReason, line 121
  for (const runtime of ['panel', 'sdk', 'php'] as const) {
    const constraint = requires[runtime];
    if (typeof constraint !== 'string' || id === undefined) continue;
    const installed = options.installed[runtime];
    let status: Status;
    let message: string | undefined;
    let note: string | undefined;
    try {
      status = satisfies(installed, constraint) ? 'pass' : 'fail';
      if (status === 'fail') message = `Extension "${id}" requires ${runtime} ${constraint}; installed version is ${installed}.`;
    } catch (error) {
      status = 'skip';
      note = error instanceof VersionError ? error.message : String(error);
    }
    add({
      key: `compat:${runtime}`,
      stage: 'enable',
      group: 'Compatibility',
      label: `Accepts the installed ${runtime === 'php' ? 'PHP' : runtime === 'sdk' ? 'SDK' : 'Panel'} version (${installed})`,
      path: `requires.${runtime}`,
      status,
      message,
      note,
      source: 'ExtensionCompatibility.php:121-135',
    });
  }

  // ExtensionStylesheetInspector::conflictReason, lines 48-53
  if (hasUi && id !== undefined) {
    const prefix = value('ui.prefix');
    const declared = typeof prefix === 'string' && prefix !== '';
    const suggested = defaultUiPrefix(id);
    add({
      key: 'prefix:build',
      stage: 'build',
      group: 'Frontend',
      label: 'Declares the Tailwind prefix its build uses',
      path: 'ui.prefix',
      status: declared ? 'pass' : 'warn',
      message: declared
        ? undefined
        : `Extension "${id}" ships Tailwind utilities in dist/{file} ({classes}) but declares no Tailwind prefix - add "prefix": "${suggested}" to "ui" in extension.json, build Tailwind with \`prefix(${suggested})\`, write its classes as \`${suggested}:flex\` (see the SDK README, "Styling") and rebuild.`,
      note: declared ? undefined : 'Install, enable, doctor and pack refuse a build whose CSS has Tailwind utilities or theme variables without a prefix.',
      source: 'ExtensionStylesheetInspector.php:48-53',
    });
  }

  // registry.ts prepareExtensions, lines 562-583: the browser refuses screens that collide.
  if (id !== undefined) {
    const claimed = new Map<string, number>();
    screens.forEach((screen, index) => {
      if (!isArray(screen) || Array.isArray(screen)) return;
      const { path, area, parent } = screen as Record<string, Json>;
      if (typeof path !== 'string' || typeof area !== 'string' || !(area in CORE_PATHS)) return;
      const normalized = path.replace(/\/+$/, '');
      const first = normalized.split('/')[0]!;
      const scope = typeof parent === 'string' ? parent : area;
      let failure: string | undefined;
      if ((CORE_PATHS[scope] ?? []).includes(first)) {
        failure = `screen "${normalized}" collides with core in ${area}`;
      } else {
        const key = `${scope}:${normalized.replace(/\$[a-zA-Z][a-zA-Z0-9_]*/g, '$param')}`;
        if (claimed.has(key)) failure = `screen "${normalized}" collides with extension "${id}"`;
        else claimed.set(key, index);
      }
      add({
        key: `browser:${index}`,
        stage: 'browser',
        group: 'Screens',
        label: 'Path is free in its area',
        path: `ui.screens.${index}.path`,
        status: failure ? 'fail' : 'pass',
        message: failure,
        note: failure ? 'The Panel installs it, but the browser does not load the extension.' : undefined,
        source: 'registry.ts:573-583',
      });
    });
  }

  // The order fromDirectory() runs in decides what the Panel reports.
  const order = [
    'structure',
    'version',
    'requires',
    'dependency',
    'screen',
    'root',
    'id',
    'autoload',
    'ui',
    'provider',
    'directory',
  ];
  let rejection: CheckResult | undefined;
  if (firstStructureFailure) {
    rejection = results.find((result) => result.key === `structure:${firstStructureFailure.pattern}`);
    if (rejection) rejection = { ...rejection, path: firstStructureFailure.attribute, message: firstStructureFailure.message };
  } else {
    for (const prefix of order.slice(1)) {
      rejection = results.find(
        (result) =>
          (result.stage === 'read' || result.stage === 'discover') &&
          result.status === 'fail' &&
          (result.key === prefix || result.key.startsWith(prefix + ':') || result.key.startsWith(prefix + '.'))
      );
      if (rejection) break;
    }
  }

  return { results, rejection, id };
}
