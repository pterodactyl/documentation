import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pterodactyl - Open Source Game Server Management',
  description:
    'A free, open-source game server management panel built with PHP, React, and Go. Designed with security in mind, Pterodactyl runs all game servers in isolated Docker containers.',
};

const features = [
  {
    title: 'Security First',
    description:
      'Built with security as a priority. All servers run in isolated Docker containers with bcrypt hashing, AES-256-CBC encryption, and HTTPS support out of the box.',
  },
  {
    title: 'Modern Tooling',
    description:
      'Built on a modern stack using React for the frontend and Go for the daemon, giving you a fast and responsive experience.',
  },
  {
    title: 'Docker Powered',
    description:
      'All game servers run in isolated Docker containers, limiting attack vectors and providing strict resource limits on CPU, memory, and IO.',
  },
  {
    title: 'Free & Open Source',
    description:
      'Pterodactyl is 100% free and licensed under the MIT license. All of our code is publicly available on GitHub.',
  },
  {
    title: 'User Friendly',
    description:
      'An intuitive and clean UI that makes managing your game servers easy, whether you run one server or hundreds.',
  },
  {
    title: 'Scalable',
    description:
      'Whether you are a hosting company, a large gaming network, or just some friends playing video games, Pterodactyl can scale to fit your needs.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <nav className="border-b border-fd-border bg-fd-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-fd-foreground">Pterodactyl</span>
          <div className="flex items-center gap-6">
            <Link href="/panel/getting-started" className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors">
              Documentation
            </Link>
            <a href="https://discord.gg/pterodactyl" className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors">
              Discord
            </a>
            <a href="https://github.com/pterodactyl" className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-24 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.pterodactyl.io/logos/new/pterodactyl_logo_transparent.png"
            alt="Pterodactyl"
            className="mx-auto mb-6 w-full max-w-xl"
          />
          <p className="mt-6 text-lg leading-8 text-fd-muted-foreground">
            A free, open-source game server management panel built with PHP, React, and Go.
            Designed with security in mind, Pterodactyl runs all game servers in isolated Docker
            containers while exposing a beautiful and intuitive UI to end users.
          </p>
          <div className="mt-10">
            <Link
              href="/panel/getting-started"
              className="inline-block rounded-lg bg-fd-primary px-8 py-3 text-base font-semibold text-fd-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
            >
              Let&apos;s Get Started!
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <h2 className="mb-12 text-center text-3xl font-bold text-fd-foreground">
            Why use Pterodactyl?
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-fd-border bg-fd-card p-6"
              >
                <h3 className="mb-2 text-lg font-semibold text-fd-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-fd-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-fd-border bg-fd-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <p className="text-sm text-fd-muted-foreground">
            &copy; 2015 Dane Everitt and contributors.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/pterodactyl" className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors">
              GitHub
            </a>
            <a href="https://discord.gg/pterodactyl" className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors">
              Discord
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
