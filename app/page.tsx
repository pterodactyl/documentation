import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { source } from '@/lib/source';
import { Wordmark } from '@/components/wordmark';
import { HomeSearch } from '@/components/home-search';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';

export const metadata: Metadata = {
  title: { absolute: 'Pterodactyl Documentation' },
  description:
    'Install, run and extend Pterodactyl: the Panel, Wings, the API reference and community guides, for 1.x and the 2.0 pre-release.',
};

const versions = [
  {
    slug: 'v1',
    name: 'Pterodactyl 1.x',
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

const steps = [
  {
    title: 'Install the Panel',
    body: 'The web application: accounts, servers, nodes and the API all live here.',
    href: '/v1/panel/getting-started',
  },
  {
    title: 'Install Wings',
    body: 'The daemon that runs on each node and keeps every server in its own Docker container.',
    href: '/v1/wings/installing',
  },
  {
    title: 'Pick an egg',
    body: 'An egg is the recipe for one kind of server. Import one from the library and create a server from it.',
    href: 'https://eggs.pterodactyl.io',
  },
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

/** One structural slab between the page rails, ruled and ticked at the top. */
function Section({ first = false, children }: { first?: boolean; children: ReactNode }) {
  return <section className={first ? 'wrapper' : 'wrapper rail-ticks border-t border-hairline'}>{children}</section>;
}

export default function HomePage() {
  const pages = source.getPages();

  const shelves = versions.map((version) => {
    const own = pages.filter((page) => page.slugs[0] === version.slug);

    return {
      ...version,
      sections: version.sections.map((section) => {
        const inside = own.filter((page) => page.slugs[1] === section.slug);
        const landing =
          inside.find((page) => page.slugs.length === 2) ??
          inside.find((page) => page.slugs[2] === section.entry) ??
          inside[0];

        return { ...section, href: landing?.url ?? `/${version.slug}` };
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
              {shelves.map((shelf) => (
                <Link key={shelf.slug} href={`/${shelf.slug}`} className="text-ui text-fg-subtle transition-colors hover:text-white">
                  {shelf.name.replace('Pterodactyl ', '')}
                </Link>
              ))}
              <Link href="/v1/api" className="text-ui text-fg-subtle transition-colors hover:text-white">
                API
              </Link>
              <a href="https://eggs.pterodactyl.io" className="text-ui text-fg-subtle transition-colors hover:text-white">
                Eggs
              </a>
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
            <a
              href="https://github.com/pterodactyl"
              aria-label="Pterodactyl on GitHub"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-hairline-strong px-5 py-2.5 text-ui text-fg-strong transition duration-150 hover:border-fg-ghost hover:bg-surface-raised"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.3-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.75.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.37.8 1.1.8 2.22v3.29c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <Section first>
          <div className="px-gutter pt-14 pb-10 sm:px-gutter-lg sm:pt-20 sm:pb-14">
            <h1 className="font-display text-display">
              Pterodactyl <span className="text-fg-faint">Documentation</span>
            </h1>
          </div>

          <div className="border-t border-hairline">
            <div className="pad-cell flex min-w-0 flex-col justify-center">
              <p className="max-w-measure text-lead text-fg-muted">
                Installation, configuration and API reference for the Panel and Wings. Covers 1.x and the 2.0
                pre-release.
              </p>

              <div className="mt-8 max-w-xl">
                <HomeSearch />
              </div>
            </div>

          </div>
        </Section>

        {/* The two versions, as a shared-line grid. */}
        <Section>
          <div className="grid grid-cols-1 gap-px bg-hairline lg:grid-cols-2">
            {shelves.map((shelf) => (
              <div key={shelf.slug} className="flex flex-col bg-black pad-cell">
                <h2 className="font-display text-title">{shelf.name}</h2>

                <p className="mt-4 max-w-measure-sm text-body text-fg-subtle">{shelf.blurb}</p>

                <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
                  {shelf.sections.map((section) => (
                    <li key={section.slug}>
                      <Link
                        href={section.href}
                        className="group flex items-center justify-between gap-4 py-3 text-ui text-fg-strong transition-colors hover:text-white"
                      >
                        <span className="flex items-center gap-2">
                          {section.label}
                          <span
                            className="font-mono text-fg-ghost transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                            aria-hidden="true"
                          >
                            →
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Link
                    href={`/${shelf.slug}`}
                    className={
                      shelf.slug === 'v1'
                        ? 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 py-2.5 text-ui text-black transition duration-150 hover:-translate-y-px hover:opacity-90'
                        : 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-hairline-strong px-5 py-2.5 text-ui text-fg-strong transition duration-150 hover:border-fg-ghost hover:bg-surface-raised'
                    }
                  >
                    Read the {shelf.name.replace('Pterodactyl ', '')} docs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* A real sequence, so it is numbered. */}
        <Section>
          <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="pad-section">
              <h2 className="font-display text-headline">
                Getting started
              </h2>
              <p className="mt-5 max-w-measure-sm text-lead text-fg-muted">
                New to Pterodactyl? Follow these in order. Help is available on Discord.
              </p>
            </div>

            <ol className="grid grid-cols-1 gap-px border-t border-hairline bg-hairline lg:border-l lg:border-t-0">
              {steps.map((step, i) => (
                <li key={step.title} className="bg-black">
                  <Link href={step.href} className="group flex h-full gap-6 px-gutter py-7 transition-colors hover:bg-surface-raised-flat sm:px-gutter-lg">
                    <span className="font-mono text-mono-lg text-accent">{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className="flex items-center gap-2 font-display text-entry text-white">
                        {step.title}
                        <span
                          className="font-mono text-fg-ghost transition-all group-hover:translate-x-0.5 group-hover:text-accent"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </span>
                      <span className="mt-1.5 block max-w-measure-sm text-body text-fg-subtle">{step.body}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      </main>

      <footer className="wrapper rail-ticks border-t border-hairline">
        <div className="pad-section">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div className="max-w-measure-sm">
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

        <div className="pad-band flex flex-col items-center justify-between gap-3 border-t border-hairline text-ui-sm text-fg-faint sm:flex-row">
          <p>MIT Licensed · Pterodactyl® © Infraly and contributors</p>
          <p className="font-mono">docs.pterodactyl.io</p>
        </div>
      </footer>
    </div>
  );
}
