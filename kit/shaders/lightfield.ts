// The light field: one small WebGL shader that paints a glow as an ordered
// (Bayer 8×8) dither. The dither sits on a fine grid and each lit cell is only
// a dot inside it, so light reads as a soft halftone rather than a texture
// shouting over the content. Brightness falls with the light, and a faint
// tint fills between the dots so the glow has a body without needing more of
// them.
//
// Scenes:
//   glow     a soft pool of light around a focus point (a hero)
//   beams    long diagonal streaks drifting through fog (a figure's backdrop)
//   horizon  the lit rim of a planet rising off the bottom edge (a closing call)
//   aurora   curtains of light with fine vertical rays
//   contour  a map's height lines ringing a hill under the focus
//   mesh     a network of nodes that blink on their own beat
//   orbit    rings around the focus, each with a comet
//   stream   columns of light running one way, like data
//   ripple   rings from two sources crossing into a moire
//   galaxy   spiral arms turning around a bright core
//
// Character, so no two fields need to look alike:
//   seed      moves the noise: the same settings, a different field
//   chaos     how broken up the light is, from a clean shape to torn cloud
//   grain     the size of the clouds in the light
//   warp      how much the light folds and curls, like smoke
//   motion    drift, swirl, breathe, pulse or still
//   direction which way a drift goes
//   pattern   the dither itself: bayer, bayer4, grain, lines, hatch, halftone
//   twinkle   dots at the edge of the light switch on and off
//   shape     square or round dots
// Every one defaults to the look the field had before it existed.
//
// The output is premultiplied light over a transparent canvas, so it works
// on any background: on black it glows, on white it prints as a coloured
// halftone. Colours are 0..1 RGB; setColor and setIntensity ease, so a theme
// change washes across instead of snapping. update() changes anything else
// at once. Off screen and in hidden tabs the loop does not exist; under
// reduced motion it draws one still frame, and a 'still' field draws only
// when something changes.
import { GLSL_BAYER, GLSL_NOISE } from '../core/bayer';
import { createProgram, FULLSCREEN_VERT, fullscreenTriangle, hexToRgb, loseContext, type RGB } from '../core/gl';
import { dpr, prefersReducedMotion, visibleLoop } from '../core/loop';
import { seedOf } from '../core/seed';

export { hexToRgb, type RGB };

export type LightFieldMode = 'glow' | 'beams' | 'horizon' | 'aurora' | 'contour' | 'mesh' | 'orbit' | 'stream' | 'ripple' | 'galaxy';
export type LightFieldMotion = 'drift' | 'swirl' | 'breathe' | 'pulse' | 'still';
export type LightFieldPattern = 'bayer' | 'bayer4' | 'grain' | 'lines' | 'hatch' | 'halftone';
export type LightFieldDirection = 'left' | 'right' | 'up' | 'down' | number;

export interface LightFieldOptions {
  mode?: LightFieldMode;
  color: RGB;
  /** the deep tone the light falls off into; defaults to a darker `color` */
  color2?: RGB;
  intensity?: number;
  /** focus point in 0..1 canvas space, y measured from the top */
  focus?: [number, number];
  /** glow radius in canvas heights */
  radius?: number;
  /** streak angle in radians (beams) */
  angle?: number;
  /** dither cell in CSS pixels, and the share of it a lit dot fills */
  cell?: number;
  dot?: number;
  /** strength of the soft tint between the dots, the glow's bloom */
  wash?: number;
  speed?: number;
  /** follow the pointer with a small parallax drift */
  pointer?: boolean;
  /** any number or text; moves the noise, so two fields with the same settings differ (0) */
  seed?: number | string;
  /** how broken up the light is: 0 a clean even shape, 1 torn into cloud and holes (0.35) */
  chaos?: number;
  /** the size of the clouds in the light: below 1 larger and softer, above 1 smaller and busier (1) */
  grain?: number;
  /** how much the light folds and curls, like smoke; 0.3 to 1 is useful (0) */
  warp?: number;
  /** drift, swirl (turns around the focus), breathe (swells and settles), pulse (rings move out from the focus), still ('drift') */
  motion?: LightFieldMotion;
  /** which way a drift goes: a word, or degrees with 0 to the right and 90 down (each mode's own way) */
  direction?: LightFieldDirection;
  /** the dither: bayer (8×8), bayer4 (coarser cross-hatch), grain (random, like film), lines (rows, like a CRT), hatch (diagonals), halftone (every dot lit, its size follows the light) ('bayer') */
  pattern?: LightFieldPattern;
  /** dots at the edge of the light switch on and off; 0.2 to 0.6 is useful (0) */
  twinkle?: number;
  /** the shape of a dot ('square'; 'round' for a halftone) */
  shape?: 'square' | 'round';
}

