/**
 * The structure, defaults and notes behind <WingsConfigExplorer />.
 *
 * Keys, order and defaults follow Wings' config/config.go and
 * config/config_docker.go (the `yaml` and `default` struct tags). The keys the
 * Panel writes follow Node::getConfiguration() in the Panel.
 */

export type Scalar = string | number | boolean;
type Value = Scalar | readonly Scalar[] | Readonly<Record<string, Scalar>>;

interface Leaf {
  key: string;
  value: Value;
  secret?: boolean;
  /** Shown after list items, for values the reader has to replace. */
  comment?: string;
}

interface Branch {
  key: string;
  children: Entry[];
}

type Entry = Leaf | Branch;

export interface Line {
  /** Unique per line: the dotted path, with an index or key for list and map items. */
  id: string;
  /** The dotted path the notes are looked up by. */
  path: string;
  depth: number;
  key?: string;
  value?: Scalar;
  /** `[]` or `{}` for empty collections. */
  empty?: '[]' | '{}';
  item?: boolean;
  secret?: boolean;
  comment?: string;
  /** The line as plain text, used to find lines that changed. */
  text: string;
}

export interface ConfigOptions {
  view: 'disk' | 'panel';
  remote: string;
  fqdn: string;
  ssl: boolean;
  proxy: boolean;
  apiPort: number;
  sftpPort: number;
}

export const DEFAULT_FQDN = 'node.example.com';
export const DEFAULT_API_PORT = 8080;
export const DEFAULT_SFTP_PORT = 2022;
export const PROXY_EXAMPLE = '192.0.2.10';

const leaf = (key: string, value: Value, extra: Partial<Leaf> = {}): Leaf => ({ key, value, ...extra });
const branch = (key: string, children: Entry[]): Branch => ({ key, children });

