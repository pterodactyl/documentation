// @pterodactyl/kit: the shared visual system for Pterodactyl's sites.
//
//   tokens.css, kit.css      the tokens and primitives (import in your CSS)
//   core/                    the Bayer threshold, the frame-loop contract, GL helpers,
//                            the sites and their shared top bar's menus
//   shaders/                 WebGL surfaces: the light field, the dither image
//   canvas/                  CPU surfaces: the light buffer, the dithered sparkline
//   react/                   thin client components over the above
//
// Framework-free at the core; the React wrappers are 'use client' and work in
// Next (the docs) and Astro islands (pterodactyl.io) alike. See DESIGN.md.
export { BAYER8, bayer, GLSL_BAYER, GLSL_NOISE } from './core/bayer';
export { dpr, prefersReducedMotion, visibleLoop, whenNear, type VisibleLoop } from './core/loop';
export { buildProgram, fullscreenTriangle, FULLSCREEN_VERT, hexToRgb, loseContext, type PendingProgram, type RGB } from './core/gl';
export {
  mountLightField,
  type LightField,
  type LightFieldDirection,
  type LightFieldMode,
  type LightFieldMotion,
  type LightFieldOptions,
  type LightFieldPattern,
  type LightFieldSettings,
} from './shaders/lightfield';
export { mountDitherImage, type DitherImage, type DitherImageOptions } from './shaders/ditherimage';
export { LightBuffer, type Color } from './canvas/lightbuffer';
export { drawDitherSpark, fitCanvas, type SparkOptions } from './canvas/spark';
export { HUES, type Hue } from './hues';
export { edgeLight, lightVariant, seedOf } from './core/seed';
export { DISCORD_URL, GITHUB_URL, MENUS, SITES, resolveHref, type NavGroup, type NavLink, type NavMenu, type SiteId } from './core/sites';
