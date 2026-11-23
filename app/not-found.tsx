import type { Metadata } from 'next';
import Link from 'next/link';
import { NavSearch } from '@/components/nav-search';
import { SiteNav } from '@/kit/react/SiteNav';

export const metadata: Metadata = {
  title: 'Page not found',
};

// Every unknown path is answered with this one page, built ahead of time.
// Next.js also sends the root not-found page along with every other page's
// data, so it has to stay small: the top bar and search, and not the docs
// sidebar, whose page tree is about 200 KB.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <SiteNav current="docs" search={<NavSearch />} />
      <main className="wrapper flex flex-1 flex-col items-center justify-center px-gutter py-20 text-center sm:px-gutter-lg">
        <p className="font-mono text-mono-sm text-fg-subtle">404</p>
        <h1 className="mt-4 font-display text-title">This page could not be found.</h1>
        <Link href="/" className="btn btn-ghost mt-8">
          Documentation home
        </Link>
      </main>
    </div>
  );
}
