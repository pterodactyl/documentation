import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { Wordmark } from '@/components/wordmark';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <Wordmark />,
      url: '/',
    },
    githubUrl: 'https://github.com/pterodactyl',
    links: [
      { text: 'Eggs', url: 'https://eggs.pterodactyl.io', external: true },
      { text: 'Discord', url: 'https://discord.gg/pterodactyl', external: true },
      { text: 'pterodactyl.io', url: 'https://pterodactyl.io', external: true },
    ],
  };
}
