'use client';

import { useState } from 'react';
import { Segmented, Widget } from '../widget';

type Box = { id: string; label: string; detail?: string; x: number; y: number; w: number; h: number };
type Edge = { id: string; from: string; to: string; label: string; shift?: number };
type Task = 'all' | 'panel' | 'console' | 'sftp' | 'jobs';

const BOXES: Box[] = [
  { id: 'browser', label: 'Browser', x: 20, y: 128, w: 128, h: 52 },
  { id: 'sftp', label: 'SFTP client', x: 20, y: 248, w: 128, h: 52 },
  { id: 'panel', label: 'Panel', detail: 'web server + PHP', x: 256, y: 40, w: 150, h: 60 },
  { id: 'wings', label: 'Wings', detail: 'on each node', x: 256, y: 236, w: 150, h: 60 },
  { id: 'db', label: 'Database', x: 500, y: 16, w: 124, h: 44 },
  { id: 'redis', label: 'Redis', x: 500, y: 82, w: 124, h: 44 },
  { id: 'players', label: 'Players', x: 500, y: 140, w: 124, h: 40 },
  { id: 'docker', label: 'Game servers', detail: 'Docker containers', x: 484, y: 236, w: 140, h: 60 },
];

// `shift` moves a line sideways, so the two connections between the Panel and Wings sit side by side.
const EDGES: Edge[] = [
  { id: 'browser-panel', from: 'browser', to: 'panel', label: '443' },
  { id: 'browser-wings', from: 'browser', to: 'wings', label: '8080' },
  { id: 'sftp-wings', from: 'sftp', to: 'wings', label: '2022' },
  { id: 'panel-wings', from: 'panel', to: 'wings', label: '8080', shift: 24 },
  { id: 'wings-panel', from: 'wings', to: 'panel', label: '443', shift: -24 },
  { id: 'panel-db', from: 'panel', to: 'db', label: '3306' },
  { id: 'panel-redis', from: 'panel', to: 'redis', label: '6379' },
  { id: 'wings-docker', from: 'wings', to: 'docker', label: 'Docker' },
  { id: 'players-docker', from: 'players', to: 'docker', label: 'game port' },
];

const TASKS: Record<Task, { label: string; edges: string[]; text: string }> = {
  all: {
    label: 'Everything',
    edges: EDGES.map((edge) => edge.id),
    text: 'The Panel manages everything, and Wings runs it. The Panel never connects to your game servers. Players connect to them directly, on the ports you assign to each server.',
  },
  panel: {
    label: 'Using the Panel',
    edges: ['browser-panel', 'panel-db', 'panel-redis', 'panel-wings'],
    text: 'Your browser talks to the Panel. The Panel keeps its data in the database and Redis, and calls Wings when something has to happen on a node, such as creating a server.',
  },
  console: {
    label: 'Console',
    edges: ['browser-panel', 'browser-wings', 'wings-docker'],
    text: 'Your browser gets a token from the Panel, then connects to Wings directly. The console and its power buttons use this connection. That is why the node needs a domain name your users can reach, and its own SSL certificate when the Panel uses HTTPS.',
  },
  sftp: {
    label: 'SFTP',
    edges: ['sftp-wings', 'wings-panel'],
    text: 'SFTP clients connect to Wings, not the Panel. Wings asks the Panel to check the password or SSH key.',
  },
  jobs: {
    label: 'Installs and backups',
    edges: ['panel-wings', 'wings-docker', 'wings-panel'],
    text: 'The Panel asks Wings to install or back up a server. Wings does the work and reports back to the Panel when it is done.',
  },
};

const box = (id: string) => BOXES.find((b) => b.id === id)!;
const labelWidth = (edge: Edge) => 16 + edge.label.length * 7;
const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Where a line from a point inside the box towards another point crosses the box's edge. */
function exit(b: Box, from: { x: number; y: number }, toward: { x: number; y: number }) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const tx = dx > 0 ? (b.x + b.w - from.x) / dx : dx < 0 ? (b.x - from.x) / dx : Infinity;
  const ty = dy > 0 ? (b.y + b.h - from.y) / dy : dy < 0 ? (b.y - from.y) / dy : Infinity;
  const scale = Math.min(tx, ty);

  return { x: from.x + dx * scale, y: from.y + dy * scale };
}

function line(edge: Edge) {
  const a = box(edge.from);
  const b = box(edge.to);
  const shift = edge.shift ?? 0;
  const ca = { x: center(a).x + shift, y: center(a).y };
  const cb = { x: center(b).x + shift, y: center(b).y };
  const start = exit(a, ca, cb);
  const end = exit(b, cb, ca);

  return { start, end, mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 } };
}

/** The parts of Pterodactyl and the ports between them. Picking a task highlights the connections it uses. */
export function ArchitectureTour() {
  const [task, setTask] = useState<Task>('all');
  const active = new Set(TASKS[task].edges);
  const activeBoxes = new Set(EDGES.filter((edge) => active.has(edge.id)).flatMap((edge) => [edge.from, edge.to]));

  return (
    <Widget title="How the parts connect" description="Pick a task to see which connections it uses. The numbers are the default ports.">
      <Segmented<Task>
        label="Task"
        value={task}
        onChange={setTask}
        options={(Object.keys(TASKS) as Task[]).map((value) => ({ value, label: TASKS[value].label }))}
      />

      <div className="mt-5 overflow-x-auto">
        <svg viewBox="0 0 644 316" role="img" aria-label="Diagram of the Panel, Wings, and the connections between them" className="w-full min-w-[560px]">
          <defs>
            {(['on', 'off'] as const).map((state) => (
              <marker key={state} id={`arch-arrow-${state}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                <path d="M0 0 L10 5 L0 10 z" fill={state === 'on' ? 'var(--color-accent)' : 'var(--color-fg-ghost)'} />
              </marker>
            ))}
          </defs>

          {EDGES.map((edge) => {
            const { start, end, mid } = line(edge);
            const on = active.has(edge.id);
            return (
              <g key={edge.id} className="transition-opacity duration-200" opacity={on ? 1 : 0.25}>
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={on ? 'var(--color-accent)' : 'var(--color-fg-ghost)'}
                  strokeWidth={on ? 2 : 1.5}
                  markerEnd={`url(#arch-arrow-${on ? 'on' : 'off'})`}
                />
                <rect x={mid.x - labelWidth(edge) / 2} y={mid.y - 10} width={labelWidth(edge)} height="20" rx="5" fill="var(--color-surface-flat)" stroke="var(--color-hairline-strong)" />
                <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill={on ? 'var(--color-white)' : 'var(--color-fg-faint)'}>
                  {edge.label}
                </text>
              </g>
            );
          })}

          {BOXES.map((b) => {
            const on = activeBoxes.has(b.id);
            return (
              <g key={b.id} className="transition-opacity duration-200" opacity={on ? 1 : 0.4}>
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.w}
                  height={b.h}
                  rx="10"
                  fill="var(--color-surface-raised-flat)"
                  stroke={on ? 'var(--color-accent)' : 'var(--color-hairline-strong)'}
                  strokeWidth={on ? 1.5 : 1}
                />
                <text x={b.x + b.w / 2} y={b.y + b.h / 2 + (b.detail ? -3 : 5)} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--color-white)">
                  {b.label}
                </text>
                {b.detail && (
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 15} textAnchor="middle" fontSize="11" fill="var(--color-fg-subtle)">
                    {b.detail}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <p className="mt-4 text-note text-fg-muted">{TASKS[task].text}</p>
    </Widget>
  );
}
