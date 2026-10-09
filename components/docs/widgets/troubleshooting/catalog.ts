/**
 * Known problems for <TroubleshootingMatcher />. Each entry is matched against
 * whatever the reader pastes. To add one, copy an entry and keep to what the
 * Panel or Wings code (or the docs) can back up.
 *
 * Signals are scored: 3 for an exact error string from the code, 2 for a
 * distinctive word, 1 for a hint that only counts alongside others. An entry
 * shows once its score reaches 2. `unless` hides an entry when another, more
 * specific error is present.
 *
 * Text fields may use `code spans`. Commands may use {path} (the Panel's
 * directory), {php} (the PHP version) and {panel} (the Panel's address); the
 * matcher fills them in from the reader's setup.
 */
export interface Signal {
  pattern: RegExp;
  weight: 1 | 2 | 3;
}

export interface Problem {
  id: string;
  title: string;
  /** Where the error shows up. */
  where: string;
  signals: Signal[];
  unless?: RegExp;
  why: string;
  fix: string[];
  commands?: string[];
  link: { href: string; label: string };
}

export interface Example {
  label: string;
  text: string;
}

/** Real messages from the Panel and Wings, for the "Try one" buttons. */
export const EXAMPLES: Example[] = [
  {
    label: 'Panel cannot reach Wings',
    text: 'Could not establish a connection to the machine running this server. Please try again.',
  },
  {
    label: 'Wings stops at boot (HTTPS)',
    text: 'FATAL: [Oct  6 10:15:02.481] failed to configure HTTPS server auto_tls=false error=open /etc/letsencrypt/live/node.example.com/fullchain.pem: no such file or directory',
  },
  {
    label: 'Wings gets a 403',
    text: 'FATAL: [Oct  6 10:15:02.481] failed to load server configurations error=manager: failed to retrieve server configurations: Error response from Panel: AccessDeniedHttpException: You are not authorized to access this resource. (HTTP/403)',
  },
  {
    label: 'Sign-in fails',
    text: 'CSRF token mismatch.',
  },
  {
    label: '502 Bad Gateway',
    text: '502 Bad Gateway',
  },
  {
    label: 'SFTP login refused',
    text: ' WARN: [Oct  6 10:15:02.481] failed to validate user credentials (invalid format) ip=203.0.113.7:51234 method=password subsystem=sftp username=admin',
  },
];