/** Everything update() can change: all but the colours and intensity, which ease. */
export type LightFieldSettings = Omit<LightFieldOptions, 'color' | 'color2' | 'intensity'>;

export interface LightField {
  setColor: (color: RGB, color2?: RGB) => void;
  setIntensity: (v: number) => void;
  update: (settings: LightFieldSettings) => void;
  destroy: () => void;
}

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_clock;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform float u_mode;
uniform float u_int;
uniform float u_ang;
uniform float u_radius;
uniform vec2 u_focus;
uniform vec2 u_ptr;
uniform float u_cell;
// device pixels per canvas pixel: 1, or more for a coarse field (see size())
uniform float u_k;
uniform float u_dot;
uniform float u_wash;
uniform vec2 u_seed;
uniform float u_chaos;
uniform float u_grain;
uniform float u_warp;
uniform float u_motion;
uniform vec3 u_dir;
uniform float u_pattern;
uniform float u_twinkle;
uniform float u_shape;
${GLSL_NOISE}
${GLSL_BAYER}

// Where one layer of a scene samples its noise. q is the point and c the
// focus, both in the layer's own noise space; v is the layer's own drift.
// The seed moves it, the grain scales it, the motion carries it and the
// warp folds it. With the defaults this is q + v * t.
vec2 flow(vec2 q, vec2 v, vec2 c, float t) {
  q *= u_grain;
  c *= u_grain;
  if (u_motion < 0.5) {
    // drift: each layer keeps its own speed; a direction turns them all one way
    q += (u_dir.z > 0.5 ? -u_dir.xy * length(v) : v) * t;
  } else if (u_motion < 1.5) {
    // swirl: the noise turns around the focus
    float a = t * 0.06;
    q = c + mat2(cos(a), -sin(a), sin(a), cos(a)) * (q - c);
  } else {
    // breathe, pulse: the texture all but stands still while the light moves
    q += v * t * 0.2;
  }
  q += u_seed;
  if (u_warp > 0.0) {
    vec2 w = vec2(fbm(q * 0.6 + vec2(3.1, 7.4) + t * 0.02), fbm(q * 0.6 + vec2(8.3, 2.8) - t * 0.02));
    q += (w - 0.5) * 2.5 * u_warp;
  }
  return q;
}

// pulse: thin ripples that move out from the focus, like a sonar sweep;
// d is the distance in radii
float rings(float d, float t) {
  if (u_motion < 2.5 || u_motion > 3.5) return 1.0;
  float r = pow(0.5 + 0.5 * sin(d * 16.0 - t * 1.8), 6.0);
  return 0.62 + 0.9 * r;
}

