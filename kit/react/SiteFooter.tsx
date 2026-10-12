// <SiteFooter>: the footer every Pterodactyl site shares (DESIGN.md § 7.7).
//
// Its columns are the top bar's four menus (core/sites.ts), so the footer
// and the bar always list the same places. Pure markup: no state, no script,
// so Astro renders it without an island and Next as a server component.
import type { CSSProperties } from 'react';
import { DISCORD_URL, GITHUB_URL, MENUS, SITES, resolveHref, type NavLink, type SiteId } from '../core/sites';
import { Lockup } from './Lockup';
import { DiscordMark, GitHubMark } from './Marks';

export interface SiteFooterProps {
  /** the site this footer is on */
  current: SiteId;
}

export function SiteFooter({ current }: SiteFooterProps) {
  return (
    <footer className="wrapper rail-ticks border-t">
      <div className="pad-section grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10">
        <div className="col-span-2 flex flex-col items-start gap-6 md:col-span-4 lg:col-span-1">
          <a href={resolveHref({ site: 'www', href: '/' }, current)} aria-label="Pterodactyl home" className="text-white">
            <Lockup className="h-6 w-auto" />
          </a>
          <div className="flex gap-2">
            <a href={GITHUB_URL} aria-label="Pterodactyl on GitHub" className="btn btn-ghost w-11 px-0">
              <GitHubMark className="size-4" />
            </a>
            <a href={DISCORD_URL} aria-label="Pterodactyl on Discord" className="btn btn-ghost w-11 px-0">
              <DiscordMark className="size-4" />
            </a>
          </div>
        </div>

        {MENUS.map((menu) => (
          <nav key={menu.id} aria-label={menu.label}>
            <a href={resolveHref(menu.feature, current)} className="flex min-h-10 items-center gap-2.5 text-entry text-white transition-colors hover:text-fg-strong">
              <span className="status-dot is-lit" style={{ '--lamp': menu.hue } as CSSProperties} aria-hidden="true" />
              {menu.label}
            </a>
            {menu.groups.map((group) => (
              <div key={group.title} className="mt-4">
                <p className="flex min-h-7 items-center gap-2 text-ui-sm text-fg-faint">
                  {group.title}
                  {group.status && <span className="font-mono text-mono-xs text-fg-dim">{group.status.label}</span>}
                </p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <FooterLink link={link} current={current} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        ))}
      </div>

      <div className="pad-band flex flex-col items-center justify-between gap-3 border-t text-center text-ui-sm text-fg-faint sm:flex-row sm:text-left">
        <p>MIT Licensed · Pterodactyl® © Infraly and contributors</p>
        <p className="font-mono">{SITES[current].origin.replace('https://', '') + (current === 'marketplace' ? '/marketplace' : '')}</p>
      </div>
    </footer>
  );
}

function FooterLink({ link, current }: { link: NavLink; current: SiteId }) {
  return (
    <a href={resolveHref(link, current)} className="inline-flex min-h-9 items-center text-ui text-fg-subtle transition-colors hover:text-white">
      {link.label}
    </a>
  );
}
