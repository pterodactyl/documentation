import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { NoTitle } from '@/components/docs-frame';

// The top bar is the kit's SiteNav (components/docs-frame.tsx). It has the
// other sites, GitHub and search, so the sidebar does not repeat them.
export function baseOptions(): BaseLayoutProps {
  return {
    nav: { enabled: false },
    searchToggle: { enabled: false },
    slots: { navTitle: NoTitle },
  };
}