mat2 turn(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

// mesh: where node c sits, wandering a little in its cell (no chaos: on a grid)
vec2 node(vec2 c, float t, float k) {
  vec2 h = vec2(hash(c + u_seed), hash(c + u_seed + 17.3));
  return c + 0.5 + (h - 0.5) * 0.72 * min(k, 1.4) + 0.06 * sin(t * 0.3 + 6.2831 * h);
}
// the distance from q to the segment a-b, and how far along it q lies
float segment(vec2 q, vec2 a, vec2 b, out float s) {
  vec2 ab = b - a;
  s = clamp(dot(q - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(q - a - ab * s);
}

// The scenes after the first three. Each is its own structure, not a wave:
// curtains, a map, a network, orbits, streams, interference, a spiral. All
// gather at the focus and fall off by the radius, so the light stays behind
// its figure. k is the chaos, 1 at the default.
vec2 more(vec2 uv, vec2 p, vec2 fp, float aspect, float t) {
  vec2 r = (uv - u_focus - u_ptr * 0.015) * vec2(aspect, 1.0);
  float d = length(r) / u_radius;
  float fall = smoothstep(1.0, 0.0, d);
  float k = u_chaos;

  // aurora: two folded curtains over soft lower edges, with irregular rays
  // that lean as they rise
  if (u_mode < 3.5) {
    float I = 0.0, core = 0.0;
    for (int layer = 0; layer < 2; layer++) {
      float L = float(layer);
      float fold = fbm(flow(vec2(p.x * 1.1 + L * 3.7, L), vec2(0.03 + L * 0.015, 0.0), vec2(fp.x * 1.1, L), t));
      float edge = fp.y + 0.16 - L * 0.17 + (fold - 0.5) * 0.75 * k;
      float up = edge - p.y;
      float curtain = smoothstep(-0.015, 0.025, up) * exp(-max(up, 0.0) * (2.6 + L) / u_radius);
      float rays = fbm(flow(vec2(p.x * 13.0 * u_grain + up * 2.2 + L * 9.1, 0.0), vec2(0.05, 0.0), vec2(0.0), t));
      rays = pow(smoothstep(0.3, 0.75, rays), 1.6);
      float span = smoothstep(1.0, 0.2, abs(p.x - fp.x) / (u_radius * 1.7));
      float lit = curtain * (0.25 + 1.15 * rays) * span * (1.0 - L * 0.45);
      I += lit;
      core += curtain * rays * span * smoothstep(0.12, 0.0, up) * (1.0 - L * 0.5);
    }
    return vec2(I * rings(d, t), core);
  }

  // contour: a map's height lines nested around a hill under the focus, the
  // hill bent by the noise; every fifth line is an index line, brighter
  if (u_mode < 4.5) {
    float n = fbm(flow(p * 1.6, vec2(0.025, -0.02), fp * 1.6, t));
    float h = (1.0 - min(d, 1.6)) * 0.95 + (n - 0.5) * 0.55 * k;
    float lv = h * 13.0 * u_grain;
    float f = fract(lv);
    float line = smoothstep(0.2, 0.02, min(f, 1.0 - f));
    float major = step(mod(floor(lv + 0.5), 5.0), 0.5);
    float reach = smoothstep(1.25, 0.15, d);
    float I = line * (0.6 + 0.65 * major) * reach + reach * reach * 0.1;
    return vec2(I * rings(d, t), line * major * reach);
  }

  // mesh: a network. Nodes, the links to their neighbours, and packets of
  // light running along each link at its own speed; nodes blink on their
  // own beat
  if (u_mode < 5.5) {
    vec2 q = flow(p * 2.0, vec2(0.012, 0.008), fp * 2.0, t);
    vec2 ip = floor(q);
    float links = 0.0, packets = 0.0, nodes = 0.0, glow = 0.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = ip + vec2(float(i), float(j));
        vec2 a = node(c, t, k);
        float hc = hash(c + u_seed + 4.4);
        float dn = length(q - a);
        float beat = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(t * 1.4 + hc * 40.0), 4.0);
        nodes = max(nodes, smoothstep(0.085, 0.035, dn) * beat);
        glow = max(glow, exp(-dn * 6.5) * beat);
        for (int e = 0; e < 3; e++) {
          vec2 off = e == 0 ? vec2(1.0, 0.0) : e == 1 ? vec2(0.0, 1.0) : vec2(1.0, 1.0);
          float he = hash(c + off * 3.1 + u_seed);
          if (e == 2 && he < 0.55) continue;
          float s;
          float dl = segment(q, a, node(c + off, t, k), s);
          float line = smoothstep(0.045, 0.004, dl);
          links = max(links, line);
          float at = fract(t * (0.08 + 0.12 * he) + he * 7.0);
          packets = max(packets, line * exp(-abs(s - at) * 16.0));
        }
      }
    }
    float reach = smoothstep(1.2, 0.1, d);
    float I = (links * 0.62 + packets * 1.3 + nodes * 1.4 + glow * 0.5) * reach;
    return vec2(I * rings(d, t), (packets + nodes) * reach);
  }

  // orbit: tilted rings around the focus, like a system seen at an angle;
  // each ring carries one or two comets running its own way and speed
  if (u_mode < 6.5) {
    vec2 o = vec2(r.x, r.y / 0.58) / u_radius;
    float od = length(o);
    float rr = od * 6.0 * u_grain;
    float band = floor(rr);
    float ring = smoothstep(0.16, 0.0, abs(fract(rr) - 0.5));
    float hk = hash(vec2(band, 4.1) + u_seed);
    float way = hk > 0.5 ? 1.0 : -1.0;
    float a = atan(o.y, o.x) / 6.2831853 + 0.5;
    float head = fract(a * way - t * (0.025 + 0.045 * hk) + hk * 3.7);
    float tail = 9.0 / (0.6 + 0.6 * k);
    float comet = pow(head, tail);
    if (hk > 0.6) comet = max(comet, pow(fract(head + 0.5), tail));
    float body = exp(-od * 10.0);
    float I = ring * (0.28 + 1.15 * comet) * smoothstep(1.05, 0.7, od) * step(0.5, band) + body * 1.1 + exp(-od * 4.0) * 0.12;
    return vec2(I * rings(od, t), ring * comet + body);
  }

  // stream: columns of light running one way, each with a bright head and a
  // tail of its own length; direction turns them, chaos sets how many run
  if (u_mode < 7.5) {
    vec2 dir = u_dir.z > 0.5 ? u_dir.xy : vec2(0.0, 1.0);
    float along = dot(p, dir), across = dot(p, vec2(-dir.y, dir.x));
    float cw = u_cell / u_res.y / u_grain;
    float col = floor(across / cw);
    float h1 = hash(vec2(col, 0.7) + u_seed), h2 = hash(vec2(col, 2.3) + u_seed);
    float on = step(h1, 0.38 + 0.25 * k);
    float s = fract(h2 * 7.0 + t * (0.04 + 0.08 * h1) - along * (0.35 + 0.4 * h2));
    float trail = pow(s, 3.0 + 6.0 * h2);
    float reach = smoothstep(1.25, 0.1, d);
    float I = on * (trail * 1.25 + pow(s, 24.0) * 0.6 + 0.05) * reach + reach * reach * 0.03;
    return vec2(I * rings(d, t), on * pow(s, 30.0) * reach);
  }

  // ripple: thin rings from two sources beside the focus, like two stones in
  // water; where rings cross they brighten into a moire
  if (u_mode < 8.5) {
    float ang = hash(u_seed + 1.3) * 6.2831 + t * 0.04;
    vec2 o = vec2(cos(ang), sin(ang)) * 0.15 * u_radius;
    float fr = 24.0 * u_grain;
    float la = length(p - fp - o), lb = length(p - fp + o);
    float ra = pow(0.5 + 0.5 * sin(la * fr - t * 1.1), 5.0);
    float rb = pow(0.5 + 0.5 * sin(lb * fr - t * 1.1), 5.0);
    float n = fbm(flow(p * 2.0, vec2(0.03, -0.02), fp * 2.0, t));
    float reach = smoothstep(1.15, 0.05, d);
    float I = ((ra + rb) * 0.72 + ra * rb * 0.7) * (0.8 + 0.5 * k * (n - 0.5)) * reach;
    return vec2(I * rings(d, t), ra * rb * reach);
  }

  // galaxy: spiral arms turning around a bright core, with dust in them and
  // a scatter of faint stars around
  vec2 rg = turn(t * 0.02) * r / u_radius;
  float dg = length(rg);
  float arms = 2.0 + floor(hash(u_seed + 5.1) * 2.0);
  float sw = sin(arms * atan(rg.y, rg.x) + log(dg + 0.04) * 4.2 - t * 0.12);
  float arm = pow(0.5 + 0.5 * sw, 3.0);
  float dust = fbm(flow(rg * 3.0, vec2(0.02, 0.0), vec2(0.0), t));
  float core = exp(-dg * 7.0);
  float star = step(0.992, hash(floor(uv * u_res / u_cell) + u_seed)) * (0.35 + 0.4 * sin(t * 2.0 + uv.x * 90.0));
  float I = (arm * max(0.85 + 0.9 * k * (dust - 0.5), 0.0) * exp(-dg * 1.4) + core * 1.3) * smoothstep(1.15, 0.2, dg) + star * smoothstep(1.8, 0.6, dg);
  return vec2(I * rings(d, t), core + arm * 0.4 * exp(-dg * 2.0));
}

