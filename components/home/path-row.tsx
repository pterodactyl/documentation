import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Field } from './field';

/**
 * One row of the front page's paths: a short claim on the left with where to
 * read more, and on the right a working piece of the docs standing in its
 * own light, in the row's hue. The same composition as pterodactyl.io's
 * feature rows (kit: FeatureRow), so the two sites read as one.
 */
export function PathRow({
  id,
  hue,
  title,
  quiet,
  links,
  focus = [0.62, 0.35],
  children,
  figure,
}: {
  id: string;
  hue: string;
  title: string;
  quiet: string;
  links: { label: string; href: string }[];
  focus?: [number, number];
  children: ReactNode;
  figure: ReactNode;
}) {
  return (
    <article id={id} data-row={id} className="grid grid-cols-1 scroll-mt-20 border-t border-hairline first:border-t-0 lg:min-h-[38rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="pad-cell flex flex-col gap-8 lg:py-16">
        <div>
          <h2 className="font-display text-figure">
            {title}
            <br />
            <span className="text-fg-faint">{quiet}</span>
          </h2>
          <div className="mt-5 max-w-measure-sm space-y-4 text-body text-fg-muted">{children}</div>
        </div>
        <ul className="divide-y divide-hairline border-y border-hairline">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="group flex items-center justify-between gap-4 py-3 text-ui text-fg-strong transition-colors hover:text-white">
                {link.label}
                <ArrowRight className="size-3.5 text-fg-ghost transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-accent" strokeWidth={1.75} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative isolate flex min-h-[26rem] min-w-0 items-center justify-center overflow-hidden border-t border-hairline bg-surface-flat p-4 sm:p-10 lg:border-t-0 lg:border-l">
        <Field mode="beams" color={hue} focus={focus} radius={1.05} intensity={0.62} angle={-0.55} className="pointer-events-none absolute inset-0 -z-10 size-full" />
        <div className="w-full min-w-0 [&>section]:my-0">{figure}</div>
      </div>
    </article>
  );
}
