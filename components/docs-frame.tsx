'use client';

import type { ComponentProps } from 'react';
import { ListTree } from 'lucide-react';
import { Container } from 'fumadocs-ui/layouts/docs/slots/container';
import { SidebarTrigger } from 'fumadocs-ui/layouts/docs/slots/sidebar';
import { SiteNav } from '@/kit/react/SiteNav';
import { NavSearch } from '@/components/nav-search';

/**
 * The docs pages' frame: the top bar every Pterodactyl site shares, above
 * Fumadocs' grid. It is the layout's container slot, so it is inside the
 * sidebar's state, and on phones the bar's button opens the page list.
 */
export function DocsFrame(props: ComponentProps<'div'>) {
  return (
    <>
      <SiteNav
        current="docs"
        search={<NavSearch />}
        actions={
          <SidebarTrigger className="btn btn-ghost w-11 px-0 md:hidden">
            <ListTree className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </SidebarTrigger>
        }
      />
      <Container {...props} />
    </>
  );
}

/** The sidebar's title row: empty, because the top bar names the site. */
export function NoTitle() {
  return null;
}