// The light at a point: x = intensity, y = how close to the hot core (colour mix)
vec2 scene(vec2 uv) {
  float aspect = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 fp = (u_focus - 0.5) * vec2(aspect, 1.0);
  float t = u_time;

  if (u_mode > 2.5) return more(uv, p, fp, aspect, t);

  if (u_mode < 0.5) {
    float n = fbm(flow(p * 2.4, vec2(0.05, -0.035), fp * 2.4, t));
    // past the default chaos a finer layer tears the light, and the edge of
    // the pool breaks up with it (both add exactly nothing at the default)
    float tear = clamp((u_chaos - 1.0) * 0.4, 0.0, 0.75);
    if (tear > 0.0) n = mix(n, fbm(flow(p * 7.5, vec2(0.08, -0.05), fp * 7.5, t)), tear);
    vec2 at = uv - u_focus - u_ptr * 0.015;
    // warp bends the pool itself, not only the light inside it
    if (u_warp > 0.0) at += (vec2(fbm(p * 1.4 + u_seed + vec2(5.2, 1.3) + t * 0.03), fbm(p * 1.4 + u_seed + vec2(1.7, 9.2) - t * 0.03)) - 0.5) * u_warp * u_radius * 0.9;
    float d = length(at * vec2(aspect, 1.0)) / u_radius;
    d += (n - 0.5) * max(u_chaos - 1.0, 0.0) * 0.8;
    float g = smoothstep(1.0, 0.0, d);
    // mix() returns the original 0.5 + 0.7n exactly at the default chaos
    float I = pow(g, 1.4) * max(mix(0.85, 0.5 + 0.7 * n, u_chaos), 0.0) * rings(d, t);
    return vec2(I, g * g);
  }

  if (u_mode < 1.5) {
    mat2 R = mat2(cos(u_ang), -sin(u_ang), sin(u_ang), cos(u_ang));
    vec2 q = R * (p + u_ptr * 0.03);
    vec2 fq = R * fp;
    float warp = fbm(flow(vec2(q.x * 0.9, q.y * 0.6), vec2(-0.02, 0.0), vec2(fq.x * 0.9, fq.y * 0.6), t));
    float y = q.y * 3.0 + warp * 1.8 * u_chaos + t * 0.025;
    float wide = pow(0.5 + 0.5 * sin(y * 2.1 + 1.3), 5.0);
    float mid = pow(0.5 + 0.5 * sin(y * 5.3), 14.0);
    float fog = fbm(flow(q * vec2(0.7, 2.2), vec2(0.035, 0.0), fq * vec2(0.7, 2.2), t));
    float light = (wide * 0.55 + mid * 0.6) * smoothstep(0.2, 0.85, fog + 0.2);
    float d = length((uv - u_focus) * vec2(aspect, 1.0)) / u_radius;
    float fall = smoothstep(1.0, 0.0, d);
    return vec2((fog * 0.25 + light) * fall * rings(d, t), light * fall);
  }

  vec2 c = vec2(u_ptr.x * 0.03, 1.62);
  float dist = 1.34 - length(p - c);
  float above = step(0.0, dist);
  float rim = exp(-abs(dist) * 40.0);
  float atmos = exp(-dist * 4.2) * above;
  float ang = atan(p.x - c.x, c.y - p.y);
  float rays = pow(fbm(flow(vec2(ang * 7.0, 0.0), vec2(0.03, 0.05), vec2(0.0), t)), 2.2) * exp(-dist * 2.4) * above * u_chaos;
  float body = (1.0 - above) * 0.14 * fbm(flow(p * 3.0, vec2(0.02), c * 3.0, t));
  float haze = fbm(flow(vec2(p.x * 2.6, dist * 8.0), vec2(0.04, -0.06), vec2(0.0), t));
  float I = rim * 1.1 + atmos * 0.42 * mix(1.0, 0.6 + 0.8 * haze, u_chaos) + rays + body;
  return vec2(I * rings(abs(dist) * 4.0, t), clamp(rim + atmos, 0.0, 1.0));
}

