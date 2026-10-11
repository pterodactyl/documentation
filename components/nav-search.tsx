'use client';

import { useSearchContext } from 'fumadocs-ui/contexts/search';
import { HomeSearch } from '@/components/home-search';

/**
 * Search in the top bar: a field from 1280px, where it fits beside the four
 * menus, and a button below that. Both open the one search dialog.
 */
export function NavSearch() {
  const { setOpenSearch } = useSearchContext();
  return (
    <>
      <div className="hidden xl:block">
        <HomeSearch variant="nav" />
      </div>
      <button type="button" onClick={() => setOpenSearch(true)} aria-label="Search" className="btn btn-ghost w-11 px-0 xl:hidden">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
