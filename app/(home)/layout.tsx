import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { DocsFrame } from '@/components/docs-frame';

export default function Layout({ children }: LayoutProps<'/'>) {
  const base = baseOptions();
  return (
    <DocsLayout tree={source.pageTree} {...base} sidebar={{ collapsible: false }} slots={{ ...base.slots, container: DocsFrame }}>
      {children}
    </DocsLayout>
  );
}
