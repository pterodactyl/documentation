'use client';
// <SiteNav>: the top bar every Pterodactyl site shares (DESIGN.md § 7.6).
//
// The same four menus in the same order on every site, so each site is one
// click from the others. On wide screens the menus open in one panel that
// takes the size of the open menu and slides between them; on phones a menu
// button opens a full-screen list. The links come from core/sites.ts.
import { ArrowRight, ArrowUpRight, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { DISCORD_URL, GITHUB_URL, MENUS, SITES, resolveHref, type NavLink, type NavMenu, type SiteId } from '../core/sites';
import { LightField } from './LightField';
import { Lockup } from './Lockup';
import { DiscordMark, GitHubMark } from './Marks';

type MenuId = NavMenu['id'];

export interface SiteNavProps {
  /** the site this bar is on */
  current: SiteId;
  /** a search trigger, on a site that has search */
  search?: ReactNode;
  /** controls only this site has: a theme switch, an account menu */
  actions?: ReactNode;
}

// A hover opens a menu after a short wait, so a pointer that only crosses
// the bar opens nothing. Leaving waits too, so the pointer can cross the gap
// between the bar and the panel.
const OPEN_DELAY = 70;
const CLOSE_DELAY = 160;
// The panel's fade-out, before it leaves the page (and its light frees the GPU)
const FADE_OUT = 220;

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function SiteNav({ current, search, actions }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-black/90 backdrop-blur-md">
      <nav aria-label="Pterodactyl" className="wrapper flex h-nav items-center gap-6 px-gutter sm:px-gutter-lg">
        <Brand current={current} />
        <Menus current={current} />
        <div data-nav-end className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {search}
          {actions}
          {/* On phones GitHub is in the menu, which leaves room for the site's own buttons */}
          <a href={GITHUB_URL} aria-label="Pterodactyl on GitHub" className="btn btn-ghost max-sm:hidden">
            <GitHubMark className="size-4" />
            GitHub
          </a>
          <Sheet current={current} />
        </div>
      </nav>
    </header>
  );
}

/** The lockup, which always goes to pterodactyl.io, and the name of the site the reader is on. */
function Brand({ current }: { current: SiteId }) {
  const site = SITES[current];
  return (
    <div className="flex shrink-0 items-center">
      <a href={resolveHref({ site: 'www', href: '/' }, current)} aria-label="Pterodactyl home" className="flex min-h-11 items-center text-white">
        <Lockup className="h-5 w-auto" />
      </a>
      {current !== 'www' && (
        <a href={site.home} className="ml-3 flex min-h-11 items-center font-mono text-mono-md text-fg-subtle transition-colors hover:text-white">
          <span className="border-l border-hairline-strong pl-3">{site.label}</span>
        </a>
      )}
    </div>
  );
}

/* ---- Wide screens: the menus and their panel ----------------------------- */