// The order 8 rows (or diagonals) light in: bit-reversed, so the lit lines
// stay evenly spaced and thicken as the light grows (0, 4, 2, 6, 1, 5, 3, 7)
float rev8(float i) {
  i = mod(i, 8.0);
  return (mod(i, 2.0) * 4.0 + mod(floor(i / 2.0), 2.0) * 2.0 + floor(i / 4.0)) / 8.0;
}
// Interleaved gradient noise: random-looking but evenly spread, so a grain
// dither has no clumps or holes
float ign(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

// The level a cell must reach to light, for each pattern
float threshold(vec2 id) {
  float th;
  if (u_pattern < 0.5) th = bayer8(id) + 0.02;
  else if (u_pattern < 1.5) th = bayer4(id) + 0.03;
  else if (u_pattern < 2.5) th = ign(id + floor(u_seed * 13.0)) * 0.94 + 0.03;
  else if (u_pattern < 3.5) th = 0.03 + rev8(id.y) * 0.9 + bayer8(id) * 0.06;
  else th = 0.03 + rev8(id.x + id.y) * 0.84 + bayer8(id) * 0.12;
  if (u_twinkle > 0.0) th += (hash(id + floor(u_clock * 6.0) * 1.37 + u_seed) - 0.5) * u_twinkle * 0.6;
  return th;
}

void main() {
  // a halftone is a print screen: its grid is turned 45°
  bool screen = u_pattern > 4.5;
  const float K = 0.70710678;
  // the centre of the device pixels this fragment stands for: the fragment
  // itself at full size, or its block of k × k for a coarse field, so the
  // maths below runs on the same numbers either way
  vec2 px = (floor(gl_FragCoord.xy) + 0.5) * u_k;
  vec2 frag = screen ? mat2(K, K, -K, K) * px : px;
  vec2 cellId = floor(frag / u_cell);
  vec2 local = fract(frag / u_cell);
  vec2 centre = (cellId + 0.5) * u_cell;
  if (screen) centre = mat2(K, -K, K, K) * centre;
  vec2 uv = centre / u_res;
  uv.y = 1.0 - uv.y;

  vec2 s = scene(uv);
  float I = s.x * u_int;
  // breathe: the whole light swells and settles
  if (u_motion > 1.5 && u_motion < 2.5) I *= 0.82 + 0.28 * sin(u_time * 0.7);
  I = clamp(I, 0.0, 1.2);
  vec3 hue = mix(u_c2, u_c1, clamp(s.y * 1.3, 0.0, 1.0));

  // lit or not by the pattern's threshold, then only a dot of the cell; a
  // halftone lights every cell and sizes its dot by the light instead
  float on, size;
  if (u_pattern < 4.5) {
    on = step(threshold(cellId), I);
    size = u_dot;
  } else {
    on = step(0.04, I);
    // the dot sizes are dithered too, so the steps between whole pixels blend
    size = clamp(u_dot * 1.9 * sqrt(min(I, 1.0)) + (bayer8(cellId) - 0.5) / u_cell, 0.0, 0.96);
  }
  vec2 o = u_pattern < 4.5 ? vec2(size * 0.5) : vec2(0.5);
  float inDot = u_shape < 0.5
    ? step(abs(local.x - o.x), size * 0.5) * step(abs(local.y - o.y), size * 0.5)
    : step(length(local - o), size * 0.5);
  vec3 col = hue * (0.38 + 0.62 * min(I, 1.0)) * on * inDot;
  // a soft wash between the dots gives the glow a body
  col += hue * I * I * u_wash;

  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.4, 0.0, 1.0);
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

const MODES: Record<LightFieldMode, number> = { glow: 0, beams: 1, horizon: 2, aurora: 3, contour: 4, mesh: 5, orbit: 6, stream: 7, ripple: 8, galaxy: 9 };
const MOTIONS: Record<LightFieldMotion, number> = { drift: 0, swirl: 1, breathe: 2, pulse: 3, still: 4 };
const PATTERNS: Record<LightFieldPattern, number> = { bayer: 0, bayer4: 1, grain: 2, lines: 3, hatch: 4, halftone: 5 };
const DIRECTIONS: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 };
const DEFAULT_CHAOS = 0.35;

