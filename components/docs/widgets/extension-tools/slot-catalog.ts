/**
 * What each mount point in the ExtensionSlotMap passes to an extension, taken from the Panel's
 * frontend (2.0-develop):
 *
 *   resources/scripts/extensions/registry.ts:23-189   SLOT_NAMES
 *   resources/scripts/extensions/registry.ts:193-278  slot data contracts and SlotData<Name>
 *   resources/scripts/extensions/registry.ts:311-364  screens: areas, parents, ScreenComponentProps
 *   resources/scripts/extensions/tableTypes.ts        columns.register tables and row types
 *   resources/scripts/extensions/componentTypes.ts    components.replace names, models and parts
 *   packages/sdk/types/sdk/index.d.ts:62-83           ExtensionSetupContext (the registration API)
 */

/** registry.ts:23-189 */
export const SLOT_NAMES = [
  'nav.items.before', 'nav.items.after',
  'auth.login.before', 'auth.login.after', 'auth.login.form.after', 'auth.checkpoint.before', 'auth.checkpoint.after',
  'auth.password.before', 'auth.password.after', 'auth.passwordReset.before', 'auth.passwordReset.after',
  'dashboard.before', 'dashboard.after', 'dashboard.serverRow.before', 'dashboard.serverRow.after',
  'dashboard.serverRow.name.after', 'dashboard.serverRow.metrics.after',
  'account.navigation.before', 'account.navigation.after', 'account.overview.before', 'account.overview.after',
  'account.api.before', 'account.api.after', 'account.ssh.before', 'account.ssh.after',
  'account.activity.before', 'account.activity.after',
  'server.navigation.before', 'server.navigation.after', 'server.console.before', 'server.console.power.before',
  'server.console.power.after', 'server.console.after', 'server.files.before', 'server.files.after',
  'server.files.toolbar', 'server.files.rowActions', 'server.files.selectionActions',
  'server.files.editor.before', 'server.files.editor.after', 'server.databases.before', 'server.databases.after',
  'server.schedules.before', 'server.schedules.after', 'server.schedules.detail.before', 'server.schedules.detail.after',
  'server.users.before', 'server.users.after', 'server.users.create.before', 'server.users.create.after',
  'server.users.permissions.before', 'server.backups.before', 'server.backups.after',
  'server.network.before', 'server.network.after', 'server.startup.before', 'server.startup.after',
  'server.startup.form', 'server.settings.before', 'server.settings.after', 'server.activity.before',
  'server.activity.after',
  'panel.navigation.before', 'panel.navigation.after', 'panel.overview.before', 'panel.overview.after',
  'panel.users.before', 'panel.users.after', 'panel.users.create.before', 'panel.users.create.after',
  'panel.users.detail.before', 'panel.users.detail.after', 'panel.locations.before', 'panel.locations.after',
  'panel.locations.detail.before', 'panel.locations.detail.after',
  'panel.nodes.before', 'panel.nodes.after', 'panel.nodes.create.before', 'panel.nodes.create.after',
  'panel.nodes.detail.before', 'panel.nodes.detail.after', 'panel.nodes.detail.actions',
  'panel.nodes.detail.about.before', 'panel.nodes.detail.about.after', 'panel.nodes.detail.settings.before',
  'panel.nodes.detail.settings.after', 'panel.nodes.detail.configuration.before', 'panel.nodes.detail.configuration.after',
  'panel.nodes.detail.allocations.before', 'panel.nodes.detail.allocations.after', 'panel.nodes.detail.servers.before',
  'panel.nodes.detail.servers.after',
  'panel.servers.before', 'panel.servers.after', 'panel.servers.create.before', 'panel.servers.create.after',
  'panel.servers.detail.before', 'panel.servers.detail.after', 'panel.servers.detail.actions',
  'panel.servers.detail.about.before', 'panel.servers.detail.about.after', 'panel.servers.detail.details.before',
  'panel.servers.detail.details.after', 'panel.servers.detail.build.before', 'panel.servers.detail.build.after',
  'panel.servers.detail.startup.before', 'panel.servers.detail.startup.after', 'panel.servers.detail.databases.before',
  'panel.servers.detail.databases.after', 'panel.servers.detail.mounts.before', 'panel.servers.detail.mounts.after',
  'panel.servers.detail.manage.before', 'panel.servers.detail.manage.after', 'panel.servers.detail.delete.before',
  'panel.servers.detail.delete.after',
  'panel.databaseHosts.before', 'panel.databaseHosts.after', 'panel.databaseHosts.create.before',
  'panel.databaseHosts.create.after', 'panel.databaseHosts.detail.before', 'panel.databaseHosts.detail.after',
  'panel.mounts.before', 'panel.mounts.after', 'panel.mounts.create.before', 'panel.mounts.create.after',
  'panel.mounts.detail.before', 'panel.mounts.detail.after', 'panel.eggs.before', 'panel.eggs.after',
  'panel.eggs.create.before', 'panel.eggs.create.after', 'panel.eggs.detail.before', 'panel.eggs.detail.after',
  'panel.eggs.detail.actions', 'panel.users.detail.actions', 'panel.users.detail.form',
  'panel.eggs.detail.configuration.before', 'panel.eggs.detail.configuration.after', 'panel.eggs.detail.tags.before',
  'panel.eggs.detail.tags.after', 'panel.eggs.detail.variables.before', 'panel.eggs.detail.variables.after',
  'panel.eggs.detail.script.before', 'panel.eggs.detail.script.after', 'panel.tags.before', 'panel.tags.after',
  'panel.activity.before', 'panel.activity.after', 'panel.settings.before', 'panel.settings.after',
  'panel.extensions.before', 'panel.extensions.after', 'panel.apiKeys.before', 'panel.apiKeys.after',
] as const;

