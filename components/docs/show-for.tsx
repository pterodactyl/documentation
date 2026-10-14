'use client';

import type { ReactNode } from 'react';
import { DEFAULT_PHP, installPath, useSetup, type OperatingSystem, type WebServer } from './setup';

const list = <T extends string>(value: T | T[] | undefined): T[] | undefined => (value === undefined ? undefined : Array.isArray(value) ? value : [value]);

/**
 * Show a part of a page only for readers whose setup matches. Before the
 * reader picks anything, the defaults apply: Ubuntu 24.04, NGINX, HTTPS and
 * PHP 8.3. Keep headings outside, so the table of contents stays complete.
 */
export function ShowFor({
  webserver,
  os,
  ssl,
  ppa,
  children,
}: {
  webserver?: WebServer | WebServer[];
  os?: OperatingSystem | OperatingSystem[];
  ssl?: boolean;
  /** True for Ubuntu readers who need the PHP PPA: Ubuntu 22.04, or a PHP version Ubuntu 24.04 does not ship. Ubuntu 26.04 and Debian use Sury's repository instead. */
  ppa?: boolean;
  children: ReactNode;
}) {
  const setup = useSetup();
  const needsPpa = (setup.os === 'ubuntu-24.04' && setup.php !== DEFAULT_PHP) || setup.os === 'ubuntu-22.04';

  const matches =
    (list(webserver)?.includes(setup.webserver) ?? true) &&
    (list(os)?.includes(setup.os) ?? true) &&
    (ssl === undefined || ssl === setup.ssl) &&
    (ppa === undefined || ppa === needsPpa);

  return matches ? <>{children}</> : null;
}

/** Inline text that follows the setup, such as the PHP version in a sentence. */
export function SetupValue({ name }: { name: 'domain' | 'php' | 'path' }) {
  const setup = useSetup();
  if (name === 'domain') return <>{setup.domain || '<domain>'}</>;
  if (name === 'path') return <>{installPath(setup)}</>;

  return <>{setup.php}</>;
}
