// @pterodactyl/kit: the shared visual system for Pterodactyl's sites.
//
//   tokens.css, kit.css      the tokens and primitives (import in your CSS)
//   core/                    the Bayer threshold, the frame-loop contract, GL helpers
//   shaders/                 WebGL surfaces: the light field, the dither image
//   canvas/                  CPU surfaces: the light buffer, the dithered sparkline
//   react/                   thin client components over the above
//
// Framework-free at the core; the React wrappers are 'use client' and work in
// Next (the docs) and Astro islands (pterodactyl.io) alike. See DESIGN.md.
export { BAYER8, bayer, GLSL_BAYER, GLSL_NOISE } from './core/bayer';
export { dpr, prefersReducedMotion, visibleLoop, whenNear, type VisibleLoop } from './core/loop';
export { createProgram, fullscreenTriangle, FULLSCREEN_VERT, hexToRgb, loseContext, type RGB } from './core/gl';
export { mountLightField, type LightField, type LightFieldMode, type LightFieldOptions } from './shaders/lightfield';
export { mountDitherImage, type DitherImage, type DitherImageOptions } from './shaders/ditherimage';
export { LightBuffer, type Color } from './canvas/lightbuffer';
export { drawDitherSpark, fitCanvas, type SparkOptions } from './canvas/spark';
export { HUES, type Hue } from './hues';
export { edgeLight, seedOf } from './core/seed';