export type SlotName = (typeof SLOT_NAMES)[number];

export type Contract =
  | 'none'
  | 'SdkServer'
  | 'RouteSlotData'
  | 'FileManagerSlotData'
  | 'FileRowSlotData'
  | 'StartupFormSlotData'
  | 'SubuserPermissionsSlotData'
  | 'AdminUserFormSlotData'
  | 'admin.node'
  | 'admin.server'
  | 'admin.egg'
  | 'admin.user';

const RESOURCE_ACTION_SLOTS: Record<string, Contract> = {
  'panel.nodes.detail.actions': 'admin.node',
  'panel.servers.detail.actions': 'admin.server',
  'panel.eggs.detail.actions': 'admin.egg',
  'panel.users.detail.actions': 'admin.user',
};

const DATALESS = /^(nav\.items|dashboard|account\.navigation|account\.overview|server\.files|panel\.navigation|panel\.overview)\.(before|after)$/;

/** SlotData<Name>, registry.ts:262-278, checked in the same order. */
export function slotContract(name: SlotName): Contract {
  if (name === 'panel.users.detail.form') return 'AdminUserFormSlotData';
  if (name === 'server.users.permissions.before') return 'SubuserPermissionsSlotData';
  if (name === 'server.startup.form') return 'StartupFormSlotData';
  if (name === 'server.files.toolbar' || name === 'server.files.selectionActions') return 'FileManagerSlotData';
  if (name === 'server.files.rowActions') return 'FileRowSlotData';
  if (RESOURCE_ACTION_SLOTS[name]) return RESOURCE_ACTION_SLOTS[name]!;
  if (name.startsWith('dashboard.serverRow.') || name === 'server.navigation.before' || name === 'server.navigation.after' || name.startsWith('server.console.')) {
    return 'SdkServer';
  }
  if (DATALESS.test(name)) return 'none';
  return 'RouteSlotData';
}

export interface ContractInfo {
  /** The type of the component's props. */
  props: string;
  summary: string;
  fields: string[];
  /** The body of an inline slot component, `({ data }) => ...`. */
  example: string;
}

