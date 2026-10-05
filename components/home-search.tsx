'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';

/**
 * The front page's search box. It is a button dressed as a field: pressing
 * it opens the same dialog the docs pages use, so there is one search.
 */
export function HomeSearch({ variant = 'hero' }: { variant?: 'hero' | 'nav' }) {
  const { setOpenSearch, hotKey } = useSearchContext();
  const hero = variant === 'hero';

  return (
    <button
      type="button"
      onClick={() => setOpenSearch(true)}
      className={[
        'flex w-full items-center gap-3 rounded-lg border border-hairline-strong bg-surface text-left transition-colors hover:border-fg-ghost hover:bg-surface-raised',
        hero ? 'px-4 py-3.5' : 'px-3 py-2 lg:w-64',
      ].join(' ')}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-fg-faint" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>

      <span className={['min-w-0 flex-1 truncate text-fg-faint', hero ? 'text-lead' : 'text-ui font-normal'].join(' ')}>
        {hero ? 'Search the documentation' : 'Search'}
      </span>

      <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden="true">
        {hotKey.map((key, i) => (
          <kbd key={i} className="rounded-sm border border-hairline-strong px-1.5 font-mono text-mono-xs text-fg-faint">
            {key.display}
          </kbd>
        ))}
      </span>
    </button>
  );
}
