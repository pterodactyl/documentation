'use client';

import type { ReactNode } from 'react';
import { Code, Folder, Globe, Link, Lock, LockOpen, RotateCcw, Server, type LucideIcon } from 'lucide-react';
import { DEFAULT_PATH, PHP_VERSIONS, resetSetup, updateSetup, useSetup, type OperatingSystem, type Setup, type WebServer } from './setup';
import { Button, Segmented, TextField, Widget } from './widget';

type Field = 'domain' | 'os' | 'webserver' | 'ssl' | 'php' | 'path';

const ALL_FIELDS: Field[] = ['os', 'php', 'webserver', 'ssl', 'domain', 'path'];

type Distro = 'ubuntu' | 'debian';

// The first version of each distribution is the one a distribution switch lands on.
const VERSIONS: Record<Distro, string[]> = {
  ubuntu: ['24.04', '22.04'],
  debian: ['13', '12', '11'],
};

/** One setting: its name on the left, its control on the right (stacked on narrow screens). */
function Row({ label, icon: Icon, children }: { label: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="flex items-center gap-2 text-ui-sm text-fg-muted">
        <Icon aria-hidden className="size-4 shrink-0 text-fg-faint" strokeWidth={1.75} />
        {label}
      </span>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/**
 * Where the reader enters their installation once. Every code block on the
 * site fills in these values, and <ShowFor /> sections switch to match.
 */
export function SetupPanel({ fields = ALL_FIELDS }: { fields?: Field[] }) {
  const setup = useSetup();
  const set = (patch: Partial<Setup>) => updateSetup(patch);
  const [distro, version] = setup.os.split('-') as [Distro, string];

  // Keep the canonical order, whatever order the page lists the fields in.
  const rows = ALL_FIELDS.filter((field) => fields.includes(field));

  return (
    <Widget
      title="Your setup"
      description="Commands and configuration files on this site update to match. Saved in this browser only."
      actions={
        <Button onClick={resetSetup}>
          <span className="flex items-center gap-1.5">
            <RotateCcw aria-hidden className="size-3.5" strokeWidth={1.75} />
            Reset
          </span>
        </Button>
      }
    >
      <div className="divide-y divide-hairline">
        {rows.map((field) => {
          switch (field) {
            case 'os':
              return (
                <Row key={field} label="Operating system" icon={Server}>
                  <Segmented<Distro>
                    label="Distribution"
                    value={distro}
                    onChange={(next) => set({ os: `${next}-${VERSIONS[next][0]}` as OperatingSystem })}
                    options={[
                      { value: 'ubuntu', label: 'Ubuntu' },
                      { value: 'debian', label: 'Debian' },
                    ]}
                  />
                  <Segmented
                    label="Version"
                    value={version}
                    onChange={(next) => set({ os: `${distro}-${next}` as OperatingSystem })}
                    options={VERSIONS[distro].map((v) => ({ value: v, label: v }))}
                  />
                </Row>
              );
            case 'php':
              return (
                <Row key={field} label="PHP" icon={Code}>
                  <Segmented label="PHP version" value={setup.php} onChange={(php) => set({ php })} options={PHP_VERSIONS.map((v) => ({ value: v, label: v }))} />
                </Row>
              );
            case 'webserver':
              return (
                <Row key={field} label="Web server" icon={Globe}>
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
                </Row>
              );
            case 'ssl':
              return (
                <Row key={field} label="SSL" icon={Lock}>
                  <Segmented
                    label="SSL"
                    value={setup.ssl ? 'on' : 'off'}
                    onChange={(value) => set({ ssl: value === 'on' })}
                    options={[
                      {
                        value: 'on',
                        label: (
                          <span className="flex items-center gap-1.5">
                            <Lock aria-hidden className="size-3.5" strokeWidth={1.75} />
                            HTTPS
                          </span>
                        ),
                      },
                      {
                        value: 'off',
                        label: (
                          <span className="flex items-center gap-1.5">
                            <LockOpen aria-hidden className="size-3.5" strokeWidth={1.75} />
                            HTTP only
                          </span>
                        ),
                      },
                    ]}
                  />
                </Row>
              );
            case 'domain':
              return (
                <Row key={field} label="Panel domain" icon={Link}>
                  <TextField
                    aria-label="Panel domain"
                    placeholder="panel.example.com"
                    value={setup.domain}
                    onChange={(event) => set({ domain: event.target.value })}
                    className="max-w-sm"
                  />
                </Row>
              );
            case 'path':
              return (
                <Row key={field} label="Install directory" icon={Folder}>
                  <TextField
                    aria-label="Install directory"
                    placeholder={DEFAULT_PATH}
                    value={setup.path}
                    onChange={(event) => set({ path: event.target.value })}
                    className="max-w-sm"
                  />
                </Row>
              );
          }
        })}
      </div>
    </Widget>
  );
}
