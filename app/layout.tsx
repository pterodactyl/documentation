import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import { JetBrains_Mono, Mona_Sans } from 'next/font/google';
import SearchDialog from '@/components/search';

// The kit's faces, the same as pterodactyl.io: Mona Sans sets the words,
// JetBrains Mono sets anything a machine would print. The kit's tokens read
// them from these two variables (kit/tokens.css).
const mona = Mona_Sans({
  subsets: ['latin'],
  variable: '--kit-font-sans',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--kit-font-mono',
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
    <html lang="en" className={`${mona.variable} ${jetbrains.variable}`} suppressHydrationWarning>
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