const deep = (c: RGB): RGB => [c[0] * 0.45, c[1] * 0.48, c[2] * 0.6];
const fract = (x: number) => x - Math.floor(x);

/** A seed as an offset in noise space: 0 (or none) stays at the origin. */
function seedOffset(seed: number | string | undefined): [number, number] {
  if (seed === undefined || seed === 0 || seed === '') return [0, 0];
  const [a, b] = typeof seed === 'string' ? seedOf(seed, 2) : [fract(Math.sin(seed * 12.9898) * 43758.5453), fract(Math.sin(seed * 78.233) * 43758.5453)];
  return [a * 97, b * 97];
}

export function mountLightField(canvas: HTMLCanvasElement, opts: LightFieldOptions): LightField {
  const noop: LightField = { setColor: () => {}, setIntensity: () => {}, update: () => {}, destroy: () => {} };
  // No depth or stencil buffer: one full-screen triangle needs neither, and a
  // depth buffer the size of the canvas is the second-largest thing it holds.
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true, depth: false, stencil: false, powerPreference: 'low-power' });
  let prog = gl && createProgram(gl, FULLSCREEN_VERT, FRAG);
  if (!gl || !prog) {
    // the CSS fallback (a plain radial wash) keys off this
    canvas.dataset.fallback = '';
    return noop;
  }

  // The program's buffer and uniforms, found again whenever the context is
  // restored (see park below).
  const u = (n: string) => gl.getUniformLocation(prog!, n);
  type Loc = WebGLUniformLocation | null;
  let uRes: Loc, uTime: Loc, uClock: Loc, uC1: Loc, uC2: Loc, uInt: Loc, uPtr: Loc, uCell: Loc, uK: Loc;
  const locate = () => {
    fullscreenTriangle(gl, prog!);
    [uRes, uTime, uClock, uC1, uC2, uInt, uPtr, uCell, uK] = ['u_res', 'u_time', 'u_clock', 'u_c1', 'u_c2', 'u_int', 'u_ptr', 'u_cell', 'u_k'].map(u);
  };
  locate();

  const { color, color2, intensity: startIntensity, ...rest } = opts;
  let settings: LightFieldSettings = rest;

  // Every setting is a uniform, so any of them can change on a live field.
  const apply = () => {
    const s = settings;
    gl.uniform1f(u('u_wash'), s.wash ?? 0.07);
    gl.uniform1f(u('u_mode'), MODES[s.mode ?? 'glow']);
    gl.uniform1f(u('u_ang'), s.angle ?? -0.6);
    gl.uniform1f(u('u_radius'), s.radius ?? 0.9);
    gl.uniform2f(u('u_focus'), ...(s.focus ?? [0.5, 0.5]));
    gl.uniform1f(u('u_dot'), s.dot ?? 0.5);
    gl.uniform2f(u('u_seed'), ...seedOffset(s.seed));
    gl.uniform1f(u('u_chaos'), (s.chaos ?? DEFAULT_CHAOS) / DEFAULT_CHAOS);
    gl.uniform1f(u('u_grain'), s.grain ?? 1);
    gl.uniform1f(u('u_warp'), s.warp ?? 0);
    gl.uniform1f(u('u_motion'), MOTIONS[s.motion ?? 'drift']);
    const dir = s.direction === undefined ? null : ((typeof s.direction === 'number' ? s.direction : DIRECTIONS[s.direction]) * Math.PI) / 180;
    gl.uniform3f(u('u_dir'), dir === null ? 0 : Math.cos(dir), dir === null ? 0 : Math.sin(dir), dir === null ? 0 : 1);
    gl.uniform1f(u('u_pattern'), PATTERNS[s.pattern ?? 'bayer']);
    gl.uniform1f(u('u_twinkle'), s.twinkle ?? 0);
    // a print screen's dots are round unless asked otherwise
    gl.uniform1f(u('u_shape'), (s.shape ?? (s.pattern === 'halftone' ? 'round' : 'square')) === 'round' ? 1 : 0);
  };

  let c1: RGB = [...color];
  let c2: RGB = color2 ? [...color2] : deep(color);
  let toC1 = c1, toC2 = c2;
  let intensity = startIntensity ?? 1;
  let toIntensity = intensity;
  let ptrX = 0, ptrY = 0, toPtrX = 0, toPtrY = 0;
  const reduce = prefersReducedMotion();

  // Far from the screen, the field gives back its drawing buffer and its
  // context, and takes them back, and draws, a screen's height before it can
  // come into view.
  let parked = false;

  // The dither is a grid of device pixels, so it is never smeared by a
  // smooth scale. But a square dot of half a cell (every pattern but the
  // halftone) needs only 2 × 2 distinct pixels per cell: the dot's corner and
  // the wash around it. Such a field renders at that size, a ninth of the
  // pixels at 2× density, and the browser scales it up by whole device
  // pixels (pixelated), which is the same picture. The shader works in full-
  // size device pixels (u_k), so its sums are the very same ones, and the
  // canvas keeps its grid anchored to the bottom edge, as a full-size one is;
  // the few extra pixels at the top and right fall outside the box, which
  // clips them.
  const coarse = () => settings.pattern !== 'halftone' && (settings.shape ?? 'square') === 'square' && (settings.dot ?? 0.5) === 0.5;
  const box = canvas.parentElement ?? canvas;
  const size = () => {
    if (parked) return;
    const st = canvas.style;
    st.width = st.height = st.marginTop = st.imageRendering = '';
    const r = canvas.getBoundingClientRect();
    const ratio = dpr();
    const W = Math.max(1, Math.round(r.width * ratio));
    const H = Math.max(1, Math.round(r.height * ratio));
    const cellPx = Math.max(2, Math.round((settings.cell ?? 3) * ratio));
    const k = coarse() && cellPx % 2 === 0 ? cellPx / 2 : 1;
    canvas.width = Math.ceil(W / k);
    canvas.height = Math.ceil(H / k);
    if (k > 1) {
      st.width = `${(canvas.width * k) / ratio}px`;
      st.height = `${(canvas.height * k) / ratio}px`;
      st.marginTop = `${-(canvas.height * k - H) / ratio}px`;
      st.imageRendering = 'pixelated';
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, W, H);
    gl.uniform1f(uCell, cellPx);
    gl.uniform1f(uK, k);
  };

  // A fixed offset so the still frame is a good-looking one, not t = 0.
  const T0 = 40;
  let start = performance.now();
  const still = () => reduce || settings.motion === 'still';
  const draw = (seconds: number) => {
    const speed = settings.speed ?? 1;
    gl.uniform1f(uTime, T0 + (still() ? 0 : seconds * speed));
    gl.uniform1f(uClock, T0 + (reduce ? 0 : seconds));
    gl.uniform3f(uC1, ...c1);
    gl.uniform3f(uC2, ...c2);
    gl.uniform1f(uInt, intensity);
    gl.uniform2f(uPtr, ptrX, ptrY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // A still field (unless it twinkles) draws only while something eases.
  let dirty = true;
  const near = (a: number, b: number) => Math.abs(a - b) < 0.0005;
  const settled = () =>
    near(intensity, toIntensity) && near(ptrX, toPtrX) && near(ptrY, toPtrY) && c1.every((v, i) => near(v, toC1[i])) && c2.every((v, i) => near(v, toC2[i]));

  const ease = (a: number, b: number) => a + (b - a) * 0.08;
  const loop = reduce
    ? null
    : visibleLoop(canvas, (now) => {
        const moving = settings.motion !== 'still' || (settings.twinkle ?? 0) > 0;
        if (!moving && !dirty && settled()) return;
        c1 = [ease(c1[0], toC1[0]), ease(c1[1], toC1[1]), ease(c1[2], toC1[2])];
        c2 = [ease(c2[0], toC2[0]), ease(c2[1], toC2[1]), ease(c2[2], toC2[2])];
        intensity = ease(intensity, toIntensity);
        ptrX = ease(ptrX, toPtrX);
        ptrY = ease(ptrY, toPtrY);
        draw((now - start) / 1000);
        dirty = false;
      });

  const onPointer = (e: PointerEvent) => {
    toPtrX = (e.clientX / window.innerWidth) * 2 - 1;
    toPtrY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  let listening = false;
  const listen = () => {
    const want = !!settings.pointer && !reduce;
    if (want && !listening) window.addEventListener('pointermove', onPointer, { passive: true });
    if (!want && listening) window.removeEventListener('pointermove', onPointer);
    listening = want;
  };

  let rz: number | undefined;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(rz);
    rz = window.setTimeout(() => {
      if (parked) return;
      size();
      draw((performance.now() - start) / 1000);
    }, 120);
  });
  // the box, not the canvas: a coarse canvas sets its own size
  ro.observe(box);

  // Parked, the field also gives its context back (a context costs memory
  // of its own, whatever the canvas size), and restores it on the way back:
  // the browser keeps compiled shaders, so the rebuild is quick.
  const release = gl.getExtension('WEBGL_lose_context');
  let released = false;
  let dead = false;
  const redraw = () => {
    size();
    dirty = true;
    draw((performance.now() - start) / 1000);
  };
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => {
    if (dead) return;
    prog = createProgram(gl, FULLSCREEN_VERT, FRAG);
    if (!prog) return;
    locate();
    apply();
    released = false;
    if (!parked) redraw();
  });
  const park = new IntersectionObserver(
    (entries) => {
      const near = entries.some((e) => e.isIntersecting);
      if (!near && !parked) {
        parked = true;
        canvas.width = 1;
        canvas.height = 1;
        if (release) {
          release.loseContext();
          released = true;
        }
      } else if (near && parked) {
        parked = false;
        if (released) release!.restoreContext();
        else redraw();
      }
    },
    { rootMargin: '100% 0px' },
  );
  park.observe(canvas);

  apply();
  listen();
  size();
  draw(0);
  start = performance.now();

  return {
    setColor(color, color2) {
      toC1 = [...color];
      toC2 = color2 ? [...color2] : deep(color);
      if (reduce) {
        c1 = toC1;
        c2 = toC2;
        draw(0);
      }
    },
    setIntensity(v) {
      toIntensity = v;
      if (reduce) {
        intensity = v;
        draw(0);
      }
    },
    update(next) {
      settings = next;
      apply();
      listen();
      // the cell, the pattern and the dot decide the canvas's size
      size();
      dirty = true;
      draw((performance.now() - start) / 1000);
    },
    destroy() {
      dead = true;
      loop?.stop();
      window.clearTimeout(rz);
      ro.disconnect();
      park.disconnect();
      if (listening) window.removeEventListener('pointermove', onPointer);
      if (!released) loseContext(gl);
    },
  };
}
