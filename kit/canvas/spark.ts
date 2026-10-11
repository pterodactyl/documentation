// A history drawn on the dither grid: one column per sample, a bright crest
// on top and a body that thins out with Bayer thresholds as it falls, over a
// dotted guide at the top of the range. Past `hot` the whole column takes
// the hot colour, which is how a CPU quota reads: the line climbs to the
// guide and flattens there in pink.
import { bayer } from '../core/bayer';
import { dpr } from '../core/loop';

export interface SparkOptions {
  /** CSS colours. `color` for the body and crest, `hot` above the `hot` threshold. */
  color?: string;
  crest?: string;
  hotColor?: string;
  hotCrest?: string;
  guide?: string;
  /** 0..1: samples above this draw hot (default: never) */
  hot?: number;
  /** cell in CSS pixels */
  cell?: number;
}

/** Size a canvas's backing store to its box at device resolution. Returns false if it has no box yet. */
export function fitCanvas(canvas: HTMLCanvasElement) {
  const r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return false;
  const ratio = dpr();
  canvas.width = Math.round(r.width * ratio);
  canvas.height = Math.round(r.height * ratio);
  return true;
}

/**
 * Draw `values` (0..1, oldest first) into `canvas`, newest at the right edge.
 * Returns how many samples fit, so a caller can keep its history that long.
 */
export function drawDitherSpark(canvas: HTMLCanvasElement, values: number[], opts: SparkOptions = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  const S = Math.max(2, Math.round((opts.cell ?? 2.5) * dpr()));
  const n = Math.floor(canvas.width / S);
  const h = Math.floor(canvas.height / S);
  const series = values.slice(-n);
  while (series.length < n) series.unshift(values[0] ?? 0);
  const hot = opts.hot ?? Infinity;
  const anyHot = (series[series.length - 1] ?? 0) > hot;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // the guide: the top of the range, dotted
  ctx.fillStyle = anyHot ? opts.hotColor ?? 'rgba(255,43,214,0.9)' : opts.guide ?? 'rgba(245,245,245,0.22)';
  for (let x = 0; x < n; x += 2) ctx.fillRect(x * S, 0, S - 1, S - 1);

  for (let x = 0; x < n; x++) {
    const v = Math.min(1, Math.max(0, series[x]));
    const top = Math.max(1, Math.round((1 - v) * (h - 1)));
    const isHot = v > hot;
    for (let y = top; y < h; y++) {
      const crest = y === top;
      // the body thins out as it falls away from the crest
      if (!crest && 0.75 * (1 - (y - top) / h) < bayer(x, y)) continue;
      ctx.fillStyle = isHot
        ? crest ? opts.hotCrest ?? '#ff7ae6' : opts.hotColor ?? 'rgba(255,43,214,0.7)'
        : crest ? opts.crest ?? 'rgba(245,245,245,0.75)' : opts.color ?? 'rgba(245,245,245,0.32)';
      ctx.fillRect(x * S, y * S, S - 1, S - 1);
    }
  }
  return n;
}