function tree(o: ConfigOptions): Entry[] {
  const fqdn = (o.fqdn || DEFAULT_FQDN).toLowerCase();
  const ssl = branch('ssl', [
    // The Panel writes `enabled` only when the node uses SSL and is not behind a proxy.
    leaf('enabled', o.ssl && !o.proxy),
    leaf('cert', `/etc/letsencrypt/live/${fqdn}/fullchain.pem`),
    leaf('key', `/etc/letsencrypt/live/${fqdn}/privkey.pem`),
  ]);
  const identity = [
    leaf('uuid', '5b8f1c2e-7d4a-4f3b-9e6a-2c1d0b9a8f7e'),
    leaf('token_id', 'secret', { secret: true }),
    leaf('token', 'secret', { secret: true }),
  ];

  if (o.view === 'panel') {
    return [
      leaf('debug', false),
      ...identity,
      branch('api', [leaf('host', '0.0.0.0'), leaf('port', o.apiPort), ssl, leaf('upload_limit', 100)]),
      branch('system', [leaf('data', '/var/lib/pterodactyl/volumes'), branch('sftp', [leaf('bind_port', o.sftpPort)])]),
      leaf('allowed_mounts', []),
      leaf('remote', o.remote),
    ];
  }

  return [
    leaf('debug', false),
    leaf('app_name', 'Pterodactyl'),
    ...identity,
    branch('api', [
      leaf('host', '0.0.0.0'),
      leaf('port', o.apiPort),
      ssl,
      leaf('disable_remote_download', false),
      leaf('upload_limit', 100),
      leaf('trusted_proxies', o.proxy ? [PROXY_EXAMPLE] : [], { comment: o.proxy ? "your proxy's address" : undefined }),
    ]),
    branch('system', [
      leaf('root_directory', '/var/lib/pterodactyl'),
      leaf('log_directory', '/var/log/pterodactyl'),
      leaf('data', '/var/lib/pterodactyl/volumes'),
      leaf('archive_directory', '/var/lib/pterodactyl/archives'),
      leaf('backup_directory', '/var/lib/pterodactyl/backups'),
      leaf('tmp_directory', '/tmp/pterodactyl'),
      leaf('username', 'pterodactyl'),
      leaf('timezone', 'UTC'),
      branch('user', [
        branch('rootless', [leaf('enabled', false), leaf('container_uid', 0), leaf('container_gid', 0)]),
        leaf('uid', 999),
        leaf('gid', 999),
      ]),
      branch('passwd', [leaf('enabled', false), leaf('directory', '/run/wings/etc')]),
      branch('machine_id', [leaf('enabled', true), leaf('directory', '/run/wings/machine-id')]),
      leaf('disk_check_interval', 150),
      leaf('activity_send_interval', 60),
      leaf('activity_send_count', 100),
      leaf('check_permissions_on_boot', true),
      leaf('enable_log_rotate', true),
      leaf('websocket_log_count', 150),
      branch('sftp', [leaf('bind_address', '0.0.0.0'), leaf('bind_port', o.sftpPort), leaf('read_only', false)]),
      branch('crash_detection', [leaf('enabled', true), leaf('detect_clean_exit_as_crash', true), leaf('timeout', 60)]),
      branch('backups', [leaf('write_limit', 0), leaf('compression_level', 'best_speed'), leaf('restore_host_allowlist', [])]),
      branch('transfers', [leaf('download_limit', 0)]),
      leaf('openat_mode', 'auto'),
    ]),
    branch('docker', [
      branch('network', [
        leaf('interface', '172.18.0.1'),
        leaf('dns', ['1.1.1.1', '1.0.0.1']),
        leaf('name', 'pterodactyl_nw'),
        leaf('ispn', false),
        leaf('driver', 'bridge'),
        leaf('network_mode', 'pterodactyl_nw'),
        leaf('is_internal', false),
        leaf('enable_icc', true),
        leaf('network_mtu', 1500),
        branch('interfaces', [
          branch('v4', [leaf('subnet', '172.18.0.0/16'), leaf('gateway', '172.18.0.1')]),
          branch('v6', [leaf('subnet', 'fdba:17c8:6c94::/64'), leaf('gateway', 'fdba:17c8:6c94::1011')]),
        ]),
      ]),
      leaf('domainname', ''),
      leaf('registries', {}),
      leaf('tmpfs_size', 100),
      leaf('container_pid_limit', 512),
      branch('installer_limits', [leaf('memory', 1024), leaf('cpu', 100)]),
      leaf('cpu_period', 100000),
      branch('cpu_burst', [leaf('enabled', true), leaf('percent', 100)]),
      leaf('cpu_shares', 0),
      branch('overhead', [leaf('override', false), leaf('default_multiplier', 1.05), leaf('multipliers', {})]),
      leaf('use_performant_inspect', true),
      leaf('userns_mode', ''),
      branch('log_config', [
        leaf('type', 'local'),
        leaf('config', { compress: 'false', 'max-file': '1', 'max-size': '5m', mode: 'non-blocking' }),
      ]),
    ]),
    branch('throttles', [leaf('enabled', true), leaf('lines', 2000), leaf('line_reset_interval', 100)]),
    leaf('remote', o.remote),
    branch('remote_query', [leaf('timeout', 30), leaf('boot_servers_per_page', 50)]),
    leaf('allowed_mounts', []),
    leaf('allowed_origins', []),
    leaf('allow_cors_private_network', false),
    leaf('ignore_panel_config_updates', false),
  ];
}

