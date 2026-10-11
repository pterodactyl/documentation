'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { applySetup, useSetup } from '@/components/docs/setup';

/**
 * The API as a request and its response, one endpoint at a time. The
 * endpoints, bodies and responses are the 1.x reference's own (openapi.json);
 * the host is the reader's Panel domain when they have set one. It moves on by
 * itself while on screen, holds while the pointer is over it, and the tabs
 * pick one directly.
 */

type Exchange = {
  method: 'GET' | 'POST';
  path: string;
  key: 'ptlc' | 'ptla';
  body?: string;
  status: string;
  response?: string;
  summary: string;
};

const EXCHANGES: Exchange[] = [
  {
    method: 'GET',
    path: '/api/client/servers/1a7ce997/resources',
    key: 'ptlc',
    status: '200 OK',
    summary: 'Resource usage',
    response: `{
  "object": "stats",
  "attributes": {
    "current_state": "running",
    "is_suspended": false,
    "resources": {
      "memory_bytes": 1285394432,
      "cpu_absolute": 44.21,
      "disk_bytes": 536870912,
      "network_rx_bytes": 694220,
      "network_tx_bytes": 337156
    }
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/client/servers/1a7ce997/power',
    key: 'ptlc',
    body: '{"signal": "restart"}',
    status: '204 No Content',
    summary: 'Change power state',
  },
  {
    method: 'POST',
    path: '/api/client/servers/1a7ce997/command',
    key: 'ptlc',
    body: '{"command": "say Restarting in 5 minutes"}',
    status: '204 No Content',
    summary: 'Send a command',
  },
  {
    method: 'GET',
    path: '/api/application/servers?per_page=2',
    key: 'ptla',
    status: '200 OK',
    summary: 'List servers',
    response: `{
  "object": "list",
  "data": [
    { "object": "server", "attributes": { "id": 5, "name": "aurora-smp", "node": 1 } },
    { "object": "server", "attributes": { "id": 7, "name": "rust-eu-1", "node": 2 } }
  ],
  "meta": { "pagination": { "total": 31, "per_page": 2, "current_page": 1 } }
}`,
  },
];

const METHOD: Record<Exchange['method'], string> = {
  GET: 'text-blue bg-blue/10',
  POST: 'text-green bg-green/10',
};

/** JSON with its keys in the data blue, the way the docs colour JSON keys. */
function Json({ text }: { text: string }): ReactNode {
  return text.split(/("[^"]+"(?=\s*:))/).map((part, i) => (i % 2 ? <span key={i} className="text-blue">{part}</span> : part));
}

export function ApiExchange() {
  const setup = useSetup();
  const [i, setI] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const hold = useRef(false);
  const host = setup.domain ? `https://${applySetup('<domain>', setup)}` : 'https://panel.example.com';
  const ex = EXCHANGES[i];

  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = false;
    const io = new IntersectionObserver((entries) => (visible = entries.some((e) => e.isIntersecting)));
    io.observe(el);
    const id = window.setInterval(() => {
      if (visible && !hold.current && !document.hidden) setI((n) => (n + 1) % EXCHANGES.length);
    }, 5500);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, []);

  const lines = [
    `curl ${ex.method === 'GET' ? '' : `-X ${ex.method} `}"${host}${ex.path}" \\`,
    `  -H "Authorization: Bearer ${ex.key}_••••••••" \\`,
    `  -H "Accept: application/json"${ex.body ? ' \\' : ''}`,
    ...(ex.body ? [`  -d '${ex.body}'`] : []),
  ];

  return (
    <div
      ref={root}
      className="figure-card w-full overflow-hidden"
      onPointerEnter={() => (hold.current = true)}
      onPointerLeave={() => (hold.current = false)}
    >
      <div role="tablist" aria-label="API examples" className="flex gap-1 overflow-x-auto border-b border-hairline px-2 [scrollbar-width:none]">
        {EXCHANGES.map((e, n) => (
          <button
            key={e.path + e.method}
            type="button"
            role="tab"
            aria-selected={n === i}
            onClick={() => setI(n)}
            className={`relative min-h-11 shrink-0 px-3 text-ui-sm whitespace-nowrap transition-colors ${n === i ? 'text-white' : 'text-fg-faint hover:text-fg-strong'}`}
          >
            {e.summary}
            {n === i && <span className="absolute inset-x-3 -bottom-px h-px bg-accent" aria-hidden="true" />}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 sm:px-5">
        <p className="flex min-w-0 items-center gap-2 font-mono text-mono-md">
          <span className={`rounded px-1.5 py-0.5 text-mono-sm ${METHOD[ex.method]}`}>{ex.method}</span>
          <span className="truncate text-fg-strong">{ex.path}</span>
        </p>
        {/* four lines always, so switching examples never changes the card's height */}
        <pre className="mt-3 h-[6.5em] overflow-x-auto font-mono text-mono-md leading-relaxed text-fg-subtle">{lines.join('\n')}</pre>
      </div>

      <div className="mt-4 h-[21rem] border-t border-hairline bg-black/40 px-4 py-4 sm:px-5" aria-live="polite">
        <p className="flex items-center gap-2 font-mono text-mono-sm text-green">
          <span className="status-dot is-running" aria-hidden="true" />
          {ex.status}
        </p>
        {ex.response && (
          <pre className="mt-3 overflow-x-auto font-mono text-mono-md leading-relaxed text-fg-muted">
            <Json text={ex.response} />
          </pre>
        )}
      </div>
    </div>
  );
}
