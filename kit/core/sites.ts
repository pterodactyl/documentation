// The Pterodactyl sites and the menus of their shared top bar. Every site
// draws its top bar from these lists (kit/react/SiteNav), so a link added here
// shows on all of them and the sites cannot drift apart.
import { HUES } from '../hues';

export type SiteId = 'www' | 'docs' | 'eggs' | 'marketplace';

export const SITES: Record<SiteId, { label: string; origin: string; home: string }> = {
  www: { label: 'pterodactyl.io', origin: 'https://pterodactyl.io', home: '/' },
  docs: { label: 'docs', origin: 'https://docs.pterodactyl.io', home: '/' },
  eggs: { label: 'eggs', origin: 'https://eggs.pterodactyl.io', home: '/' },
  marketplace: { label: 'marketplace', origin: 'https://pterodactyl.io', home: '/marketplace' },
};

export const GITHUB_URL = 'https://github.com/pterodactyl';
export const DISCORD_URL = 'https://discord.gg/pterodactyl';

/** A path on one of the sites, or (without `site`) a full URL to another service. */
export interface NavLink {
  label: string;
  site?: SiteId;
  href: string;
  /** a section colour, shown as a dot before the label */
  hue?: string;
}

export interface NavGroup {
  title: string;
  /** a status light and its word, for a release line */
  status?: { dot: 'is-running' | 'is-warning'; label: string };
  links: NavLink[];
}

export interface NavMenu {
  id: 'docs' | 'eggs' | 'marketplace' | 'community';
  label: string;
  hue: string;
  /** the site this menu is, so its item shows as current there */
  site?: SiteId;
  /** the large link at the start of the menu */
  feature: NavLink & { text: string; host: string };
  groups: NavGroup[];
}

export const MENUS: NavMenu[] = [
  {
    id: 'docs',
    label: 'Docs',
    hue: HUES.blue,
    site: 'docs',
    feature: {
      label: 'Documentation',
      text: 'Install, run and extend the Panel and Wings.',
      site: 'docs',
      href: '/',
      host: 'docs.pterodactyl.io',
    },
    groups: [
      {
        title: '2.0',
        status: { dot: 'is-warning', label: 'Open beta' },
        links: [
          { label: 'Install the Panel', site: 'docs', href: '/v2/panel/getting-started' },
          { label: 'Upgrade from 1.x', site: 'docs', href: '/v2/upgrading/upgrading-from-v1' },
          { label: 'Extensions', site: 'docs', href: '/v2/extensions' },
          { label: 'API reference', site: 'docs', href: '/v2/api' },
        ],
      },
      {
        title: '1.x',
        status: { dot: 'is-running', label: 'Stable' },
        links: [
          { label: 'Install the Panel', site: 'docs', href: '/v1/panel/getting-started' },
          { label: 'Install Wings', site: 'docs', href: '/v1/wings/installing' },
          { label: 'Troubleshooting', site: 'docs', href: '/v1/panel/troubleshooting' },
          { label: 'API reference', site: 'docs', href: '/v1/api' },
        ],
      },
    ],
  },
  {
    id: 'eggs',
    label: 'Eggs',
    hue: HUES.emerald,
    site: 'eggs',
    feature: {
      label: 'Eggs',
      text: 'An egg tells the Panel how to install and start one type of server.',
      site: 'eggs',
      href: '/',
      host: 'eggs.pterodactyl.io',
    },
    groups: [
      {
        title: 'Browse',
        links: [
          { label: 'Games', site: 'eggs', href: '/eggs/games', hue: HUES.emerald },
          { label: 'Applications', site: 'eggs', href: '/eggs/applications', hue: HUES.violet },
          { label: 'Languages', site: 'eggs', href: '/eggs/generic', hue: HUES.amber },
          { label: 'Request an egg', site: 'eggs', href: '/request' },
        ],
      },
      {
        title: 'Popular',
        links: [
          { label: 'Minecraft: Paper', site: 'eggs', href: '/egg/games-paper' },
          { label: 'Counter-Strike 2', site: 'eggs', href: '/egg/games-counter-strike-2' },
          { label: 'Valheim', site: 'eggs', href: '/egg/games-valheim' },
          { label: 'Palworld', site: 'eggs', href: '/egg/games-palworld' },
        ],
      },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    hue: HUES.violet,
    site: 'marketplace',
    feature: {
      label: 'Marketplace',
      text: 'Extensions that add features to the Panel.',
      site: 'marketplace',
      href: '/marketplace',
      host: 'pterodactyl.io/marketplace',
    },
    groups: [
      {
        title: 'Panel 2.0',
        status: { dot: 'is-warning', label: 'Open beta' },
        links: [
          { label: 'All extensions', site: 'marketplace', href: '/marketplace' },
          { label: 'Free extensions', site: 'marketplace', href: '/marketplace?price=free' },
          { label: 'Your purchases', site: 'marketplace', href: '/marketplace?view=purchases' },
        ],
      },
      {
        title: 'Guides',
        links: [
          { label: 'Install an extension', site: 'docs', href: '/v2/extensions' },
          { label: 'Build an extension', site: 'docs', href: '/v2/extensions/building' },
          { label: 'Extension reference', site: 'docs', href: '/v2/extensions/reference' },
        ],
      },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    hue: HUES.amber,
    feature: {
      label: 'Discord',
      text: 'Ask questions and get help from other Pterodactyl users.',
      href: DISCORD_URL,
      host: 'discord.gg/pterodactyl',
    },
    groups: [
      {
        title: 'Code',
        links: [
          { label: 'Panel', href: 'https://github.com/pterodactyl/panel' },
          { label: 'Wings', href: 'https://github.com/pterodactyl/wings' },
          { label: 'All repositories', href: GITHUB_URL },
          { label: 'Report a security issue', href: 'https://github.com/pterodactyl/panel/security' },
        ],
      },
      {
        title: 'Project',
        links: [
          { label: 'About Pterodactyl', site: 'docs', href: '/v1/project/about' },
          { label: 'Community standards', site: 'docs', href: '/v1/project/community' },
          { label: 'Sponsor', href: 'https://github.com/sponsors/pterodactyl' },
        ],
      },
    ],
  },
];

/** A link's address as seen from `from`: a path on the same origin, a full URL otherwise. */
export function resolveHref(link: Pick<NavLink, 'site' | 'href'>, from: SiteId): string {
  if (!link.site) return link.href;
  const origin = SITES[link.site].origin;
  return origin === SITES[from].origin ? link.href : origin + link.href;
}