/** How Wings' YAML library writes a scalar: strings that would read as something else get quotes. */
export function formatScalar(value: Scalar): string {
  if (typeof value !== 'string') return String(value);
  if (
    value === '' ||
    /^(true|false|yes|no|on|off|y|n|null|~)$/i.test(value) ||
    /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(value) ||
    /^[\s\-?:,[\]{}#&*!|>'"%@`]|\s$|: | #/.test(value)
  ) {
    return JSON.stringify(value);
  }
  return value;
}

function flatten(entries: Entry[], depth = 0, parent = ''): Line[] {
  const lines: Line[] = [];
  const pad = '  '.repeat(depth);

  for (const entry of entries) {
    const path = parent ? `${parent}.${entry.key}` : entry.key;

    if ('children' in entry) {
      lines.push({ id: path, path, depth, key: entry.key, text: `${pad}${entry.key}:` });
      lines.push(...flatten(entry.children, depth + 1, path));
      continue;
    }

    const { value } = entry;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push({ id: path, path, depth, key: entry.key, empty: '[]', text: `${pad}${entry.key}: []` });
        continue;
      }
      lines.push({ id: path, path, depth, key: entry.key, text: `${pad}${entry.key}:` });
      // Wings' YAML library writes list items at the same indentation as their key.
      value.forEach((item, i) => {
        lines.push({ id: `${path}[${i}]`, path, depth, value: item, item: true, comment: entry.comment, text: `${pad}- ${formatScalar(item)}` });
      });
      continue;
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value).sort();
      if (keys.length === 0) {
        lines.push({ id: path, path, depth, key: entry.key, empty: '{}', text: `${pad}${entry.key}: {}` });
        continue;
      }
      lines.push({ id: path, path, depth, key: entry.key, text: `${pad}${entry.key}:` });
      for (const k of keys) {
        const v = (value as Record<string, Scalar>)[k];
        lines.push({ id: `${path}.${k}`, path, depth: depth + 1, key: k, value: v, text: `${'  '.repeat(depth + 1)}${k}: ${formatScalar(v)}` });
      }
      continue;
    }

    const shown = entry.secret ? '<secret>' : formatScalar(value as Scalar);
    lines.push({ id: path, path, depth, key: entry.key, value: value as Scalar, secret: entry.secret, text: `${pad}${entry.key}: ${shown}` });
  }

  return lines;
}

export function buildConfig(options: ConfigOptions): Line[] {
  return flatten(tree(options));
}

/* ------------------------------------------------------------------------ *
 * Notes for each key. `def` is the default from Wings' struct tags, or who
 * sets the value. Text may use `code spans`.
 * ------------------------------------------------------------------------ */

export interface KeyDoc {
  what: string;
  def?: string;
  change?: string;
  breaks?: string;
  /** The Panel's Configuration tab and auto-deploy command include this key. */
  panel?: boolean;
  secret?: boolean;
}

const BY_PANEL = 'Set by the Panel';

