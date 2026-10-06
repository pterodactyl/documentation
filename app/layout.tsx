import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import SearchDialog from '@/components/search';

// Plex Sans sets the words, JetBrains Mono sets anything a machine would
// print. Both are handed to the stylesheet as variables.
const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.pterodactyl.io'),
  title: {
    default: 'Pterodactyl Documentation',
    template: '%s - Pterodactyl Documentation',
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${plex.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider
          // Dark by default, like the panel these pages document.
          theme={{ defaultTheme: 'dark' }}
          search={{ SearchDialog }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