/** Fields from registry.ts:193-229 and resourceContext.ts. */
export const CONTRACTS: Record<Contract, ContractInfo> = {
  none: {
    props: '{ data?: undefined }',
    summary: 'No data. The slot renders your component without props.',
    fields: [],
    example: '() => <p>Hello from Server Notes</p>',
  },
  SdkServer: {
    props: '{ data: SdkServer }',
    summary: 'The server this spot belongs to, as the Client API returns it.',
    fields: ['attributes.identifier', 'attributes.uuid', 'attributes.name', 'attributes.egg_features', 'attributes.egg_tags'],
    example: '({ data }) => <p>{data.attributes.name}</p>',
  },
  RouteSlotData: {
    props: '{ data: RouteSlotData }',
    summary: 'The current route.',
    fields: ['pathname: string', 'search: unknown', 'params: Record<string, string>'],
    example: '({ data }) => <p>{data.pathname}</p>',
  },
  FileManagerSlotData: {
    props: '{ data: FileManagerSlotData }',
    summary: 'The file manager: its server, directory, listing and selection, with callbacks that act on the native view.',
    fields: ['server', 'directory', 'files', 'selectedFiles', 'isFetching', 'setSelectedFiles(names)', 'refresh()'],
    example: '({ data }) => <span>{data.selectedFiles.length} selected</span>',
  },
  FileRowSlotData: {
    props: '{ data: FileRowSlotData }',
    summary: 'Everything the file manager passes, plus the row\'s own file.',
    fields: ['file', 'server', 'directory', 'files', 'selectedFiles', 'isFetching', 'setSelectedFiles(names)', 'refresh()'],
    example: '({ data }) => <span>{data.file.attributes.name}</span>',
  },
  StartupFormSlotData: {
    props: '{ data: StartupFormSlotData }',
    summary: 'The startup configuration, with a Docker image setter that checks the user\'s permission.',
    fields: ['server', 'configuration', 'isPending', 'canChangeDockerImage', 'setDockerImage(image)', 'refresh()'],
    example: "({ data }) => (data.canChangeDockerImage ? <p>You can change the image.</p> : null)",
  },
  SubuserPermissionsSlotData: {
    props: '{ data: SubuserPermissionsSlotData }',
    summary: 'The permission editor\'s state, and a setter that changes the selection.',
    fields: ["mode: 'create' | 'edit'", 'selectedPermissions', 'editablePermissions', 'disabled', 'setPermissions(permissions)'],
    example: '({ data }) => <p>{data.selectedPermissions.length} permissions selected</p>',
  },
  AdminUserFormSlotData: {
    props: '{ data: AdminUserFormSlotData }',
    summary: 'The user being edited and the native form. Fields you add save with the Panel\'s own Save Changes.',
    fields: ["kind: 'admin.user'", 'resource', 'form'],
    example:
      '({ data }) => (\n        <data.form.AppField name="username">\n            {(field) => <field.TextField label="Managed username" />}\n        </data.form.AppField>\n    )',
  },
  'admin.node': {
    props: "{ data: { kind: 'admin.node'; resource: AdminNodeResource } }",
    summary: 'The node on this detail page.',
    fields: ["kind: 'admin.node'", 'resource.attributes'],
    example: '({ data }) => <span>{data.resource.attributes.fqdn}</span>',
  },
  'admin.server': {
    props: "{ data: { kind: 'admin.server'; resource: AdminServerResource } }",
    summary: 'The server on this detail page.',
    fields: ["kind: 'admin.server'", 'resource.attributes'],
    example: '({ data }) => <span>{data.resource.attributes.name}</span>',
  },
  'admin.egg': {
    props: "{ data: { kind: 'admin.egg'; resource: AdminEggResource } }",
    summary: 'The egg on this detail page.',
    fields: ["kind: 'admin.egg'", 'resource.attributes'],
    example: '({ data }) => <span>{data.resource.attributes.name}</span>',
  },
  'admin.user': {
    props: "{ data: { kind: 'admin.user'; resource: AdminUserResource } }",
    summary: 'The user on this detail page.',
    fields: ["kind: 'admin.user'", 'resource.attributes'],
    example: '({ data }) => <span>{data.resource.attributes.username}</span>',
  },
};

export function slotSnippet(name: SlotName): string {
  return [
    "import { definePterodactylExtension } from '@pterodactyl/sdk';",
    '',
    'export default definePterodactylExtension({',
    '    setup({ slots }) {',
    `        slots.register('${name}', ${CONTRACTS[slotContract(name)].example.replace(/\n/g, '\n    ')});`,
    '    },',
    '});',
  ].join('\n');
}

export type ScreenScope = 'server' | 'account' | 'admin' | 'admin.node' | 'admin.server' | 'admin.egg' | 'admin.user';

/** URL roots: the area routes and ResourceExtensionTabs basePath values. */
export const SCREEN_ROOTS: Record<ScreenScope, string> = {
  server: '/server/{id}',
  account: '/account',
  admin: '/panel',
  'admin.node': '/panel/nodes/{id}',
  'admin.server': '/panel/servers/{id}',
  'admin.egg': '/panel/eggs/{eggId}',
  'admin.user': '/panel/users/{id}',
};

