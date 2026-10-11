import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { source } from '@/lib/source';
import { HUES } from '@/kit';
import { Wordmark } from '@/components/wordmark';
import { HomeSearch } from '@/components/home-search';
import { Field } from '@/components/home/field';
import { SetupPreview } from '@/components/home/setup-preview';
import { UpgradeProgress } from '@/components/home/upgrade-progress';
import { ApiExchange } from '@/components/home/api-exchange';
import { PathRow } from '@/components/home/path-row';
import { RowIndex } from '@/components/home/row-index';
import { ArchitectureTour, SlotDemo, TroubleshootingMatcher } from '@/components/docs/widgets';

export const metadata: Metadata = {
  title: { absolute: 'Pterodactyl Documentation' },
  description:
    'Install, run and extend Pterodactyl: the Panel, Wings, the API reference and community guides, for 1.x and the 2.0 pre-release.',
};

const versions = [
  {
    slug: 'v1',
    name: 'Pterodactyl 1.x',
    status: 'Stable',
    live: 'is-running',
    blurb: 'The current release. Start here unless you are testing what comes next.',
    sections: [
      { slug: 'project', label: 'Project', entry: 'about' },
      { slug: 'panel', label: 'Panel', entry: 'getting-started' },
      { slug: 'wings', label: 'Wings', entry: 'installing' },
      { slug: 'guides', label: 'Community guides', entry: 'panel-installation' },
      { slug: 'api', label: 'API reference' },
    ],
  },
  {
    slug: 'v2',
    name: 'Pterodactyl 2.0',
    status: 'Pre-release',
    live: 'is-warning',
    blurb: 'The next major version, with extensions and a new API. Not yet for production.',
    sections: [
      { slug: 'project', label: 'Project', entry: 'about' },
      { slug: 'panel', label: 'Panel', entry: 'requirements' },
      { slug: 'wings', label: 'Wings', entry: 'installing' },
      { slug: 'extensions', label: 'Extensions' },
      { slug: 'upgrading', label: 'Upgrading from 1.x', entry: 'upgrading-from-v1' },
      { slug: 'guides', label: 'Community guides', entry: 'tutorials' },
      { slug: 'api', label: 'API reference' },
    ],
  },
];

const quick = [
  { label: 'Install the Panel', href: '/v1/panel/getting-started' },
  { label: 'Install Wings', href: '/v1/wings/installing' },
  { label: 'Upgrade to 2.0', href: '/v2/upgrading/upgrading-from-v1' },
  { label: 'API reference', href: '/v1/api' },
];

const rows = [
  { id: 'how-it-works', label: 'How it works', hue: HUES.violet },
  { id: 'upgrading', label: 'Upgrading', hue: HUES.amber },
  { id: 'extensions', label: 'Extensions', hue: HUES.blue },
  { id: 'troubleshooting', label: 'Troubleshooting', hue: HUES.rose },
  { id: 'api', label: 'The API', hue: HUES.emerald },
];

const footer = [
  {
    heading: 'Documentation',
    links: [
      { label: 'Pterodactyl 1.x', href: '/v1' },
      { label: 'Pterodactyl 2.0', href: '/v2' },
      { label: 'API reference', href: '/v1/api' },
      { label: 'Community guides', href: '/v1/guides/panel-installation' },
    ],
  },
  {
    heading: 'Repositories',
    links: [
      { label: 'panel', href: 'https://github.com/pterodactyl/panel' },
      { label: 'wings', href: 'https://github.com/pterodactyl/wings' },
      { label: 'documentation', href: 'https://github.com/pterodactyl/documentation' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'pterodactyl.io', href: 'https://pterodactyl.io' },
      { label: 'Eggs', href: 'https://eggs.pterodactyl.io' },
      { label: 'Discord', href: 'https://discord.gg/pterodactyl' },
      { label: 'GitHub', href: 'https://github.com/pterodactyl' },
    ],
  },
];

