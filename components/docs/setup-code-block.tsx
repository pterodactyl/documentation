'use client';

import { Children, isValidElement, Suspense, type ComponentProps, type ReactNode } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import { applySetup, useSetup } from './setup';

type Props = ComponentProps<'pre'> & { 'data-language'?: string; title?: string };

/** The text of a highlighted code block, read back out of its rendered lines. */
function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return Children.toArray(node.props.children).map(textOf).join('');

  return '';
}

/**
 * Every code block in the docs. It renders as written until the reader enters
 * their own values in a <SetupPanel />; then it is highlighted again in the
 * browser with those values filled in, so what they copy is ready to paste.
 */
export function SetupCodeBlock({ ref: _ref, children, ...props }: Props) {
  const setup = useSetup();
  const original = (
    <CodeBlock {...props}>
      <Pre>{children}</Pre>
    </CodeBlock>
  );

  const code = textOf(children).replace(/\n$/, '');
  const filled = applySetup(code, setup);
  if (filled === code) return original;

  return (
    <Suspense fallback={original}>
      <DynamicCodeBlock
        lang={props['data-language'] ?? 'text'}
        code={filled}
        wrapInSuspense={false}
        codeblock={{ title: props.title }}
        options={{ themes: { light: 'github-light', dark: 'github-dark' } }}
      />
    </Suspense>
  );
}
