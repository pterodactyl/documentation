// The ordered-dither threshold every surface in the kit shares: an 8×8 Bayer
// matrix. A cell is lit when its intensity clears the threshold at its
// position, so light falls off as a structured pattern of dots rather than
// noise, and two figures drawn side by side dither in step.
//
// Thresholds are offset by half a step ((n + 0.5) / 64), so no cell has a
// threshold of exactly 0: without that, one cell per 8×8 block is lit at
// zero intensity and a dark area shows a regular grid of stray dots.

const RAW = [
  0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
];

/** The 64 thresholds, row-major, each in (0, 1). */
export const BAYER8: readonly number[] = RAW.map((v) => (v + 0.5) / 64);

/** The threshold for a cell at integer grid position (x, y). */
export const bayer = (x: number, y: number) => BAYER8[(y & 7) * 8 + (x & 7)];

/**
 * The same matrix in GLSL, built from the 2×2 recurrence. `bayer8(cell)`
 * returns the threshold for an integer cell id; add `0.5 / 64.0` for the
 * offset described above (the shaders do).
 */
export const GLSL_BAYER = /* glsl */ `
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
`;

/** Value noise and fBm, shared by the shaders that need a drifting fog. */
export const GLSL_NOISE = /* glsl */ `
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
`;