function Menus({ current }: { current: SiteId }) {
  const [open, setOpen] = useState<MenuId | null>(null);
  // The panel stays on the page while it fades out.
  const [mounted, setMounted] = useState(false);
  const [box, setBox] = useState<{ x: number; w: number; h: number } | null>(null);
  // Off for the first frame after opening, so the panel appears in place
  // rather than sliding in from where it last was.
  const [settled, setSettled] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const triggers = useRef(new Map<MenuId, HTMLButtonElement>());
  const panes = useRef(new Map<MenuId, HTMLDivElement>());
  const timer = useRef<number | undefined>(undefined);
  const hoveredAt = useRef(0);
  const focusFirst = useRef(false);
  const last = useRef(0);

  const index = open ? MENUS.findIndex((m) => m.id === open) : -1;
  if (index >= 0) last.current = index;
  const shown = index >= 0 ? index : last.current;

  const clear = () => window.clearTimeout(timer.current);
  const later = (fn: () => void, ms: number) => {
    clear();
    timer.current = window.setTimeout(fn, ms);
  };
  const show = useCallback((id: MenuId) => {
    window.clearTimeout(timer.current);
    setOpen(id);
    setMounted(true);
  }, []);
  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(null);
  }, []);

  // Size and place the panel for the open menu before the browser paints.
  useIsoLayoutEffect(() => {
    if (!open || !mounted) return;
    const pane = panes.current.get(open);
    const trigger = triggers.current.get(open);
    const nav = root.current?.closest('nav');
    if (!pane || !trigger || !nav) return;
    const n = nav.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();
    const w = pane.offsetWidth;
    const h = pane.offsetHeight;
    const x = Math.max(0, Math.min(t.left + t.width / 2 - w / 2 - n.left, n.width - w - 2));
    setBox({ x, w, h });
    if (focusFirst.current) {
      focusFirst.current = false;
      pane.querySelector<HTMLElement>('a')?.focus();
    }
  }, [open, mounted]);

  // Turn the movement on only once the first place is in the computed style
  // (reading the width makes the browser compute it). A timer, not animation
  // frames: a tab in the background draws no frames.
  useEffect(() => {
    if (!box || settled) return;
    void panel.current?.offsetWidth;
    const t = window.setTimeout(() => setSettled(true), 50);
    return () => window.clearTimeout(t);
  }, [box, settled]);

  useEffect(() => {
    if (open || !mounted) return;
    const t = window.setTimeout(() => {
      setMounted(false);
      setBox(null);
      setSettled(false);
    }, FADE_OUT);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const down = (e: globalThis.PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener('pointerdown', down);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerdown', down);
      window.removeEventListener('resize', hide);
    };
  }, [open, hide]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const mouse = (e: PointerEvent) => e.pointerType === 'mouse';

  const onTriggerEnter = (id: MenuId) => (e: PointerEvent) => {
    if (!mouse(e)) return;
    const go = () => {
      hoveredAt.current = performance.now();
      show(id);
    };
    if (open) go();
    else later(go, OPEN_DELAY);
  };

  const onTriggerClick = (id: MenuId) => () => {
    // A click just after a hover opened the menu is the reader confirming it.
    if (open === id && performance.now() - hoveredAt.current > 500) hide();
    else show(id);
  };

  const focusTrigger = (i: number) => triggers.current.get(MENUS[i].id)?.focus();

  const onTriggerKey = (id: MenuId, i: number) => (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey && open === id)) {
      e.preventDefault();
      if (open === id) panes.current.get(id)?.querySelector<HTMLElement>('a')?.focus();
      else {
        focusFirst.current = true;
        show(id);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = (i + (e.key === 'ArrowRight' ? 1 : MENUS.length - 1)) % MENUS.length;
      focusTrigger(next);
      if (open) show(MENUS[next].id);
    }
  };

  // Tab runs from a trigger through its menu and on to the next trigger, the
  // order the reader sees, although the panel comes later on the page.
  const onPaneKey = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const links = [...e.currentTarget.querySelectorAll<HTMLElement>('a')];
    if (e.shiftKey && document.activeElement === links[0]) {
      e.preventDefault();
      focusTrigger(i);
    } else if (!e.shiftKey && document.activeElement === links[links.length - 1]) {
      e.preventDefault();
      hide();
      if (i + 1 < MENUS.length) focusTrigger(i + 1);
      else root.current?.closest('nav')?.querySelector<HTMLElement>('[data-nav-end] a, [data-nav-end] button')?.focus();
    }
  };

  return (
    <div
      ref={root}
      className="hidden lg:block"
      onPointerEnter={(e) => mouse(e) && open && clear()}
      onPointerLeave={(e) => mouse(e) && later(hide, CLOSE_DELAY)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          const id = open;
          hide();
          triggers.current.get(id)?.focus();
        }
      }}
      onBlur={(e) => {
        if (open && e.relatedTarget && !root.current?.contains(e.relatedTarget as Node)) hide();
      }}
    >
      <ul className="flex items-center">
        {MENUS.map((menu, i) => {
          const here = menu.site === current;
          return (
            <li key={menu.id}>
              <button
                ref={(el) => {
                  if (el) triggers.current.set(menu.id, el);
                }}
                type="button"
                aria-expanded={open === menu.id}
                aria-controls={mounted ? `sitenav-${menu.id}` : undefined}
                aria-current={here ? 'true' : undefined}
                onPointerEnter={onTriggerEnter(menu.id)}
                onPointerLeave={(e) => mouse(e) && !open && clear()}
                onClick={onTriggerClick(menu.id)}
                onKeyDown={onTriggerKey(menu.id, i)}
                className="group/trigger flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-ui text-fg-subtle transition-colors hover:text-white aria-expanded:text-white aria-[current=true]:text-white"
              >
                {here && <Lamp hue={menu.hue} />}
                {menu.label}
                <ChevronDown
                  className="size-3.5 text-fg-faint transition-transform duration-300 ease-out group-aria-expanded/trigger:rotate-180"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {mounted && (
        <div
          ref={panel}
          className="sitenav-panel"
          data-open={open ? '' : undefined}
          data-settled={settled ? '' : undefined}
          style={
            {
              '--x': `${box?.x ?? 0}px`,
              '--w': `${box?.w ?? 0}px`,
              '--h': `${box?.h ?? 0}px`,
              visibility: box ? undefined : 'hidden',
            } as CSSProperties
          }
        >
          {/* One light for every menu: it eases to each menu's hue. */}
          <LightField
            mode="glow"
            color={MENUS[shown].hue}
            focus={[0.3, 0.93]}
            radius={0.42}
            intensity={0.8}
            wash={0.14}
            lazy={false}
            className="sitenav-light"
          />
          {MENUS.map((menu, i) => (
            <div
              key={menu.id}
              id={`sitenav-${menu.id}`}
              ref={(el) => {
                if (el) panes.current.set(menu.id, el);
              }}
              className="sitenav-pane"
              data-pos={i < shown ? 'before' : i > shown ? 'after' : 'active'}
              inert={i !== index}
              onKeyDown={onPaneKey(i)}
            >
              <Pane menu={menu} current={current} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pane({ menu, current }: { menu: NavMenu; current: SiteId }) {
  const f = menu.feature;
  return (
    <div className="flex">
      {/* As wide as its address needs (never less than 15rem), so the
          address fits at any text size; the words wrap to that width. */}
      <a href={resolveHref(f, current)} className="group/feature flex w-min min-w-60 shrink-0 flex-col justify-between border-r p-5 outline-none">
        <span>
          <span className="block text-entry text-white">{f.label}</span>
          <span className="mt-1.5 block text-note text-fg-subtle">{f.text}</span>
        </span>
        {/* The address the link goes to: the figure the light sits under */}
        <span className="mt-12 inline-flex items-center gap-2 self-start rounded-lg border border-hairline-strong bg-black/80 px-3 py-2 font-mono text-mono-sm whitespace-nowrap text-fg-strong transition-colors group-hover/feature:border-fg-ghost group-hover/feature:text-white group-focus-visible/feature:border-accent">
          <Lamp hue={menu.hue} />
          {f.host}
          {f.site ? (
            <ArrowRight className="size-3.5 text-fg-ghost transition-[translate,color] group-hover/feature:translate-x-0.5 group-hover/feature:text-accent" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <ArrowUpRight className="size-3.5 text-fg-ghost transition-colors group-hover/feature:text-accent" strokeWidth={1.75} aria-hidden="true" />
          )}
        </span>
      </a>
      <div className="flex gap-8 py-5 pr-6 pl-6">
        {menu.groups.map((group) => (
          <div key={group.title} className="w-44">
            <Heading group={group} />
            <ul className="mt-1.5">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Item link={link} current={current} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A section's colour as a lamp on the dot grid (kit.css, .status-dot) */
function Lamp({ hue }: { hue: string }) {
  return <span className="status-dot is-lit" style={{ '--lamp': hue } as CSSProperties} aria-hidden="true" />;
}

function Heading({ group }: { group: NavMenu['groups'][number] }) {
  return (
    <p className="flex min-h-7 items-center gap-2 text-ui-sm text-fg-faint">
      {group.status && <span className={`status-dot ${group.status.dot}`} aria-hidden="true" />}
      {group.title}
      {group.status && <span className="font-mono text-mono-xs text-fg-dim">{group.status.label}</span>}
    </p>
  );
}

function Item({ link, current, large }: { link: NavLink; current: SiteId; large?: boolean }) {
  return (
    <a
      href={resolveHref(link, current)}
      className={`group/item -mx-2 flex items-center gap-2.5 rounded-md px-2 text-fg-muted transition-colors hover:bg-surface-raised hover:text-white focus-visible:bg-surface-raised focus-visible:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent ${large ? 'min-h-11 text-body' : 'min-h-9 text-ui'}`}
    >
      {link.hue && <Lamp hue={link.hue} />}
      <span className="min-w-0 flex-1 truncate">{link.label}</span>
      {link.site ? (
        <ArrowRight
          className="size-3.5 shrink-0 -translate-x-1 text-accent opacity-0 transition-[opacity,translate] group-hover/item:translate-x-0 group-hover/item:opacity-100 group-focus-visible/item:translate-x-0 group-focus-visible/item:opacity-100"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ) : (
        <ArrowUpRight className="size-3.5 shrink-0 text-fg-ghost" strokeWidth={1.75} aria-hidden="true" />
      )}
    </a>
  );
}

/* ---- Phones: the full-screen menu --------------------------------------- */

function Sheet({ current }: { current: SiteId }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [expanded, setExpanded] = useState<MenuId | null>(() => MENUS.find((m) => m.site === current)?.id ?? null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const release = () => (document.documentElement.style.overflow = '');
    const wide = window.matchMedia('(min-width: 64rem)');
    const onWide = (e: MediaQueryListEvent) => e.matches && dialog.open && dialog.close();
    dialog.addEventListener('close', release);
    wide.addEventListener('change', onWide);
    return () => {
      dialog.removeEventListener('close', release);
      wide.removeEventListener('change', onWide);
    };
  }, []);

  const openSheet = () => {
    ref.current?.showModal();
    document.documentElement.style.overflow = 'hidden';
  };

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-label="Open menu"
        aria-haspopup="dialog"
        className="flex size-11 items-center justify-center rounded-lg border border-hairline-strong text-fg-strong transition-colors hover:bg-surface-raised lg:hidden"
      >
        <MenuIcon className="size-5" strokeWidth={1.5} aria-hidden="true" />
      </button>

      <dialog
        ref={ref}
        aria-label="Menu"
        className="sitenav-sheet"
        // A link closes the menu, so it is not open on a page the reader comes back to.
        onClick={(e) => (e.target as Element).closest('a') && ref.current?.close()}
      >
        <div className="wrapper flex min-h-full flex-col">
          <div className="flex h-nav shrink-0 items-center justify-between gap-3 border-b px-gutter sm:px-gutter-lg">
            <Brand current={current} />
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-lg border border-hairline-strong text-fg-strong transition-colors hover:bg-surface-raised"
            >
              <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>

          <div className="sitenav-sheet-body flex flex-1 flex-col">
            {MENUS.map((menu) => {
              const isOpen = expanded === menu.id;
              const f = menu.feature;
              return (
                <section key={menu.id} className="border-b">
                  <h2>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded(isOpen ? null : menu.id)}
                      className="group/fold flex min-h-16 w-full items-center gap-3 px-gutter text-left sm:px-gutter-lg"
                    >
                      <Lamp hue={menu.hue} />
                      <span className="flex-1 text-title text-white">{menu.label}</span>
                      <ChevronDown
                        className="size-5 text-fg-faint transition-transform duration-300 ease-out group-aria-expanded/fold:rotate-180"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                  </h2>
                  <div className="sitenav-fold" data-open={isOpen ? '' : undefined} inert={!isOpen}>
                    <div>
                      <div className="px-gutter pb-7 sm:px-gutter-lg">
                        <a href={resolveHref(f, current)} className="flex items-center justify-between gap-4 rounded-xl border border-hairline-strong bg-surface px-4 py-3.5">
                          <span className="min-w-0">
                            <span className="block text-entry text-white">{f.label}</span>
                            <span className="mt-1 block font-mono text-mono-sm text-fg-faint">{f.host}</span>
                          </span>
                          {f.site ? (
                            <ArrowRight className="size-4 shrink-0 text-fg-ghost" strokeWidth={1.75} aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="size-4 shrink-0 text-fg-ghost" strokeWidth={1.75} aria-hidden="true" />
                          )}
                        </a>
                        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                          {menu.groups.map((group) => (
                            <div key={group.title}>
                              <Heading group={group} />
                              <ul className="mt-1">
                                {group.links.map((link) => (
                                  <li key={link.label}>
                                    <Item link={link} current={current} large />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );
            })}

            <div className="mt-auto grid grid-cols-2 gap-3 px-gutter py-6 sm:px-gutter-lg">
              <a href={GITHUB_URL} className="btn btn-ghost">
                <GitHubMark className="size-4" />
                GitHub
              </a>
              <a href={DISCORD_URL} className="btn btn-ghost">
                <DiscordMark className="size-4" />
                Discord
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