export const PROBLEMS: Problem[] = [
  {
    id: 'panel-cannot-reach-wings',
    title: 'The Panel cannot connect to Wings',
    where: 'Panel',
    signals: [
      { pattern: /Could not establish a connection to the machine running this server/i, weight: 3 },
      { pattern: /error encountered while attempting to automatically update the configuration file on the Daemon/i, weight: 3 },
      { pattern: /There was an error while communicating with the machine running this server/i, weight: 2 },
      { pattern: /cURL error (6|7|28)\b/i, weight: 3 },
      { pattern: /Failed to connect to \S+ port \d+/i, weight: 3 },
      { pattern: /DaemonConnectionException/, weight: 3 },
      { pattern: /Couldn'?t connect to server/i, weight: 2 },
      { pattern: /(Connection|Operation) timed out after/i, weight: 2 },
      { pattern: /Could not resolve host/i, weight: 1 },
    ],
    why: 'The Panel calls Wings at the node\'s FQDN and Daemon Port, using HTTPS when the node uses SSL. cURL error 7 means nothing answered on that port: Wings is stopped, or a firewall rejects the connection. Error 28 means the connection timed out, usually because a firewall drops it. Error 6 means the FQDN does not resolve. If the message says "error while communicating", Wings did answer but failed; find the `request_id` from the message in the Wings log.',
    fix: [
      'Check that Wings is running on the node.',
      'From the Panel\'s server, connect to Wings with the node\'s FQDN and port. Any HTTP response, even an error, means the network path works.',
      'Open the Daemon Port (`8080` by default) and the SFTP port (`2022`) in the node\'s firewall.',
      'If the Panel saved node settings but could not reach Wings, it keeps the change and Wings keeps its old file. Copy the configuration from the node\'s Configuration tab once Wings is reachable.',
    ],
    commands: ['systemctl status wings', 'curl -v https://node.example.com:8080', 'journalctl -u wings -n 50 --no-pager'],
    link: { href: '/v2/panel/troubleshooting#cannot-connect-to-a-server', label: 'Cannot Connect to a Server' },
  },
  {
    id: 'wings-certificate',
    title: 'Wings\' SSL certificate is missing or expired',
    where: 'Wings',
    signals: [
      { pattern: /failed to configure HTTPS server/i, weight: 3 },
      { pattern: /cURL error 60\b/i, weight: 3 },
      { pattern: /SSL certificate problem/i, weight: 3 },
      { pattern: /certificate (has )?expired/i, weight: 3 },
      { pattern: /NET::ERR_CERT_\w+|ERR_CERT_\w+/, weight: 3 },
      { pattern: /letsencrypt\/live\/\S+\.pem/i, weight: 2 },
      { pattern: /cURL error 35\b/i, weight: 2 },
      { pattern: /certificate/i, weight: 1 },
    ],
    why: 'When `api.ssl.enabled` is `true`, Wings loads the files in `api.ssl.cert` and `api.ssl.key` when it starts. The Panel fills those in as `/etc/letsencrypt/live/<FQDN>/fullchain.pem` and `privkey.pem`. If the files do not exist, Wings stops with `failed to configure HTTPS server`. If the certificate has expired, Wings starts, but the Panel (cURL error 60) and browsers refuse it. Wings only reads the certificate at startup, so a renewed certificate needs a restart.',
    fix: [
      'If the node has no certificate yet, create one for its FQDN.',
      'If it expired, renew it and restart Wings.',
      'If your certificate lives somewhere else, point `api.ssl.cert` and `api.ssl.key` at it. Wings keeps custom paths when the Panel sends a configuration update.',
      'If the Panel itself uses plain HTTP, you may turn off SSL for the node instead.',
    ],
    commands: [
      'certbot certonly --standalone -d node.example.com --deploy-hook "systemctl restart wings"',
      'certbot renew && systemctl restart wings',
    ],
    link: { href: '/v2/guides/tutorials/ssl-certificates', label: 'Creating SSL Certificates' },
  },
  {
    id: 'port-in-use',
    title: 'A port is already in use',
    where: 'Wings',
    signals: [
      { pattern: /address already in use/i, weight: 3 },
      { pattern: /port is already allocated/i, weight: 3 },
      { pattern: /driver failed programming external connectivity/i, weight: 3 },
      { pattern: /Bind for \S+ failed/i, weight: 3 },
      { pattern: /failed to initialize the sftp server/i, weight: 2 },
      { pattern: /failed to configure HTTP server/i, weight: 2 },
    ],
    why: 'Two different ports can collide. Wings listens on `api.port` (8080 by default) and `system.sftp.bind_port` (2022); if another program already holds one, Wings stops at boot. A game server publishes each of its allocations as an IP and port on the host through Docker; if another process or container holds that port, Docker refuses to start the server.',
    fix: [
      'Find the process that holds the port. Replace the port number with the one from your error.',
      'Stop that process, or use a different port.',
      'For Wings\' own ports, change them in the node\'s settings in the Panel too, so that both sides agree.',
      'For a game server, assign it a different allocation.',
    ],
    commands: ['ss -tulpn | grep :8080'],
    link: { href: '/v2/wings/configuration#api-and-ssl', label: 'Wings Configuration: API and SSL' },
  },
  {
    id: 'docker-not-running',
    title: 'Wings cannot reach Docker',
    where: 'Wings',
    signals: [
      { pattern: /Cannot connect to the Docker daemon/i, weight: 3 },
      { pattern: /Is the docker daemon running/i, weight: 3 },
      { pattern: /failed to configure docker environment/i, weight: 2 },
      { pattern: /docker\.sock/i, weight: 2 },
      { pattern: /\bdocker\b/i, weight: 1 },
    ],
    why: 'Wings runs every server as a Docker container, and checks for its `pterodactyl_nw` network when it starts. If Docker is not installed or not running, Wings stops at boot, usually with `failed to configure docker environment`.',
    fix: ['Start Docker, and enable it so that it starts on boot.', 'Check that Docker answers, then start Wings again.'],
    commands: ['systemctl enable --now docker', 'docker info', 'systemctl restart wings'],
    link: { href: '/v2/wings/installing#installing-docker', label: 'Installing Docker' },
  },
  {
    id: 'node-token-mismatch',
    title: 'Wings and the Panel disagree on the node\'s token',
    where: 'Wings and Panel',
    signals: [
      { pattern: /Error response from Panel:.*\(HTTP\/40[13]\)/i, weight: 3 },
      { pattern: /You are not authorized to access this (resource|endpoint)/i, weight: 3 },
      { pattern: /The authentication token provided is not valid/i, weight: 3 },
      { pattern: /Server connection rejected/i, weight: 3 },
      { pattern: /error validating the credentials provided for the websocket/i, weight: 3 },
      { pattern: /AccessDeniedHttpException/, weight: 2 },
      { pattern: /\bjwt\b/i, weight: 1 },
    ],
    why: 'Wings and the Panel share two secrets, `token_id` and `token`, from Wings\' `config.yml`. Wings sends both with every request to the Panel, the Panel sends `token` with every request to Wings, and the console\'s login tokens are signed with it. When you reset the token, the Panel sends the new one to Wings. If Wings was unreachable at that moment, or you copied the file from another node, each side rejects the other with a 403, and the console shows "Server connection rejected".',
    fix: [
      'In the Panel, open the node\'s Configuration tab and generate a new auto-deploy command.',
      'Run it on the node with `--override` to replace the old file, then restart Wings.',
    ],
    commands: ['cd /etc/pterodactyl && sudo wings configure --panel-url {panel} --token <token> --node <id> --override', 'systemctl restart wings'],
    link: { href: '/v2/wings/installing#using-the-auto-deploy-command', label: 'Using the Auto-Deploy Command' },
  },
  {
    id: 'wings-cannot-reach-panel',
    title: 'Wings cannot reach the Panel',
    where: 'Wings',
    unless: /\(HTTP\/40[13]\)|not authorized to access/i,
    signals: [
      { pattern: /failed to load server configurations/i, weight: 2 },
      { pattern: /\/api\/remote\//i, weight: 2 },
      { pattern: /dial tcp/i, weight: 2 },
      { pattern: /no such host/i, weight: 2 },
      { pattern: /x509:|tls: failed to verify certificate/i, weight: 2 },
      { pattern: /Client\.Timeout exceeded/i, weight: 2 },
      { pattern: /connect: connection refused/i, weight: 1 },
    ],
    why: 'When Wings starts, it asks the Panel for its servers at `remote` plus `/api/remote/servers`. If it cannot connect, it stops with `failed to load server configurations`. Common causes are a wrong `remote` value, a domain that does not resolve from the node, a firewall, or a Panel certificate the node does not trust (`x509`).',
    fix: [
      'Check that `remote` in `/etc/pterodactyl/config.yml` is the address you open the Panel with.',
      'From the node, connect to that address.',
      'For certificate errors, fix the Panel\'s certificate. `wings --ignore-certificate-errors` skips the check, but use it only to test.',
    ],
    commands: ['grep remote /etc/pterodactyl/config.yml', 'curl -I {panel}'],
    link: { href: '/v2/wings/configuration#panel-connection', label: 'Wings Configuration: Panel Connection' },
  },
  {
    id: 'wings-config-missing',
    title: 'Wings cannot read its configuration file',
    where: 'Wings',
    signals: [
      { pattern: /Configuration File Not Found/i, weight: 3 },
      { pattern: /error while reading configuration file/i, weight: 3 },
      { pattern: /yaml: (line \d+|unmarshal errors)/i, weight: 2 },
      { pattern: /\/etc\/pterodactyl\/config\.yml/i, weight: 1 },
    ],
    why: 'Wings reads `/etc/pterodactyl/config.yml` before anything else. If the file is missing, it prints "Configuration File Not Found" and exits. If the YAML is invalid, for example because of tabs or wrong indentation after a hand edit, it exits with `error while reading configuration file`.',
    fix: [
      'If the file is missing, run the auto-deploy command from the node\'s Configuration tab, or copy the file from that tab.',
      'If you edited it, check the line number in the error. YAML needs spaces, not tabs, and consistent indentation.',
    ],
    commands: ['ls -l /etc/pterodactyl/config.yml'],
    link: { href: '/v2/wings/installing#configuring-wings', label: 'Configuring Wings' },
  },
  {
    id: 'console-not-connecting',
    title: 'The console cannot connect to Wings',
    where: 'Browser',
    signals: [
      { pattern: /Server connection failed/i, weight: 3 },
      { pattern: /Failed to connect to the websocket/i, weight: 3 },
      { pattern: /request origin not allowed/i, weight: 3 },
      { pattern: /WebSocket connection to .+ failed/i, weight: 3 },
      { pattern: /Mixed Content/i, weight: 2 },
      { pattern: /websocket/i, weight: 2 },
      { pattern: /\bwss?:\/\//i, weight: 1 },
      { pattern: /\bconsole\b/i, weight: 1 },
    ],
    why: 'The console does not go through the Panel. Your browser connects straight to Wings at `wss://<node FQDN>:<Daemon Port>`. That fails when the Panel uses HTTPS but the node does not (browsers block insecure connections from a secure page), when Wings\' certificate is invalid, when a firewall or proxy blocks the port, or when Wings refuses the request\'s origin. Wings only accepts an origin that equals `remote` exactly, or one listed in `allowed_origins`.',
    fix: [
      'Turn on SSL for the node if the Panel uses HTTPS, and give Wings a certificate.',
      'Make sure `remote` matches the address in your browser\'s address bar, including `https://`, with no trailing slash.',
      'If you open the Panel from more than one address, add the others to `allowed_origins`.',
      'Open the browser\'s developer console. The first red error usually names the cause.',
    ],
    commands: ['curl -v https://node.example.com:8080'],
    link: { href: '/v2/panel/troubleshooting#the-console-does-not-connect', label: 'The Console Does Not Connect' },
  },
  {
    id: 'sftp-login',
    title: 'SFTP rejects the login',
    where: 'SFTP',
    signals: [
      { pattern: /failed to validate user credentials/i, weight: 3 },
      { pattern: /Authorization credentials were not correct/i, weight: 3 },
      { pattern: /the credentials provided were invalid/i, weight: 3 },
      { pattern: /You do not have permission to access SFTP/i, weight: 3 },
      { pattern: /Too many login attempts/i, weight: 2 },
      { pattern: /\bsftp\b/i, weight: 2 },
      { pattern: /\b2022\b/, weight: 1 },
      { pattern: /Authentication failed/i, weight: 1 },
    ],
    why: 'SFTP logins have a fixed username format: your Panel username, a period, and the server\'s 8-character ID, such as `admin.1a2b3c4d`. Wings rejects anything else as `invalid format` before it asks the Panel. The password is your Panel account password, or a key added to your account. Subusers also need the SFTP permission, and repeated failures are rate limited.',
    fix: [
      'Copy the username and address from the server\'s Settings page, under SFTP Details.',
      'Connect to the SFTP port (`2022` by default), not port 22.',
      'If you are a subuser, ask the owner to give you the SFTP permission.',
    ],
    commands: ['sftp -P 2022 admin.1a2b3c4d@node.example.com'],
    link: { href: '/v2/panel/troubleshooting#sftp-login-fails', label: 'SFTP Login Fails' },
  },
  {
    id: 'csrf-page-expired',
    title: 'Sign-in fails with a CSRF or 419 error',
    where: 'Panel',
    signals: [
      { pattern: /CSRF token mismatch/i, weight: 3 },
      { pattern: /TokenMismatchException/, weight: 3 },
      { pattern: /Page Expired/i, weight: 3 },
      { pattern: /\b419\b/, weight: 2 },
      { pattern: /SESSION_SECURE_COOKIE/, weight: 2 },
      { pattern: /\bAPP_URL\b/, weight: 1 },
      { pattern: /Unauthenticated\./, weight: 1 },
    ],
    why: 'The Panel keeps you signed in with a session cookie, and checks a CSRF token on every form. When the browser does not send the cookie back, every sign-in fails. This happens when `APP_URL` does not match the address you open: an `https://` address makes `p:environment:setup` set `SESSION_SECURE_COOKIE=true`, so the cookie is never sent over plain HTTP, and the Panel only treats requests from the host in `APP_URL` as signed-in browser requests. Behind a reverse proxy, the Panel also needs `TRUSTED_PROXIES` to know the request was HTTPS.',
    fix: [
      'Set `APP_URL` in `.env` to the exact address you open, including `https://` or `http://`.',
      'If you use a reverse proxy or Cloudflare, set `TRUSTED_PROXIES`.',
      'Clear the configuration cache, then sign in again in a new private window.',
    ],
    commands: ['grep -E "APP_URL|SESSION_SECURE_COOKIE|TRUSTED_PROXIES" {path}/.env', 'php {path}/artisan config:clear'],
    link: { href: '/v2/panel/troubleshooting#sign-in-fails-with-a-csrf-or-419-error', label: 'Sign-In Fails With a CSRF or 419 Error' },
  },
  {
    id: 'bad-gateway',
    title: 'The web server cannot reach PHP-FPM (502)',
    where: 'Web server',
    signals: [
      { pattern: /502 Bad Gateway/i, weight: 3 },
      { pattern: /fpm\.sock/i, weight: 3 },
      { pattern: /connect\(\) to unix:\S+ failed/i, weight: 3 },
      { pattern: /\b502\b/, weight: 2 },
      { pattern: /Bad Gateway/i, weight: 2 },
      { pattern: /php[\d.]*-fpm/i, weight: 2 },
      { pattern: /upstream/i, weight: 1 },
    ],
    why: 'NGINX and Caddy hand PHP requests to PHP-FPM through a socket, `/run/php/php{php}-fpm.sock` in our configurations. A 502 means that socket is not there: PHP-FPM is stopped, or the configuration names a PHP version that is not installed, which often happens after a PHP upgrade.',
    fix: [
      'Check that PHP-FPM is running.',
      'List the sockets that exist, and make sure the one in your web server configuration is among them.',
      'Reload the web server after you change its configuration.',
    ],
    commands: ['systemctl status php{php}-fpm', 'ls /run/php/', 'systemctl reload nginx'],
    link: { href: '/v2/panel/troubleshooting#502-bad-gateway', label: '502 Bad Gateway' },
  },
  {
    id: 'app-key-missing',
    title: 'The Panel has no application key',
    where: 'Panel',
    signals: [
      { pattern: /No application encryption key has been specified/i, weight: 3 },
      { pattern: /MissingAppKeyException/, weight: 3 },
      { pattern: /\bAPP_KEY\b/, weight: 1 },
    ],
    why: '`APP_KEY` in `.env` is empty. The Panel uses it to encrypt sessions, API keys and node tokens, so it cannot serve a page without it. On a new installation, it is generated during setup.',
    fix: [
      'On a new installation, generate the key.',
      'On an existing Panel, do not generate a new one. Restore the original `APP_KEY` from your backup, or the encrypted data becomes unreadable.',
    ],
    commands: ['php {path}/artisan key:generate --force'],
    link: { href: '/v2/panel/getting-started#installing-php-dependencies', label: 'Installing PHP Dependencies' },
  },
  {
    id: 'invalid-mac',
    title: 'The Panel\'s encryption key changed',
    where: 'Panel',
    signals: [
      { pattern: /The MAC is invalid/i, weight: 3 },
      { pattern: /DecryptException/, weight: 3 },
      { pattern: /invalid MAC/i, weight: 3 },
      { pattern: /\bAPP_KEY\b/, weight: 1 },
    ],
    why: 'The data in the database was encrypted with a different `APP_KEY` than the one in `.env`. This almost always means a database backup was restored into a new installation without its original `.env` file.',
    fix: [
      'Restore the original `APP_KEY` into `.env`, then clear the configuration cache.',
      'If the original key is lost, the encrypted data cannot be recovered.',
    ],
    commands: ['php {path}/artisan config:clear'],
    link: { href: '/v2/panel/troubleshooting#invalid-mac-exception', label: 'Invalid MAC Exception' },
  },
  {
    id: 'storage-permissions',
    title: 'The Panel cannot write to its storage directory',
    where: 'Panel',
    signals: [
      { pattern: /could not be opened in append mode/i, weight: 3 },
      { pattern: /Failed to open stream: Permission denied/i, weight: 3 },
      { pattern: /Writing to the log file failed/i, weight: 3 },
      { pattern: /file_put_contents\(/i, weight: 2 },
      { pattern: /storage\/(logs|framework)/i, weight: 2 },
      { pattern: /Permission denied/i, weight: 1 },
    ],
    why: 'PHP runs as the web server user, `www-data` on Ubuntu, and writes its logs and cached views under `storage/`. Commands you run as root, such as Artisan, can create files there that `www-data` cannot write to.',
    fix: ['Give the web server user ownership of the Panel\'s files again.'],
    commands: ['chown -R www-data:www-data {path}/*'],
    link: { href: '/v2/panel/getting-started#setting-permissions', label: 'Setting Permissions' },
  },
  {
    id: 'database-connection',
    title: 'The Panel cannot connect to its database',
    where: 'Panel',
    signals: [
      { pattern: /SQLSTATE\[HY000\] \[2002\]/, weight: 3 },
      { pattern: /SQLSTATE\[HY000\] \[1045\]/, weight: 3 },
      { pattern: /Access denied for user/i, weight: 3 },
      { pattern: /SQLSTATE/, weight: 1 },
      { pattern: /\b(mariadb|mysql)\b/i, weight: 1 },
    ],
    why: 'Error `2002` means the Panel could not reach the database at all: MariaDB is stopped, or `DB_HOST` or `DB_PORT` is wrong. Error `1045` means it reached the database but the username or password was refused. A MariaDB user is tied to a host, so a user created for `127.0.0.1` does not match a connection to `localhost`.',
    fix: [
      'Check that MariaDB is running.',
      'Check the `DB_` values in `.env`, or enter them again with the setup command.',
    ],
    commands: ['systemctl status mariadb', 'php {path}/artisan p:environment:database'],
    link: { href: '/v2/guides/tutorials/mysql-setup', label: 'Setting Up MySQL' },
  },
  {
    id: 'redis-connection',
    title: 'The Panel cannot connect to Redis',
    where: 'Panel',
    signals: [
      { pattern: /\[tcp:\/\/[^\]\s]+:6379\]/, weight: 3 },
      { pattern: /Predis\\Connection/, weight: 3 },
      { pattern: /\bredis\b/i, weight: 2 },
      { pattern: /\b6379\b/, weight: 2 },
    ],
    why: 'With the recommended setup, the Panel keeps its cache, sessions and queue in Redis. When Redis is down, pages fail with `Connection refused [tcp://127.0.0.1:6379]`, and the queue worker stops processing jobs.',
    fix: ['Start Redis and enable it on boot.', 'Restart the queue worker afterwards.'],
    commands: ['systemctl enable --now redis-server', 'systemctl restart pteroq'],
    link: { href: '/v2/panel/getting-started#queue-worker', label: 'Queue Worker' },
  },
  {
    id: 'queue-and-schedules',
    title: 'Background jobs do not run',
    where: 'Panel',
    signals: [
      { pattern: /pteroq/i, weight: 3 },
      { pattern: /queue:work/i, weight: 2 },
      { pattern: /schedules?\b.*\b(not|never|n't)\b.*\b(run|running|work|fire)/i, weight: 2 },
      { pattern: /e-?mails?\b.*\b(not|never|n't)\b.*\b(sen[dt]|arriv)/i, weight: 2 },
      { pattern: /\bqueue\b/i, weight: 1 },
      { pattern: /\bcron(tab)?\b/i, weight: 1 },
    ],
    why: 'Schedules, emails and other background work need two things: the `pteroq` service, which runs the queue worker, and a cron entry that runs the Panel\'s scheduler every minute. If either is missing, the work waits forever without an error on the page.',
    fix: [
      'Check that `pteroq` is running, and read its log.',
      'Check that root\'s crontab has the `schedule:run` line.',
      'After every Panel update, restart the queue worker so it loads the new code.',
    ],
    commands: ['systemctl status pteroq', 'journalctl -u pteroq -n 50 --no-pager', 'crontab -l'],
    link: { href: '/v2/panel/troubleshooting#schedules-do-not-run', label: 'Schedules Do Not Run' },
  },
  {
    id: 'frontend-not-built',
    title: 'The Panel\'s frontend has not been built',
    where: 'Panel',
    signals: [
      { pattern: /Vite manifest has not been generated/i, weight: 3 },
      { pattern: /ManifestDoesNotExistException/, weight: 3 },
      { pattern: /build:production/i, weight: 2 },
      { pattern: /manifest\.json/i, weight: 2 },
    ],
    why: 'The Panel serves its pages from built JavaScript and CSS. A Panel installed from the `2.0-develop` branch does not include them, so the first page load fails until you build them. The Docker image already contains them.',
    fix: ['Build the frontend from the Panel\'s directory. You need Node.js 22.12 or newer.'],
    commands: ['cd {path} && npm ci && npm run build:production'],
    link: { href: '/v2/panel/requirements#building-from-source', label: 'Building From Source' },
  },
  {
    id: 'container-dns',
    title: 'Servers cannot resolve domain names',
    where: 'Game server',
    signals: [
      { pattern: /Temporary failure in name resolution/i, weight: 2 },
      { pattern: /Could not resolve host/i, weight: 2 },
      { pattern: /\bno internet\b/i, weight: 2 },
      { pattern: /\bdns\b/i, weight: 2 },
      { pattern: /\b1\.1\.1\.1\b/, weight: 2 },
      { pattern: /\b(resolve|resolution)\b/i, weight: 1 },
    ],
    why: 'Wings gives every container the DNS servers in `docker.network.dns`, which are `1.1.1.1` and `1.0.0.1` by default. Some hosts block them. Install scripts then fail to download files, and servers cannot reach anything by name.',
    fix: [
      'Find the DNS servers your host uses.',
      'Replace the two defaults under `docker.network.dns` in `/etc/pterodactyl/config.yml`, then restart Wings and the server.',
    ],
    commands: ['resolvectl status', 'systemctl restart wings'],
    link: { href: '/v2/panel/troubleshooting#servers-have-no-internet-access', label: 'Servers Have No Internet Access' },
  },
  {
    id: 'crash-loop',
    title: 'Wings stops restarting a crashing server',
    where: 'Game server',
    signals: [
      { pattern: /Aborting automatic restart/i, weight: 3 },
      { pattern: /Detected server process in a crashed state/i, weight: 3 },
      { pattern: /Out of memory: true/i, weight: 3 },
      { pattern: /\bcrash(ed|es|ing)?\b/i, weight: 1 },
      { pattern: /exit code/i, weight: 1 },
    ],
    why: 'When a server stops without anyone pressing Stop, Wings prints its exit code and whether it ran out of memory, then starts it again. If it crashes again within `system.crash_detection.timeout` seconds (60 by default), Wings gives up so it does not restart the server forever. `Out of memory: true` means the server needs more memory than it has.',
    fix: [
      'Read the console output just above the crash message. That is where the server explains why it stopped.',
      'If it ran out of memory, raise the server\'s memory limit, or lower what the game is set to use.',
    ],
    link: { href: '/v2/wings/configuration#crash-detection', label: 'Wings Configuration: Crash Detection' },
  },
];

export interface Match {
  problem: Problem;
  score: number;
  /** The text that triggered each matching signal, in the order found. */
  hits: string[];
}

/** Score every problem against the input, best first. */
export function matchProblems(input: string): Match[] {
  const text = input.trim();
  if (text.length < 2) return [];

  const matches: Match[] = [];
  for (const problem of PROBLEMS) {
    if (problem.unless?.test(text)) continue;

    let score = 0;
    const hits: string[] = [];
    for (const signal of problem.signals) {
      const found = text.match(signal.pattern);
      if (!found) continue;
      score += signal.weight;
      const hit = found[0].trim();
      if (hit && !hits.some((h) => h.toLowerCase() === hit.toLowerCase())) hits.push(hit.length > 60 ? `${hit.slice(0, 57)}...` : hit);
    }

    if (score >= 2) matches.push({ problem, score, hits });
  }

  return matches.sort((a, b) => b.score - a.score);
}