export function screenSnippets(scope: ScreenScope, id: string, label: string, path: string): { manifest: string; setup: string; component: string } {
  const isTab = scope.startsWith('admin.');
  const area = isTab ? 'admin' : scope;
  const manifest = [
    '"ui": {',
    '    "entry": "dist/client.js",',
    '    "screens": [',
    '        {',
    `            "id": "${id}",`,
    `            "area": "${area}",`,
    ...(isTab ? [`            "parent": "${scope}",`] : []),
    `            "path": "${path}",`,
    `            "nav": { "label": "${label}" }`,
    '        }',
    '    ]',
    '}',
  ].join('\n');
  const setup = [
    'setup({ screens }) {',
    `    screens.register('${id}', () => import('./screens/${pascal(id)}Screen'));`,
    '}',
  ].join('\n');
  const body =
    scope === 'server'
      ? [
          "import { ServerContentBlock, useCurrentServerRequired } from '@pterodactyl/sdk';",
          '',
          `export default function ${pascal(id)}Screen() {`,
          '    const server = useCurrentServerRequired();',
          `    return <ServerContentBlock title={'${label}'}>{server.attributes.name}</ServerContentBlock>;`,
          '}',
        ]
      : isTab
        ? [
            "import { useCurrentResource } from '@pterodactyl/sdk';",
            '',
            `export default function ${pascal(id)}Screen() {`,
            '    const current = useCurrentResource();',
            `    if (current?.kind !== '${scope}') return null;`,
            `    return <p>{current.resource.attributes.${scope === 'admin.user' ? 'username' : 'name'}}</p>;`,
            '}',
          ]
        : [
            "import type { ScreenComponentProps } from '@pterodactyl/sdk';",
            '',
            `export default function ${pascal(id)}Screen({ data }: ScreenComponentProps) {`,
            '    return <p>{data.pathname}</p>;',
            '}',
          ];
  return { manifest, setup, component: body.join('\n') };
}

function pascal(id: string): string {
  return id.replace(/(^|-)([a-z])/g, (_match, _dash, char: string) => char.toUpperCase());
}

/** tableTypes.ts */
export const TABLES = {
  'admin.nodes': { row: 'AdminNodeResource', field: 'fqdn' },
  'admin.servers': { row: 'AdminServerResource', field: 'identifier' },
  'admin.eggs': { row: 'AdminEggResource', field: 'author' },
} as const;

export type TableName = keyof typeof TABLES;

export function columnSnippet(table: TableName): string {
  return [
    'setup({ columns }) {',
    `    columns.register('${table}', {`,
    "        id: 'notes',",
    "        label: 'Notes',",
    `        component: ({ data }) => <span>{data.attributes.${TABLES[table].field}}</span>,`,
    '    });',
    '}',
  ].join('\n');
}

/** componentTypes.ts: models and native parts. */
export const COMPONENTS = {
  'dashboard.serverCard': { model: 'ServerCardModel', parts: ['identity', 'address', 'metrics'] },
  'server.files.details': { model: 'FileDetailsModel', parts: ['icon', 'name', 'size', 'modified'] },
  'server.files.manager': { model: 'FileManagerModel', parts: ['toolbar', 'list', 'selection'] },
} as const;

export type ComponentName = keyof typeof COMPONENTS;

export function componentSnippets(name: ComponentName): { manifest: string; setup: string; component: string } {
  const file = name === 'dashboard.serverCard' ? 'ServerCard' : name === 'server.files.details' ? 'FileDetails' : 'FileManager';
  const body: Record<ComponentName, string[]> = {
    'dashboard.serverCard': [
      `export default function ${file}({ model, Default }: ReplacementProps<'${name}'>) {`,
      "    if (model.state.kind === 'unavailable') return <p>{model.name}: {model.state.reason}</p>;",
      '    return <Default />;',
      '}',
    ],
    'server.files.details': [
      `function Name({ model }: ComponentPartProps<'${name}'>) {`,
      '    return <span>{model.name}</span>;',
      '}',
      '',
      `export default function ${file}({ Default }: ReplacementProps<'${name}'>) {`,
      '    return <Default parts={{ name: Name }} />;',
      '}',
    ],
    'server.files.manager': [
      `export default function ${file}({ model, parts }: ReplacementProps<'${name}'>) {`,
      '    return (',
      '        <>',
      '            <parts.toolbar model={model} />',
      '            <p>{model.entries.length} entries in {model.directory}</p>',
      '        </>',
      '    );',
      '}',
    ],
  };
  return {
    manifest: ['"requires": { "sdk": "^2.0.0-beta.4" },', '"ui": {', '    "entry": "dist/client.js",', `    "components": ["${name}"]`, '}'].join('\n'),
    setup: ['setup({ components }) {', `    components.replace('${name}', { load: () => import('./${file}') });`, '}'].join('\n'),
    component: [
      name === 'server.files.details'
        ? "import type { ComponentPartProps, ReplacementProps } from '@pterodactyl/sdk';"
        : "import type { ReplacementProps } from '@pterodactyl/sdk';",
      '',
      ...body[name],
    ].join('\n'),
  };
}