/** One slab between the page rails, ruled and ticked at the top. */
function Section({ first = false, className = '', children }: { first?: boolean; className?: string; children: ReactNode }) {
  return <section className={`${first ? 'wrapper' : 'wrapper rail-ticks border-t'} ${className}`}>{children}</section>;
}

export default function HomePage() {
  const pages = source.getPages();

  const shelves = versions.map((version) => {
    const own = pages.filter((page) => page.slugs[0] === version.slug);
    return {
      ...version,
      sections: version.sections.map((section) => {
        const inside = own.filter((page) => page.slugs[1] === section.slug);
        const landing = inside.find((page) => page.slugs.length === 2) ?? inside.find((page) => page.slugs[2] === section.entry) ?? inside[0];
        return { ...section, href: landing?.url ?? `/${version.slug}`, count: inside.length };
      }),
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-hairline bg-black/70 backdrop-blur-md">
        <nav className="wrapper flex h-nav items-center justify-between gap-6 px-gutter" aria-label="Primary">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Pterodactyl documentation, home">
              <Wordmark />
            </Link>
            <div className="hidden items-center gap-7 md:flex">
              <Link href="/v1" className="text-ui text-fg-subtle transition-colors hover:text-white">1.x</Link>
              <Link href="/v2" className="text-ui text-fg-subtle transition-colors hover:text-white">2.0</Link>
              <Link href="/v1/api" className="text-ui text-fg-subtle transition-colors hover:text-white">API</Link>
              <a href="https://eggs.pterodactyl.io" className="text-ui text-fg-subtle transition-colors hover:text-white">Eggs</a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden lg:block">
              <HomeSearch variant="nav" />
            </div>
            <a href="https://pterodactyl.io" className="hidden text-ui text-fg-subtle transition-colors hover:text-white sm:block">
              pterodactyl.io
            </a>
            <ThemeSwitch />
            <a href="https://github.com/pterodactyl" aria-label="Pterodactyl on GitHub" className="btn btn-ghost max-sm:w-11 max-sm:px-0">
              <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden="true">
                <path d="M12 1C5.923 1 1 5.923 1 12c0 4.867 3.149 8.979 7.521 10.436.55.096.756-.233.756-.522 0-.262-.013-1.128-.013-2.049-2.764.509-3.479-.674-3.699-1.292-.124-.317-.66-1.293-1.127-1.554-.385-.207-.936-.715-.014-.729.866-.014 1.485.797 1.691 1.128.99 1.663 2.571 1.196 3.204.907.096-.715.385-1.196.701-1.471-2.448-.275-5.005-1.224-5.005-5.432 0-1.196.426-2.186 1.128-2.956-.111-.275-.496-1.402.11-2.915 0 0 .921-.288 3.024 1.128a10.193 10.193 0 0 1 2.75-.371c.936 0 1.871.123 2.75.371 2.104-1.43 3.025-1.128 3.025-1.128.605 1.513.221 2.64.111 2.915.701.77 1.127 1.747 1.127 2.956 0 4.222-2.571 5.157-5.019 5.432.399.344.743 1.004.743 2.035 0 1.471-.014 2.654-.014 3.025 0 .289.206.632.756.522C19.851 20.979 23 16.854 23 12c0-6.077-4.922-11-11-11Z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* The hero: search, and the reader's server, standing in the light */}
        <Section first className="isolate overflow-hidden">
          {/* Side by side, one light spans the hero and pools behind the card.
              Stacked, the words get a clean ground and the light moves into
              the card's own column (below). Each field is lazy, so the one
              that is hidden at this width never takes a WebGL context. */}
          <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
            <Field
              mode="glow"
              color={HUES.blue}
              focus={[0.74, 0.46]}
              radius={0.9}
              intensity={0.72}
              lightIntensity={0.5}
              wash={0.16}
              pointer
              className="fade-y block size-full"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="px-gutter pt-10 pb-12 sm:px-gutter-lg sm:pt-20 lg:pb-20">
              <Link href="/v2/extensions" className="pill">
                <span className="text-white">2.0 pre-release</span>
                <span className="text-fg-subtle">Build extensions</span>
                <ChevronRight className="size-3.5 text-fg-faint" strokeWidth={1.75} aria-hidden="true" />
              </Link>
              <h1 className="mt-6 font-display text-display">
                Pterodactyl
                <br />
                <span className="text-fg-faint">Documentation</span>
              </h1>
              <p className="mt-6 max-w-measure-sm text-lead text-fg-muted sm:mt-7">
                Install, run and extend the Panel and Wings, for 1.x and the 2.0 pre-release.
              </p>
              <div className="mt-8 max-w-xl">
                <HomeSearch />
              </div>
              {/* a phone gets the four ways in as a ruled grid of thumb-sized
                  cells; wider screens set them as a line of links */}
              <ul className="mt-4 grid grid-cols-2 gap-px border border-hairline bg-hairline sm:mt-6 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:border-0 sm:bg-transparent">
                {quick.map((link) => (
                  <li key={link.href} className="bg-black sm:bg-transparent">
                    <Link
                      href={link.href}
                      className="group flex min-h-12 items-center justify-between gap-1.5 px-3 text-ui text-fg-strong transition-colors hover:text-white sm:inline-flex sm:min-h-9 sm:justify-start sm:px-0 sm:text-fg-subtle"
                    >
                      {link.label}
                      <ArrowRight className="size-3.5 text-fg-ghost transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative isolate flex flex-col justify-center gap-4 px-gutter pt-10 pb-14 sm:px-gutter-lg lg:py-20 lg:pl-0">
              <div className="pointer-events-none absolute -inset-x-16 inset-y-0 -z-10 lg:hidden">
                <Field
                  mode="glow"
                  color={HUES.blue}
                  focus={[0.7, 0.36]}
                  radius={0.62}
                  intensity={0.6}
                  lightIntensity={0.42}
                  wash={0.14}
                  className="fade-y block size-full"
                />
              </div>
              <SetupPreview />
            </div>
          </div>
        </Section>

        {/* The two versions, as a shared-line grid */}
        <Section>
          <div className="grid grid-cols-1 gap-px bg-hairline lg:grid-cols-2">
            {shelves.map((shelf) => (
              <div key={shelf.slug} className="pad-cell flex flex-col bg-black">
                <p className="flex items-center gap-2 font-mono text-mono-sm text-fg-subtle">
                  <span className={`status-dot ${shelf.live}`} aria-hidden="true" />
                  {shelf.status}
                </p>
                <h2 className="mt-4 font-display text-title">{shelf.name}</h2>
                <p className="mt-3 max-w-measure-sm text-body text-fg-subtle">{shelf.blurb}</p>

                <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
                  {shelf.sections.map((section) => (
                    <li key={section.slug}>
                      <Link href={section.href} className="group flex items-center justify-between gap-4 py-3 text-ui text-fg-strong transition-colors hover:text-white">
                        <span className="flex items-center gap-2">
                          {section.label}
                          <ArrowRight className="size-3.5 text-fg-ghost transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} aria-hidden="true" />
                        </span>
                        {section.count > 1 && <span className="font-mono text-mono-sm text-fg-faint tabular-nums">{section.count} pages</span>}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link href={`/${shelf.slug}`} className={shelf.slug === 'v1' ? 'btn btn-primary' : 'btn btn-ghost'}>
                    Read the {shelf.name.replace('Pterodactyl ', '')} docs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* The paths: each a claim, and the part of the docs that proves it, working */}
        <Section>
          <div className="grid grid-cols-1 lg:grid-cols-[12.5rem_minmax(0,1fr)]">
            <aside className="hidden border-r border-hairline lg:block">
              <RowIndex rows={rows} />
            </aside>

            <div className="min-w-0">
              <PathRow
                id="how-it-works"
                hue={HUES.violet}
                title="The Panel manages."
                quiet="Wings runs."
                focus={[0.5, 0.2]}
                links={[
                  { label: 'How Pterodactyl works', href: '/v2/project/how-it-works' },
                  { label: 'Panel requirements', href: '/v2/panel/requirements' },
                ]}
                figure={<ArchitectureTour />}
              >
                <p>
                  Your browser talks to the Panel. The Panel talks to Wings on each node, and players connect straight to
                  their game servers.
                </p>
              </PathRow>

              <PathRow
                id="upgrading"
                hue={HUES.amber}
                title="Moving to 2.0,"
                quiet="one step at a time."
                focus={[0.55, 0.3]}
                links={[
                  { label: 'Upgrading from 1.x', href: '/v2/upgrading/upgrading-from-v1' },
                  { label: 'What changed from 1.x', href: '/v2/upgrading/changes-from-v1' },
                  { label: 'Testing the upgrade', href: '/v2/upgrading/testing-the-upgrade' },
                ]}
                figure={<UpgradeProgress />}
              >
                <p>
                  Twelve steps in three stages, from updating 1.x to keeping your old files. 2.0 is a pre-release, so
                  test the upgrade on a copy first.
                </p>
              </PathRow>

              <PathRow
                id="extensions"
                hue={HUES.blue}
                title="Extend the Panel"
                quiet="without forking it."
                focus={[0.7, 0.4]}
                links={[
                  { label: 'Extensions', href: '/v2/extensions' },
                  { label: 'Building an extension', href: '/v2/extensions/building' },
                  { label: 'Slots, screens and columns', href: '/v2/extensions/frontend' },
                ]}
                figure={<SlotDemo />}
              >
                <p>
                  Extensions add pages, tabs, table columns and API routes through slots the Panel exposes.
                </p>
              </PathRow>

              <PathRow
                id="troubleshooting"
                hue={HUES.rose}
                title="Find the fix"
                quiet="by its error."
                focus={[0.5, 0.5]}
                links={[
                  { label: 'Troubleshooting 2.0', href: '/v2/panel/troubleshooting' },
                  { label: 'Troubleshooting 1.x', href: '/v1/panel/troubleshooting' },
                ]}
                figure={<TroubleshootingMatcher />}
              >
                <p>
                  Fixes for the problems people hit most, from a node that will not connect to a console stuck connecting.
                </p>
              </PathRow>

              <PathRow
                id="api"
                hue={HUES.emerald}
                title="Automate it"
                quiet="over the API."
                focus={[0.6, 0.45]}
                links={[
                  { label: 'API reference 1.x', href: '/v1/api' },
                  { label: 'API reference 2.0', href: '/v2/api' },
                ]}
                figure={<ApiExchange />}
              >
                <p>
                  Everything the Panel does is an API call. A client key acts as one user on their servers; an application
                  key administers the Panel. The reference is generated from the API&apos;s own specification.
                </p>
              </PathRow>
            </div>
          </div>
        </Section>
      </main>

      <footer className="wrapper rail-ticks border-t">
        <div className="pad-section">
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-[1.5fr_repeat(3,1fr)] lg:gap-12">
            <div className="col-span-2 max-w-measure-sm md:col-span-3 lg:col-span-1">
              <Wordmark />
              <p className="mt-4 text-body text-fg-subtle">
                The documentation for Pterodactyl, the open-source game server management panel. Written in the open;
                corrections are a pull request away.
              </p>
            </div>
            {footer.map((col) => (
              <div key={col.heading}>
                <p className="eyebrow mb-4">{col.heading}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-ui text-fg-subtle transition-colors hover:text-white">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="pad-band flex flex-col items-center justify-between gap-3 border-t text-ui-sm text-fg-faint sm:flex-row">
          <p>MIT Licensed · Pterodactyl® © Infraly and contributors</p>
          <p className="font-mono">docs.pterodactyl.io</p>
        </div>
      </footer>
    </div>
  );
}
