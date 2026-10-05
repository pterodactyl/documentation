import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

export const revalidate = false;

// Every image is rendered once, at build time, so these are read from the
// checkout and never from a running server.
const file = (path: string) => readFile(join(process.cwd(), path));

const assets = Promise.all([
  file('app/og/fonts/IBMPlexSans-SemiBold.ttf'),
  file('app/og/fonts/IBMPlexSans-Regular.ttf'),
  file('app/og/fonts/JetBrainsMono-Regular.ttf'),
  file('public/pterodactyl-lockup.svg'),
]);

export async function GET(_req: Request, { params }: RouteContext<'/og/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const [semibold, regular, mono, lockup] = await assets;
  const path = page.slugs.join('/');
  const title = page.data.title;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '0 72px',
          backgroundColor: '#0a0a0a',
          color: '#f5f5f5',
          fontFamily: 'Plex',
        }}
      >
        {/* The page rails. */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            borderLeft: '1px solid rgba(245,245,245,0.08)',
            borderRight: '1px solid rgba(245,245,245,0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '36px 56px',
              borderBottom: '1px solid rgba(245,245,245,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img src={`data:image/svg+xml;base64,${lockup.toString('base64')}`} width={237} height={44} />
              <div
                style={{
                  display: 'flex',
                  marginLeft: 24,
                  paddingLeft: 24,
                  borderLeft: '1px solid rgba(245,245,245,0.14)',
                  fontFamily: 'Mono',
                  fontSize: 24,
                  color: 'rgba(245,245,245,0.55)',
                }}
              >
                docs
              </div>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', padding: '0 56px' }}>
            <div
              style={{
                display: 'flex',
                fontSize: title.length > 34 ? 64 : 84,
                fontWeight: 600,
                lineHeight: 1.04,
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </div>

            {page.data.description ? (
              <div
                style={{
                  display: 'flex',
                  marginTop: 28,
                  maxWidth: 880,
                  fontSize: 30,
                  lineHeight: 1.45,
                  color: 'rgba(245,245,245,0.65)',
                }}
              >
                {page.data.description.length > 150 ? `${page.data.description.slice(0, 149)}…` : page.data.description}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '28px 56px',
              borderTop: '1px solid rgba(245,245,245,0.08)',
              fontFamily: 'Mono',
              fontSize: 22,
              color: 'rgba(245,245,245,0.4)',
            }}
          >
            docs.pterodactyl.io/{path}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Plex', data: semibold, weight: 600, style: 'normal' },
        { name: 'Plex', data: regular, weight: 400, style: 'normal' },
        { name: 'Mono', data: mono, weight: 400, style: 'normal' },
      ],
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
