'use client';

import {
  SearchDialog,
  SearchDialogContent,
  SearchDialogIcon,
  SearchDialogOverlay,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { ArrowDown, ArrowUp, Braces, CornerDownLeft, FileText, Hash } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { type KeyboardEvent, type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SearchCard, SearchResults } from '@/lib/search';

const VERSIONS: Record<string, string> = {
  v2: 'Pterodactyl 2.0',
  v1: 'Pterodactyl 1.x',
  plus: 'Pterodactyl+',
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'guides', label: 'Guides' },
  { id: 'api', label: 'API' },
] as const;

type Tab = (typeof TABS)[number]['id'];

const METHODS: Record<string, string> = {
  GET: 'bg-blue/15 text-blue',
  POST: 'bg-green/15 text-green',
  DELETE: 'bg-red/15 text-red',
};

interface Loaded {
  key: string;
  query: string;
  results?: SearchResults;
}

function useResults(query: string, tag: string | undefined, enabled: boolean) {
  const key = `${tag}:${query}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        const params = new URLSearchParams({ query });
        if (tag) params.set('tag', tag);

        try {
          const response = await fetch(`/api/search?${params}`, { signal: controller.signal });

          setLoaded({ key, query, results: response.ok ? ((await response.json()) as SearchResults) : undefined });
        } catch {
          if (!controller.signal.aborted) setLoaded({ key, query });
        }
      },
      query ? 120 : 0,
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, key, query, tag]);

  return { loaded, isLoading: enabled && loaded?.key !== key };
}

function Marked({ text }: { text: string }) {
  return text.split(/(<mark>.*?<\/mark>|`[^`]*`)/).map((part, index) => {
    if (part.startsWith('<mark>')) {
      return (
        <mark key={index} className="rounded-[3px] bg-accent/25 text-white ring-1 ring-accent/25">
          {part.slice(6, -7)}
        </mark>
      );
    }

    if (part.startsWith('`')) {
      return (
        <code key={index} className="font-mono text-[0.92em] text-fg-strong">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

function Entry({
  href,
  lead,
  title,
  aside,
  detail,
  head = false,
  active,
  onPick,
  onOpen,
}: {
  href: string;
  lead: ReactNode;
  title: string;
  aside?: ReactNode;
  detail?: string;
  head?: boolean;
  active: boolean;
  onPick: () => void;
  onOpen: () => void;
}) {
  const tone = head ? (active ? 'bg-white/[0.11]' : 'bg-surface-raised') : active ? 'bg-white/[0.08]' : '';

  return (
    <Link
      href={href}
      data-active={active}
      onPointerMove={onPick}
      onClick={onOpen}
      className={`flex scroll-my-3 items-start gap-3 px-3.5 outline-none transition-colors duration-100 focus-visible:bg-white/[0.08] ${head ? 'py-3' : 'border-t border-hairline py-2.5'} ${tone}`}
    >
      <span className="flex h-5 flex-none items-center">{lead}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <span className={`min-w-0 truncate text-white ${head ? 'text-[0.90625rem] font-semibold' : 'text-sm font-medium'} ${aside ? 'sm:max-w-[75%] sm:shrink-0' : ''}`}>
            <Marked text={title} />
          </span>
          {aside}
        </span>
        {detail && (
          <span className="line-clamp-2 text-note text-fg-muted">
            <Marked text={detail} />
          </span>
        )}
      </span>
      <CornerDownLeft
        className={`mt-0.5 size-4 flex-none text-fg-muted transition-[opacity,translate] duration-150 ease-out motion-reduce:transition-none max-sm:hidden ${active ? '' : '-translate-x-1 opacity-0'}`}
        aria-hidden="true"
      />
    </Link>
  );
}

// Clicking a control leaves the cursor in the search box.
function keepFocus(event: MouseEvent) {
  event.preventDefault();
}

const ENTER = 'transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none';

function Key({ children }: { children: ReactNode }) {
  return <kbd className="flex size-5 items-center justify-center rounded-[5px] border border-hairline-strong [&>svg]:size-3">{children}</kbd>;
}

export default function DefaultSearchDialog({ open, onOpenChange }: SharedProps) {
  const router = useRouter();
  const segment = usePathname().split('/')[1];
  const version = Object.hasOwn(VERSIONS, segment) ? segment : undefined;
  const scope = version ?? 'v2';
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [widened, setWidened] = useState<boolean | null>(null);
  const everywhere = widened ?? !version;
  const { loaded, isLoading } = useResults(search.trim(), everywhere ? undefined : scope, open);
  const results = loaded?.results;
  const query = loaded?.query ?? '';
  const list = useRef<HTMLDivElement | null>(null);

  const cards = useMemo(() => {
    const all = results?.cards ?? [];
    if (tab === 'all' || !query) return all;

    return all.filter((card) => (card.endpoints === undefined) === (tab === 'guides'));
  }, [results, tab, query]);

  const targets = useMemo(() => cards.flatMap((card) => [...(card.url ? [card.url] : []), ...card.rows.map((row) => row.url)]), [cards]);
  const [picked, setPicked] = useState<{ targets: string[]; url: string } | null>(null);
  const active = picked?.targets === targets ? picked.url : targets[0];

  useEffect(() => {
    list.current?.scrollTo(0, 0);
  }, [cards]);

  // The frame around the list eases to the list's height as results change.
  const viewport = useCallback((node: HTMLDivElement) => {
    const observer = new ResizeObserver(() => node.parentElement?.style.setProperty('--list-height', `${node.offsetHeight}px`));

    list.current = node;
    observer.observe(node);

    return () => {
      list.current = null;
      observer.disconnect();
    };
  }, []);

  const counts = results && query ? { all: results.guides + results.endpoints, guides: results.guides, api: results.endpoints } : null;
  const shown = cards.reduce((sum, card) => sum + (card.endpoints === undefined ? 1 : card.rows.length), 0);

  function onKeyDown(event: KeyboardEvent) {
    if (event.nativeEvent.isComposing || !active) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const url = targets.at((targets.indexOf(active) + (event.key === 'ArrowDown' ? 1 : -1)) % targets.length);
      if (!url) return;

      event.preventDefault();
      setPicked({ targets, url });
      requestAnimationFrame(() => list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }));
    }

    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      router.push(active);
      onOpenChange(false);
    }
  }

  function entry(url: string) {
    return {
      href: url,
      active: url === active,
      onPick: () => {
        if (url !== active) setPicked({ targets, url });
      },
      onOpen: () => onOpenChange(false),
    };
  }

  function card({ id, url, title, crumbs, description, rows, endpoints }: SearchCard, index: number) {
    const trail = crumbs.join(' › ');
    const crumb = 'min-w-0 truncate text-ui-sm text-fg-subtle sm:ml-auto sm:shrink-[8]';

    return (
      <div key={id} style={{ transitionDelay: `${Math.min(index, 4) * 25}ms` }} className={`flex-none overflow-hidden rounded-xl border ${ENTER}`}>
        {url ? (
          <Entry
            {...entry(url)}
            head
            lead={<FileText className="size-4 text-fg-muted" aria-hidden="true" />}
            title={title}
            aside={<span className={crumb}>{trail}</span>}
            detail={description}
          />
        ) : (
          <div className="flex items-start gap-3 bg-surface-raised px-3.5 py-3">
            <Braces className="mt-0.5 size-4 flex-none text-fg-muted" aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-baseline sm:gap-3">
              <span className="min-w-0 truncate text-[0.90625rem] font-semibold text-white">{title}</span>
              <span className={crumb}>
                {trail} · {endpoints} {endpoints === 1 ? 'endpoint' : 'endpoints'}
              </span>
            </span>
          </div>
        )}
        {rows.map((row) => (
          <Entry
            key={row.url}
            {...entry(row.url)}
            lead={
              row.method ? (
                <span className={`min-w-10 rounded py-[3px] text-center font-mono text-mono-sm font-medium leading-tight ${METHODS[row.method] ?? 'bg-yellow/15 text-yellow'}`}>
                  {row.method === 'DELETE' ? 'DEL' : row.method}
                </span>
              ) : (
                <Hash className="size-4 text-fg-subtle" aria-hidden="true" />
              )
            }
            title={row.title}
            aside={row.path && <span className="min-w-0 truncate font-mono text-mono-md text-fg-subtle sm:ml-auto sm:shrink-[8]">{row.path}</span>}
            detail={row.excerpt}
          />
        ))}
      </div>
    );
  }

  let empty: { title: string; action?: string; onAction?: () => void } | null = null;

  if (loaded && !results) empty = { title: 'Search is unavailable right now.' };
  else if (query && results?.cards.length && !cards.length) {
    empty = { title: `No ${tab === 'api' ? 'endpoints' : 'guides'} for “${query}”`, action: 'Show all results', onAction: () => setTab('all') };
  } else if (query && results && !cards.length) {
    empty = everywhere
      ? { title: `No results for “${query}”` }
      : { title: `No results for “${query}” in ${VERSIONS[scope]}`, action: 'Search all versions', onAction: () => setWidened(true) };
  }

  return (
    <SearchDialog search={search} onSearchChange={setSearch} isLoading={isLoading} open={open} onOpenChange={onOpenChange}>
      <SearchDialogOverlay className="z-[70]" />
      <SearchDialogContent className="z-[70] max-w-[780px] rounded-[14px] md:top-[10vh]" onKeyDown={onKeyDown}>
        <div className="flex h-[60px] items-center gap-3 border-b-0! px-4">
          <SearchDialogIcon className="size-[18px] flex-none" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search the docs"
            aria-label="Search the documentation"
            className="h-11 w-0 flex-1 bg-transparent text-[1.0625rem] text-white placeholder:text-fg-subtle focus-visible:outline-none"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => onOpenChange(false)}
            className="h-[26px] flex-none rounded-md border border-hairline-strong px-2 font-mono text-mono-sm text-fg-muted transition-colors hover:text-white"
          >
            ESC
          </button>
        </div>

        <div className="flex h-11 items-stretch gap-5 px-4">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onMouseDown={keepFocus}
              onClick={() => setTab(id)}
              className={`relative flex items-center gap-2 text-[0.84375rem] font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent after:transition-[scale] after:duration-200 after:ease-out motion-reduce:after:transition-none ${tab === id ? 'text-white' : 'text-fg-subtle after:scale-x-0 hover:text-white'}`}
            >
              {label}
              {counts && <span className="rounded-full bg-white/10 px-1.5 py-px font-mono text-mono-sm font-normal text-fg-strong max-sm:hidden">{counts[id]}</span>}
            </button>
          ))}
          <div className="ml-auto flex gap-0.5 self-center rounded-[9px] border border-hairline p-[3px]">
            {[false, true].map((all) => (
              <button
                key={String(all)}
                type="button"
                aria-pressed={everywhere === all}
                onMouseDown={keepFocus}
                onClick={() => setWidened(all)}
                className={`h-6 rounded-md px-2.5 text-ui-sm font-medium transition-colors ${everywhere === all ? 'bg-white/10 text-white' : 'text-fg-subtle hover:text-white'}`}
              >
                {all ? 'All versions' : VERSIONS[scope].replace('Pterodactyl ', '')}
              </button>
            ))}
          </div>
        </div>

        <div data-empty={!cards.length && !empty} className="h-(--list-height) overflow-hidden transition-[height] duration-150 ease-out motion-reduce:transition-none">
          <div ref={viewport} className="flex max-h-[min(590px,60dvh)] flex-col gap-2.5 overflow-y-auto p-3 empty:p-0">
            {cards.map(card)}
            {counts && cards.length > 0 && shown < counts[tab] && (
              <p className="py-1 text-center text-ui-sm text-fg-subtle">
                Showing {shown} of {counts[tab]} results
              </p>
            )}
            {empty && (
              <div className={`flex flex-col items-center gap-3 px-6 py-9 text-center ${ENTER}`}>
                <p className="text-body font-medium text-white">{empty.title}</p>
                {empty.action && (
                  <button
                    type="button"
                    onMouseDown={keepFocus}
                    onClick={empty.onAction}
                    className="h-[34px] rounded-lg border border-hairline-strong px-3.5 text-note font-medium text-white transition-colors hover:bg-surface-raised"
                  >
                    {empty.action}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex h-11 items-center gap-4 px-4 text-ui-sm text-fg-subtle">
          <span className="flex items-center gap-1.5 max-sm:hidden">
            <Key>
              <ArrowUp aria-hidden="true" />
            </Key>
            <Key>
              <ArrowDown aria-hidden="true" />
            </Key>
            Navigate
          </span>
          <span className="flex items-center gap-1.5 max-sm:hidden">
            <Key>
              <CornerDownLeft aria-hidden="true" />
            </Key>
            Open
          </span>
          <span className="ml-auto">{query ? `Searching ${everywhere ? 'all versions' : VERSIONS[scope]}` : cards.length > 0 && 'Suggested pages'}</span>
        </div>
      </SearchDialogContent>
    </SearchDialog>
  );
}