export const DOCS: Record<string, KeyDoc> = {
  debug: {
    what: 'Turns on debug logging.',
    def: '`false`',
    change: 'While you track down a problem. `wings --debug` does the same for one run without saving it to this file.',
    breaks: 'Nothing breaks, but the log grows much faster.',
    panel: true,
  },
  app_name: {
    what: 'The name in front of Wings\' own console messages, as in `[Pterodactyl Daemon]: Updating process configuration files...`.',
    def: '`Pterodactyl`',
    change: 'To show your own name in the console. Restart Wings afterwards.',
  },
  uuid: {
    what: 'The node\'s unique ID in the Panel.',
    def: BY_PANEL,
    change: 'Never. It comes from the Panel together with the tokens.',
    panel: true,
  },
  token_id: {
    what: 'Tells the Panel which node is calling. Wings sends it with every request to the Panel, together with `token`.',
    def: BY_PANEL,
    change: 'Only by running a new auto-deploy command, or by copying the file from the node\'s Configuration tab again. The `WINGS_TOKEN_ID` environment variable overrides this value.',
    breaks: 'The Panel answers `You are not authorized to access this resource.` with a 403, and Wings stops at boot with `failed to load server configurations`.',
    panel: true,
    secret: true,
  },
  token: {
    what: 'The secret Wings and the Panel share. The Panel sends it when it calls Wings, Wings sends it when it calls the Panel, and the Panel signs the console\'s login tokens with it.',
    def: BY_PANEL,
    change: 'Same as `token_id`. To keep it out of this file, write `file:///path/to/file` to read it from a file, or `${NAME}` to read an environment variable. `WINGS_TOKEN` overrides it.',
    breaks: 'Requests in both directions fail with a 403, and the console shows "Server connection rejected".',
    panel: true,
    secret: true,
  },
  api: {
    what: 'Wings\' HTTP API. The Panel calls it to manage servers, and browsers connect to it directly for the console and for file uploads and downloads.',
  },
  'api.host': {
    what: 'The address the API listens on. `0.0.0.0` means every IPv4 address on the node.',
    def: '`0.0.0.0`',
    change: 'To listen on one address only.',
    breaks: 'With `127.0.0.1`, nothing outside the node can reach Wings: the Panel cannot manage it and the console cannot connect.',
    panel: true,
  },
  'api.port': {
    what: 'The port the API listens on. The Panel calls Wings at the node\'s FQDN and this port, and the console connects to the same place.',
    def: '`8080`',
    change: 'Change the node\'s Daemon Port in the Panel. The Panel sends the new port to Wings, which starts using it after a restart. Open the port in the firewall.',
    breaks: 'If it differs from the Panel\'s Daemon Port, the Panel shows "Could not establish a connection to the machine running this server." If another program holds the port, Wings stops with `address already in use`.',
    panel: true,
  },
  'api.ssl': {
    what: 'HTTPS for the API. The certificate must be valid for the node\'s FQDN.',
    panel: true,
  },
  'api.ssl.enabled': {
    what: 'Serves the API over HTTPS, using `cert` and `key`.',
    def: '`false`. The Panel writes `true` when the node has Communicate Over SSL on and Behind Proxy off.',
    change: 'Through the node\'s settings in the Panel, so both sides agree on the scheme.',
    breaks: 'If the Panel uses HTTPS and this is `false`, browsers block the console. If it is `true` and the certificate files are missing, Wings stops with `failed to configure HTTPS server`.',
    panel: true,
  },
  'api.ssl.cert': {
    what: 'The certificate, with its chain, that Wings serves.',
    def: 'Set by the Panel to `/etc/letsencrypt/live/<FQDN>/fullchain.pem`',
    change: 'If your certificate is stored somewhere else. When the Panel sends a new configuration, Wings keeps the paths it already has, even if you changed the node\'s FQDN, so update them here by hand.',
    breaks: 'A missing file stops Wings at boot. An expired certificate makes the Panel fail with cURL error 60. Wings reads the file when it starts, so restart it after a renewal.',
    panel: true,
  },
  'api.ssl.key': {
    what: 'The private key that belongs to `cert`.',
    def: 'Set by the Panel to `/etc/letsencrypt/live/<FQDN>/privkey.pem`',
    change: 'Together with `cert`.',
    breaks: 'A missing key, or one that does not match the certificate, stops Wings with `failed to configure HTTPS server`.',
    panel: true,
  },
  'api.disable_remote_download': {
    what: 'Turns off the file manager\'s option to download a file from a URL straight into a server.',
    def: '`false`',
    change: 'If servers should not fetch files from the internet through Wings.',
    breaks: 'With `true`, those downloads fail with "This functionality is not currently enabled on this instance."',
  },
  'api.upload_limit': {
    what: 'The largest file, in MB, that users may upload through the Panel\'s file manager.',
    def: '`100`, or the node\'s Upload Size Limit from the Panel',
    change: 'In the node\'s settings in the Panel, which sends the new value to Wings when you save.',
    breaks: 'Larger uploads are refused.',
    panel: true,
  },
  'api.trusted_proxies': {
    what: 'Proxies that may tell Wings the real client address with an `X-Forwarded-For` header. Wings records that address in the activity log for console commands and file uploads.',
    def: '`[]` (none)',
    change: 'When Wings is behind a reverse proxy. The Panel never writes this key, so add it yourself.',
    breaks: 'Without it, the activity log shows the proxy\'s address for everyone. An entry that is not a valid IP address or range stops Wings at boot.',
  },
  system: {
    what: 'Where Wings keeps its files, and how it treats the servers it runs.',
  },
  'system.root_directory': {
    what: 'Wings\' own data, such as its `wings.db` database and the last known state of each server.',
    def: '`/var/lib/pterodactyl`',
  },
  'system.log_directory': {
    what: 'Where Wings writes `wings.log`, and the logs of server installations under `install/`.',
    def: '`/var/log/pterodactyl`',
  },
  'system.data': {
    what: 'Where server files live, in one directory per server named after its UUID. Wings\' SFTP host key is kept here too, under `.sftp/`.',
    def: '`/var/lib/pterodactyl/volumes`, or the node\'s Daemon Base Path from the Panel',
    change: '`wings configure` does not copy this value from the Panel. If you set a different Daemon Base Path, set it here by hand. Move existing server directories before you change it.',
    breaks: 'Servers whose files are still at the old path appear empty.',
    panel: true,
  },
  'system.archive_directory': {
    what: 'Temporary archives for server transfers between nodes.',
    def: '`/var/lib/pterodactyl/archives`',
  },
  'system.backup_directory': {
    what: 'Where backups are stored when the Panel uses the `wings` backup driver, which is the default.',
    def: '`/var/lib/pterodactyl/backups`',
    change: 'To keep backups on another disk.',
  },
  'system.tmp_directory': {
    what: 'Scratch space for server installation scripts.',
    def: '`/tmp/pterodactyl`',
  },
  'system.username': {
    what: 'The system user that owns server files. Containers run with this user\'s IDs. Wings creates the user if it does not exist.',
    def: '`pterodactyl`',
  },
  'system.timezone': {
    what: 'The time zone Wings passes to every container. Wings detects it from the `TZ` variable, `/etc/timezone` or `timedatectl`, and falls back to `UTC`.',
    def: 'Detected when Wings starts',
    change: 'If servers show the wrong time. Use a name such as `Europe/Berlin`.',
    breaks: 'An unknown name stops Wings at boot with `the supplied timezone ... is invalid`.',
  },
  'system.user': {
    what: 'The user and group IDs of `username`. Wings fills these in every time it starts, so editing them has no effect.',
  },
  'system.user.rootless': {
    what: 'For Docker in rootless mode. Wings then skips creating `username`, uses the user it runs as, and runs containers as `container_uid:container_gid`.',
    def: '`enabled: false`, `container_uid: 0`, `container_gid: 0`',
  },
  'system.passwd': {
    what: 'Mounts generated `/etc/passwd` and `/etc/group` files into containers, so the user a container runs as has an entry in them.',
    def: '`enabled: false`, `directory: /run/wings/etc`',
  },
  'system.machine_id': {
    what: 'Mounts a separate `/etc/machine-id` file into each server\'s container. Some games, such as Hytale, need one.',
    def: '`enabled: true`, `directory: /run/wings/machine-id`',
  },
  'system.disk_check_interval': {
    what: 'How long, in seconds, Wings reuses a server\'s measured disk usage before it measures again.',
    def: '`150`',
    change: '`0` turns disk checking off, and every server then reports 0 bytes used.',
    breaks: 'Low values make Wings rescan every server\'s files often, which costs a lot of disk I/O and CPU.',
  },
  'system.activity_send_interval': {
    what: 'How often, in seconds, Wings sends the activity it collected, such as SFTP actions and console commands, to the Panel\'s activity log.',
    def: '`60`',
  },
  'system.activity_send_count': {
    what: 'The most activity entries Wings sends in one batch.',
    def: '`100`',
  },
  'system.check_permissions_on_boot': {
    what: 'Before a server starts, Wings makes sure `username` owns all of its files.',
    def: '`true`',
    change: 'Turn it off if servers with very many files take long to start at "Ensuring file permissions are set correctly".',
    breaks: 'With `false`, files changed by other tools may keep an owner the server cannot write as.',
  },
  'system.enable_log_rotate': {
    what: 'Writes `/etc/logrotate.d/wings` at startup if it does not exist, so `wings.log` does not grow forever.',
    def: '`true`',
  },
  'system.websocket_log_count': {
    what: 'How many lines of earlier console output a browser receives when it opens the console.',
    def: '`150`',
  },
  'system.sftp': {
    what: 'Wings\' built-in SFTP server. Users sign in with their Panel account.',
  },
  'system.sftp.bind_address': {
    what: 'The address the SFTP server listens on.',
    def: '`0.0.0.0`',
  },
  'system.sftp.bind_port': {
    what: 'The port the SFTP server listens on. The Panel shows it to users under SFTP Details.',
    def: '`2022`',
    change: 'Change the node\'s Daemon SFTP Port in the Panel, and open the port in the firewall.',
    breaks: 'If it differs from the Panel, users are told the wrong port. If the port is taken, Wings stops with `failed to initialize the sftp server`.',
    panel: true,
  },
  'system.sftp.read_only': {
    what: 'Refuses every change over SFTP: uploads, edits, renames and deletes.',
    def: '`false`',
  },
  'system.crash_detection': {
    what: 'What Wings does when a server stops without anyone pressing Stop.',
  },
  'system.crash_detection.enabled': {
    what: 'Restarts servers automatically after a crash.',
    def: '`true`',
    change: 'Set it to `false` if crashed servers should stay stopped.',
  },
  'system.crash_detection.detect_clean_exit_as_crash': {
    what: 'Also treats a server that exits with code 0 as crashed.',
    def: '`true`',
    change: 'Set it to `false` if servers stop cleanly on their own, for example with an in-game command, and should stay stopped.',
  },
  'system.crash_detection.timeout': {
    what: 'If a server crashes again within this many seconds, Wings does not restart it, so a broken server cannot loop forever.',
    def: '`60`',
    change: '`0` always restarts the server, which can leave it in a restart loop.',
  },
  'system.backups': {
    what: 'How Wings writes backups.',
  },
  'system.backups.write_limit': {
    what: 'The fastest Wings writes a backup to disk, in MiB/s. Every backup is written locally first, so this applies to S3 backups too. `0` means no limit.',
    def: '`0`',
  },
  'system.backups.compression_level': {
    what: '`none`, `best_speed` (gzip level 1) or `best_compression` (gzip level 9).',
    def: '`best_speed`',
    change: '`best_compression` saves disk space and costs CPU time.',
  },
  'system.backups.restore_host_allowlist': {
    what: 'Host names, IP addresses or ranges that backup restores may download from even though they are private or internal. Wings blocks those otherwise.',
    def: '`[]`',
  },
  'system.transfers': {
    what: 'Server transfers between nodes.',
  },
  'system.transfers.download_limit': {
    what: 'The fastest this node downloads a transferred server\'s archive, in MiB/s. `0` means no limit.',
    def: '`0`',
  },
  'system.openat_mode': {
    what: 'How Wings opens files inside server directories: `openat2`, `openat`, or `auto` to detect what the kernel supports.',
    def: '`auto`',
    change: 'Leave it on `auto`.',
  },
  docker: {
    what: 'How Wings runs server containers. Container settings apply the next time each server starts.',
  },
  'docker.network': {
    what: 'The Docker network server containers join. Wings creates it at startup if it does not exist, and leaves an existing one as it is.',
  },
  'docker.network.interface': {
    what: 'The network\'s gateway address on the host. Wings maps allocations on `127.0.0.1` to this address, and sets `SERVER_IP` to it for those servers.',
    def: '`172.18.0.1`. Wings sets it to the IPv4 gateway when it creates the network.',
  },
  'docker.network.dns': {
    what: 'The DNS servers every container uses.',
    def: '`1.1.1.1` and `1.0.0.1`',
    change: 'If your host blocks these. Use the DNS servers your host uses, then restart Wings and the server.',
    breaks: 'Servers cannot resolve domain names, so install scripts fail to download files.',
  },
  'docker.network.name': {
    what: 'The name of the Docker network.',
    def: '`pterodactyl_nw`',
    change: 'Set it and `network_mode` to `host` to give containers the host\'s network directly.',
    breaks: '`host` removes Docker\'s network isolation: any server can bind any address and port on the node, not only its own allocations.',
  },
  'docker.network.ispn': {
    what: 'Wings sets this itself from the network\'s driver.',
    def: '`false`',
    change: 'Do not edit it.',
  },
  'docker.network.driver': {
    what: 'The driver Wings uses when it creates the network. At startup, Wings records the driver of the existing network here.',
    def: '`bridge`',
  },
  'docker.network.network_mode': {
    what: 'The network each container joins.',
    def: '`pterodactyl_nw`',
  },
  'docker.network.is_internal': {
    what: 'Creates the network without access to the outside world. Only used when Wings creates the network.',
    def: '`false`',
  },
  'docker.network.enable_icc': {
    what: 'Lets containers on the network reach each other.',
    def: '`true`',
  },
  'docker.network.network_mtu': {
    what: 'The MTU of the network\'s bridge, `pterodactyl0`.',
    def: '`1500`',
    change: 'Match it to the host\'s network if that uses a smaller MTU.',
  },
  'docker.network.interfaces': {
    what: 'The network\'s IPv4 and IPv6 subnets and gateways. Wings only uses them when it creates the network.',
    def: '`172.18.0.0/16` via `172.18.0.1`, and `fdba:17c8:6c94::/64` via `fdba:17c8:6c94::1011`',
    change: 'If the subnet overlaps a network you already use. Stop Wings, remove the network with `docker network rm pterodactyl_nw`, and start Wings so it creates a new one.',
  },
  'docker.domainname': {
    what: 'The domain name set inside every container.',
    def: 'empty',
  },
  'docker.registries': {
    what: 'Logins for private image registries, keyed by the registry\'s address, each with a `username` and `password`. Wings uses the entry that matches the image it pulls.',
    def: '`{}`',
  },
  'docker.tmpfs_size': {
    what: 'The size of `/tmp` in each container, in MB. It uses the host\'s memory, and Wings does not count it toward the server\'s limit.',
    def: '`100`',
  },
  'docker.container_pid_limit': {
    what: 'The most processes a container may run at once, so one server cannot use up the node\'s process IDs.',
    def: '`512`',
    change: 'Raise it if a server needs more threads. `0` removes the limit, which we do not recommend on shared nodes.',
  },
  'docker.installer_limits': {
    what: 'Memory (MB) and CPU (%) for installation containers. Wings uses whichever is higher: these, or the server\'s own limits.',
    def: '`memory: 1024`, `cpu: 100`',
  },
  'docker.cpu_period': {
    what: 'The length of the kernel\'s CPU scheduling window, in microseconds, for servers with a CPU limit. Their limits scale with it, so they stay the same.',
    def: '`100000`',
    change: 'A shorter period makes throttling less bursty, at the cost of some scheduler overhead. Wings keeps it between `1000` and `1000000`.',
  },
  'docker.cpu_burst': {
    what: 'Lets a server save unused CPU time and spend it on short spikes, up to `percent` of its limit. Needs Linux 5.14 or newer, and is skipped otherwise.',
    def: '`enabled: true`, `percent: 100`',
  },
  'docker.cpu_shares': {
    what: 'How much CPU a server with a CPU limit gets, relative to everything else, when the node is fully busy. `0` uses Docker\'s default.',
    def: '`0`',
    change: '`1024` restores what older versions of Wings did, which favors the host\'s own services under full load.',
  },
  'docker.overhead': {
    what: 'Extra memory Docker allows above a server\'s limit, because programs like Java use more than their configured heap. Unless `override` is on, Wings adds 15% for servers up to 2048 MB, 10% up to 4096 MB, and 5% above that.',
    def: '`override: false`, `default_multiplier: 1.05`',
    change: 'Set `override: true` and list your own steps under `multipliers`, such as `2048: 1.15`.',
  },
  'docker.use_performant_inspect': {
    what: 'Reads container details from Docker in a faster way.',
    def: '`true`',
    change: 'Leave it on.',
  },
  'docker.userns_mode': {
    what: 'The user namespace mode for containers when Docker remaps user namespaces. `host` turns remapping off for server containers. Empty uses Docker\'s setting.',
    def: 'empty',
  },
  'docker.log_config': {
    what: 'The Docker logging driver for server containers. Wings reads the console history it sends to new console connections from these logs.',
    def: '`type: local`, 5 MB, one file, not compressed',
    change: 'Leave it unless you know you need another driver.',
  },
  throttles: {
    what: 'Limits how fast a server may print to its console, so a runaway process cannot flood Wings and the browser.',
  },
  'throttles.enabled': {
    what: 'Wings writes this key, but the current version does not read it. Throttling is always on. Raise `lines` to loosen it.',
    def: '`true`',
  },
  'throttles.lines': {
    what: 'How many lines a server may print per `line_reset_interval`. Past that, Wings drops output and prints "Server is outputting console data too quickly -- throttling...".',
    def: '`2000`',
  },
  'throttles.line_reset_interval': {
    what: 'The length of each counting window, in milliseconds.',
    def: '`100`',
  },
  remote: {
    what: 'The Panel\'s address. Wings calls the Panel\'s API here, and only accepts console connections from pages at this exact origin.',
    def: 'Set by the Panel from its `APP_URL`, or by `--panel-url`',
    change: 'If the Panel moves. It must match the address in the browser exactly: same scheme, no trailing slash.',
    breaks: 'If Wings cannot reach it, Wings stops at boot with `failed to load server configurations`. If it does not match the browser\'s address, the console cannot connect.',
    panel: true,
  },
  remote_query: {
    what: 'How Wings talks to the Panel\'s API.',
  },
  'remote_query.timeout': {
    what: 'How many seconds Wings waits for each request to the Panel.',
    def: '`30`',
    change: 'Requests that take longer usually mean the Panel is slow, which is better fixed on the Panel.',
  },
  'remote_query.boot_servers_per_page': {
    what: 'How many servers Wings asks the Panel for per request when it starts.',
    def: '`50`',
    change: 'Leave it. Larger pages can make the Panel run out of memory.',
  },
  allowed_mounts: {
    what: 'Host directories that servers may mount. Wings skips any mount whose source is outside these.',
    def: '`[]`. The Panel\'s Configuration tab lists the node\'s mounts, but `wings configure` does not copy them.',
    change: 'When you create a mount in the Panel. Add its source directory here, then restart Wings.',
    breaks: 'The log shows `skipping custom server mount, not in list of allowed mount points`, and the server starts without it.',
    panel: true,
  },
  allowed_origins: {
    what: 'More browser origins that Wings accepts for the console and for file transfers, besides `remote`. `*` accepts any origin.',
    def: '`[]`',
    change: 'If you open the Panel from more than one address. List each one exactly.',
  },
  allow_cors_private_network: {
    what: 'Sends the header browsers require before a page may call Wings on a private IP address over plain HTTP.',
    def: '`false`',
    change: 'Only if you run Wings without SSL on an internal IP address. Most installations should leave it off.',
  },
  ignore_panel_config_updates: {
    what: 'When you save a node in the Panel, the Panel sends Wings its new configuration. With `true`, Wings ignores it and keeps this file as it is.',
    def: '`false`',
    change: 'If you manage this file with your own tools.',
    breaks: 'Changes in the Panel, such as ports or the upload limit, no longer reach Wings.',
  },
};

/** The note for a path, falling back to the nearest parent that has one. */
export function docFor(path: string): { path: string; doc: KeyDoc } | undefined {
  let current = path;
  while (current) {
    const doc = DOCS[current];
    if (doc) return { path: current, doc };
    const dot = current.lastIndexOf('.');
    current = dot === -1 ? '' : current.slice(0, dot);
  }
  return undefined;
}
