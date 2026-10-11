'use client';

import { Fragment } from 'react';
import { applySetup, DEFAULT_PATH, DEFAULT_PHP, installPath, PHP_VERSIONS, updateSetup, useSetup, type Setup, type WebServer } from '@/components/docs/setup';
import { Segmented, TextField } from '@/components/docs/widget';

/**
 * The front page's proof of what these docs do: the reader's setup, entered
 * here or on any page, and an excerpt of the real web server configuration
 * from /v2/panel/webserver-configuration rewriting itself to match. It writes
 * the same store every code block on the site reads.
 */

type Variant = { file: string; code: string };

const EXCERPTS: Record<WebServer, { ssl: Variant; plain: Variant }> = {
  nginx: {
    ssl: {
      file: '/etc/nginx/sites-available/pterodactyl.conf',
      code: `server {
    listen 443 ssl http2;
    server_name <domain>;
    root /var/www/pterodactyl/public;

    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}`,
    },
    plain: {
      file: '/etc/nginx/sites-available/pterodactyl.conf',
      code: `server {
    listen 80;
    server_name <domain>;
    root /var/www/pterodactyl/public;
    client_max_body_size 100m;

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
    }
}`,
    },
  },
  apache: {
    ssl: {
      file: '/etc/apache2/sites-available/pterodactyl.conf',
      code: `<VirtualHost *:443>
    ServerName <domain>
    DocumentRoot "/var/www/pterodactyl/public"

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/<domain>/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/<domain>/privkey.pem
</VirtualHost>`,
    },
    plain: {
      file: '/etc/apache2/sites-available/pterodactyl.conf',
      code: `<VirtualHost *:80>
    ServerName <domain>
    DocumentRoot "/var/www/pterodactyl/public"

    AllowEncodedSlashes On
    php_value upload_max_filesize 100M
</VirtualHost>`,
    },
  },
  caddy: {
    ssl: {
      file: '/etc/caddy/Caddyfile',
      code: `<domain> {
    root * /var/www/pterodactyl/public
    file_server

    @php not path /assets/*
    php_fastcgi @php unix//run/php/php8.3-fpm.sock {
        root /var/www/pterodactyl/public
    }
}`,
    },
    plain: {
      file: '/etc/caddy/Caddyfile',
      code: `<domain>:80 {
    root * /var/www/pterodactyl/public
    file_server

    @php not path /assets/*
    php_fastcgi @php unix//run/php/php8.3-fpm.sock {
        root /var/www/pterodactyl/public
    }
}`,
    },
  },
};

const PLACEHOLDERS = /(<domain>|php8\.3|\/var\/www\/pterodactyl)/;

/** The excerpt with every value the reader set marked, and `<domain>` waiting until they set it. */
function Filled({ code, setup }: { code: string; setup: Setup }) {
  const parts = code.split(PLACEHOLDERS);
  return (
    <>
      {parts.map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        const value = applySetup(part, setup);
        const changed = value !== part;
        if (part === '<domain>' && !changed) {
          return (
            <span key={i} className="rounded-sm text-fg-faint underline decoration-dashed decoration-fg-ghost underline-offset-4">
              {part}
            </span>
          );
        }
        return (
          <span key={i} className={changed ? 'rounded-sm bg-accent-soft text-white transition-colors duration-300' : undefined}>
            {value}
          </span>
        );
      })}
    </>
  );
}

export function SetupPreview() {
  const setup = useSetup();
  const set = (patch: Partial<Setup>) => updateSetup(patch);
  const excerpt = EXCERPTS[setup.webserver][setup.ssl ? 'ssl' : 'plain'];
  const custom = setup.domain || setup.php !== DEFAULT_PHP || installPath(setup) !== DEFAULT_PATH;

  return (
    <div className="figure-card overflow-hidden">
      <div className="border-b border-hairline px-4 py-3 sm:px-5">
        <p className="flex items-center gap-2 text-ui text-fg-strong">
          <span className={`status-dot ${custom ? 'is-running' : ''}`} aria-hidden="true" />
          Your server
        </p>
      </div>

      <div className="grid gap-3 border-b border-hairline px-4 py-4 sm:grid-cols-2 sm:px-5">
        <label className="grid gap-1.5">
          <span className="text-ui-sm text-fg-subtle">Panel domain</span>
          <TextField aria-label="Panel domain" placeholder="panel.example.com" value={setup.domain} onChange={(e) => set({ domain: e.target.value })} />
        </label>
        <div className="grid gap-1.5">
          <span className="text-ui-sm text-fg-subtle">Web server</span>
          <Segmented<WebServer>
            label="Web server"
            value={setup.webserver}
            onChange={(webserver) => set({ webserver })}
            options={[
              { value: 'nginx', label: 'NGINX' },
              { value: 'apache', label: 'Apache' },
              { value: 'caddy', label: 'Caddy' },
            ]}
          />
        </div>
        {/* two short controls share a line on a phone; from sm they join the grid */}
        <div className="flex flex-wrap gap-x-5 gap-y-3 sm:contents">
          <div className="grid gap-1.5">
            <span className="text-ui-sm text-fg-subtle">SSL</span>
            <Segmented
              label="SSL"
              value={setup.ssl ? 'on' : 'off'}
              onChange={(value) => set({ ssl: value === 'on' })}
              options={[
                { value: 'on', label: 'HTTPS' },
                { value: 'off', label: 'HTTP only' },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <span className="text-ui-sm text-fg-subtle">PHP</span>
            <Segmented label="PHP version" value={setup.php} onChange={(php) => set({ php })} options={PHP_VERSIONS.map((v) => ({ value: v, label: v }))} />
          </div>
        </div>
      </div>

      <div className="bg-black/40">
        <p className="truncate border-b border-hairline px-4 py-2 font-mono text-mono-sm text-fg-faint sm:px-5">{excerpt.file}</p>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-mono-md leading-relaxed text-fg-muted sm:px-5" aria-live="polite">
          <code>
            <Filled code={excerpt.code} setup={setup} />
          </code>
        </pre>
      </div>
    </div>
  );
}
