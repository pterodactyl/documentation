'use client';

import { useEffect, useState } from 'react';

/**
 * The paths' index: a sticky list beside the rows that marks the one whose
 * middle is crossing the middle of the screen. Each mark takes its row's hue.
 */
export function RowIndex({ rows }: { rows: { id: string; label: string; hue: string }[] }) {
  const [active, setActive] = useState<string | undefined>(rows[0]?.id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.row);
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    for (const row of rows) {
      const el = document.querySelector(`[data-row="${row.id}"]`);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [rows]);

  return (
    <nav className="sticky top-16 px-6 py-10" aria-label="On this page">
      <ol className="space-y-0.5">
        {rows.map((row) => {
          const on = row.id === active;
          return (
            <li key={row.id}>
              <a href={`#${row.id}`} className={`flex min-h-9 items-center gap-3 text-ui transition-colors ${on ? 'text-white' : 'text-fg-faint hover:text-fg-strong'}`}>
                <span
                  aria-hidden="true"
                  className="size-2 rounded-[2px] border transition-all duration-300"
                  style={
                    on
                      ? { borderColor: row.hue, backgroundColor: row.hue, boxShadow: `0 0 10px color-mix(in srgb, ${row.hue} 60%, transparent)`, transform: 'rotate(45deg)' }
                      : { borderColor: 'var(--color-fg-ghost)' }
                  }
                />
                {row.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
