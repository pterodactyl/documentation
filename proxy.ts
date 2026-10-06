import { type NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';

const { rewrite } = rewritePath('/*path', '/llms.mdx/*path/content.md');

// Agents that ask for Markdown get the page's Markdown at its normal URL.
export function proxy(request: NextRequest) {
  const markdown = isMarkdownPreferred(request) && rewrite(request.nextUrl.pathname);
  return markdown ? NextResponse.rewrite(new URL(markdown, request.nextUrl)) : NextResponse.next();
}

export const config = {
  matcher: ['/v1/:path*', '/v2/:path*'],
};
