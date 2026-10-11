// The CPU half of the dither: a light buffer for canvas figures.
//
// A figure draws its solid things (houses, nodes, panels) as plain pixels,
// and everything that is light (a window, a halo, a beam, a pool on the
// ground) as calls to `add` and `beam`. Light accumulates per grid cell in
// colour and intensity; `paint` then writes each cell whose intensity clears
// its Bayer threshold as a dot. So light on a canvas figure dithers on exactly
// the grid and threshold the WebGL light field does, and a figure and the
// field behind it read as one picture.
//
// Colours are 0..255 RGB. Positions and radii are in grid cells.
import { bayer } from '../core/bayer';

export type Color = [number, number, number];

export class LightBuffer {
  cols = 0;
  rows = 0;
  private R = new Float32Array(0);
  private G = new Float32Array(0);
  private B = new Float32Array(0);
  private I = new Float32Array(0);

  resize(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    const n = cols * rows;
    this.R = new Float32Array(n);
    this.G = new Float32Array(n);
    this.B = new Float32Array(n);
    this.I = new Float32Array(n);
  }

  clear() {
    this.R.fill(0);
    this.G.fill(0);
    this.B.fill(0);
    this.I.fill(0);
  }

  /** a round light at (x, y): `squash` flattens it into a pool, `soft` sets the falloff exponent */
  add(x: number, y: number, radius: number, power: number, c: Color, squash = 1, soft = 2) {
    const { cols, rows } = this;
    const x0 = Math.max(0, Math.floor(x - radius)), x1 = Math.min(cols - 1, Math.ceil(x + radius));
    const y0 = Math.max(0, Math.floor(y - radius / squash)), y1 = Math.min(rows - 1, Math.ceil(y + radius / squash));
    for (let yy = y0; yy <= y1; yy++) {
      const dy = (yy - y) * squash;
      for (let xx = x0; xx <= x1; xx++) {
        const dx = xx - x;
        const d = Math.sqrt(dx * dx + dy * dy) / radius;
        if (d >= 1) continue;
        this.deposit(yy * cols + xx, Math.pow(1 - d, soft) * power, c);
      }
    }
  }

  /** a beam from (x, y) at `angle` radians (0 = right, up is positive), widening by `spread` */
  beam(x: number, y: number, angle: number, length: number, spread: number, power: number, c: Color) {
    const { cols, rows } = this;
    const dx = Math.cos(angle), dy = -Math.sin(angle);
    const tan = Math.tan(spread);
    const ex = x + dx * length, ey = y + dy * length;
    const pad = length * tan + 2;
    const x0 = Math.max(0, Math.floor(Math.min(x, ex) - pad)), x1 = Math.min(cols - 1, Math.ceil(Math.max(x, ex) + pad));
    const y0 = Math.max(0, Math.floor(Math.min(y, ey) - pad)), y1 = Math.min(rows - 1, Math.ceil(Math.max(y, ey) + pad));
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const vx = xx - x, vy = yy - y;
        const along = vx * dx + vy * dy;
        if (along <= 0 || along > length) continue;
        const perp = Math.abs(vx * dy - vy * dx);
        const width = along * tan + 0.8;
        if (perp > width) continue;
        this.deposit(yy * cols + xx, (1 - along / length) * (1 - perp / width) * power, c);
      }
    }
  }

  private deposit(i: number, f: number, c: Color) {
    this.R[i] += c[0] * f;
    this.G[i] += c[1] * f;
    this.B[i] += c[2] * f;
    this.I[i] += f;
  }

  /**
   * Write the lit cells into a pixel buffer (an ImageData's data as 32-bit
   * ABGR words) `width` × `height` device pixels: each lit cell is a `dot`-sized
   * square in the corner of its `cell`-sized slot, its colour the light's
   * colour, brighter where the light is stronger.
   */
  paint(px: Uint32Array, width: number, height: number, cell: number, dot = Math.max(1, Math.round(cell * 0.5))) {
    px.fill(0);
    const { cols, rows, R, G, B, I } = this;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const v = I[i];
        if (v <= 0.001 || v < bayer(x, y)) continue;
        const k = (0.42 + 0.58 * Math.min(v, 1)) / v;
        const word = (255 << 24) | ((Math.min(255, B[i] * k) & 255) << 16) | ((Math.min(255, G[i] * k) & 255) << 8) | (Math.min(255, R[i] * k) & 255);
        const px0 = x * cell, py0 = y * cell;
        for (let yy = 0; yy < dot && py0 + yy < height; yy++) {
          const row = (py0 + yy) * width + px0;
          for (let xx = 0; xx < dot && px0 + xx < width; xx++) px[row + xx] = word;
        }
      }
    }
  }
}
