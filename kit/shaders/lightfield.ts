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
//
// The output is premultiplied light over a transparent canvas, so it works
// on any background: on black it glows, on white it prints as a coloured
// halftone. Colours are 0..1 RGB; setColor and setIntensity ease, so a theme
// change washes across instead of snapping. Off screen and in hidden tabs the
// loop does not exist; under reduced motion it draws one still frame.
import { GLSL_BAYER, GLSL_NOISE } from '../core/bayer';
import { createProgram, FULLSCREEN_VERT, fullscreenTriangle, hexToRgb, loseContext, type RGB } from '../core/gl';
import { dpr, prefersReducedMotion, visibleLoop } from '../core/loop';

export { hexToRgb, type RGB };

export type LightFieldMode = 'glow' | 'beams' | 'horizon';

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
}

export interface LightField {
  setColor: (color: RGB, color2?: RGB) => void;
  setIntensity: (v: number) => void;
  destroy: () => void;
}

const FRAG = /* glsl */ `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform float u_mode;
uniform float u_int;
uniform float u_ang;
uniform float u_radius;
uniform vec2 u_focus;
uniform vec2 u_ptr;
uniform float u_cell;
uniform float u_dot;
uniform float u_wash;
${GLSL_NOISE}
${GLSL_BAYER}

// The light at a point: x = intensity, y = how close to the hot core (colour mix)
vec2 scene(vec2 uv) {
  float aspect = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float t = u_time;

  if (u_mode < 0.5) {
    float d = length((uv - u_focus - u_ptr * 0.015) * vec2(aspect, 1.0)) / u_radius;
    float g = smoothstep(1.0, 0.0, d);
    float n = fbm(p * 2.4 + vec2(t * 0.05, -t * 0.035));
    float I = pow(g, 1.4) * (0.5 + 0.7 * n);
    return vec2(I, g * g);
  }

  if (u_mode < 1.5) {
    mat2 R = mat2(cos(u_ang), -sin(u_ang), sin(u_ang), cos(u_ang));
    vec2 q = R * (p + u_ptr * 0.03);
    float warp = fbm(vec2(q.x * 0.9 - t * 0.02, q.y * 0.6));
    float y = q.y * 3.0 + warp * 1.8 + t * 0.025;
    float wide = pow(0.5 + 0.5 * sin(y * 2.1 + 1.3), 5.0);
    float mid = pow(0.5 + 0.5 * sin(y * 5.3), 14.0);
    float fog = fbm(q * vec2(0.7, 2.2) + vec2(t * 0.035, 0.0));
    float light = (wide * 0.55 + mid * 0.6) * smoothstep(0.2, 0.85, fog + 0.2);
    float d = length((uv - u_focus) * vec2(aspect, 1.0)) / u_radius;
    float fall = smoothstep(1.0, 0.0, d);
    return vec2((fog * 0.25 + light) * fall, light * fall);
  }

  vec2 c = vec2(u_ptr.x * 0.03, 1.62);
  float dist = 1.34 - length(p - c);
  float above = step(0.0, dist);
  float rim = exp(-abs(dist) * 40.0);
  float atmos = exp(-dist * 4.2) * above;
  float ang = atan(p.x - c.x, c.y - p.y);
  float rays = pow(fbm(vec2(ang * 7.0 + t * 0.03, t * 0.05)), 2.2) * exp(-dist * 2.4) * above;
  float body = (1.0 - above) * 0.14 * fbm(p * 3.0 + t * 0.02);
  float I = rim * 1.1 + atmos * 0.42 * (0.6 + 0.8 * fbm(vec2(p.x * 2.6 + t * 0.04, dist * 8.0 - t * 0.06))) + rays + body;
  return vec2(I, clamp(rim + atmos, 0.0, 1.0));
}

void main() {
  vec2 cellId = floor(gl_FragCoord.xy / u_cell);
  vec2 local = fract(gl_FragCoord.xy / u_cell);
  vec2 uv = (cellId + 0.5) * u_cell / u_res;
  uv.y = 1.0 - uv.y;

  vec2 s = scene(uv);
  float I = clamp(s.x * u_int, 0.0, 1.2);
  vec3 hue = mix(u_c2, u_c1, clamp(s.y * 1.3, 0.0, 1.0));

  // lit or not, by the ordered threshold; then only a dot of the cell
  float on = step(bayer8(cellId) + 0.02, I);
  float inDot = step(local.x, u_dot) * step(local.y, u_dot);
  vec3 col = hue * (0.38 + 0.62 * min(I, 1.0)) * on * inDot;
  // a soft wash between the dots gives the glow a body
  col += hue * I * I * u_wash;

  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.4, 0.0, 1.0);
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}
`;

const MODES: Record<LightFieldMode, number> = { glow: 0, beams: 1, horizon: 2 };
const deep = (c: RGB): RGB => [c[0] * 0.45, c[1] * 0.48, c[2] * 0.6];

export function mountLightField(canvas: HTMLCanvasElement, opts: LightFieldOptions): LightField {
  const noop: LightField = { setColor: () => {}, setIntensity: () => {}, destroy: () => {} };
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  const prog = gl && createProgram(gl, FULLSCREEN_VERT, FRAG);
  if (!gl || !prog) {
    // the CSS fallback (a plain radial wash) keys off this
    canvas.dataset.fallback = '';
    return noop;
  }
  fullscreenTriangle(gl, prog);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('u_res'), uTime = u('u_time'), uC1 = u('u_c1'), uC2 = u('u_c2'), uInt = u('u_int'), uPtr = u('u_ptr'), uCell = u('u_cell');
  gl.uniform1f(u('u_wash'), opts.wash ?? 0.07);
  gl.uniform1f(u('u_mode'), MODES[opts.mode ?? 'glow']);
  gl.uniform1f(u('u_ang'), opts.angle ?? -0.6);
  gl.uniform1f(u('u_radius'), opts.radius ?? 0.9);
  gl.uniform2f(u('u_focus'), ...(opts.focus ?? [0.5, 0.5]));
  gl.uniform1f(u('u_dot'), opts.dot ?? 0.5);

  let c1: RGB = [...opts.color];
  let c2: RGB = opts.color2 ? [...opts.color2] : deep(opts.color);
  let toC1 = c1, toC2 = c2;
  let intensity = opts.intensity ?? 1;
  let toIntensity = intensity;
  let ptrX = 0, ptrY = 0, toPtrX = 0, toPtrY = 0;
  const reduce = prefersReducedMotion();
  const speed = opts.speed ?? 1;
  const cellCss = opts.cell ?? 3;

  // Rendered at device resolution: the dither is a pixel grid, and scaling
  // it would smear the dots.
  const size = () => {
    const r = canvas.getBoundingClientRect();
    const ratio = dpr();
    canvas.width = Math.max(1, Math.round(r.width * ratio));
    canvas.height = Math.max(1, Math.round(r.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uCell, Math.max(2, Math.round(cellCss * ratio)));
  };

  // A fixed offset so the still frame is a good-looking one, not t = 0.
  const T0 = 40;
  let start = performance.now();
  const draw = (seconds: number) => {
    gl.uniform1f(uTime, T0 + seconds * speed);
    gl.uniform3f(uC1, ...c1);
    gl.uniform3f(uC2, ...c2);
    gl.uniform1f(uInt, intensity);
    gl.uniform2f(uPtr, ptrX, ptrY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const ease = (a: number, b: number) => a + (b - a) * 0.08;
  const loop = reduce
    ? null
    : visibleLoop(canvas, (now) => {
        c1 = [ease(c1[0], toC1[0]), ease(c1[1], toC1[1]), ease(c1[2], toC1[2])];
        c2 = [ease(c2[0], toC2[0]), ease(c2[1], toC2[1]), ease(c2[2], toC2[2])];
        intensity = ease(intensity, toIntensity);
        ptrX = ease(ptrX, toPtrX);
        ptrY = ease(ptrY, toPtrY);
        draw((now - start) / 1000);
      });

  const onPointer = (e: PointerEvent) => {
    toPtrX = (e.clientX / window.innerWidth) * 2 - 1;
    toPtrY = (e.clientY / window.innerHeight) * 2 - 1;
  };
  if (opts.pointer && !reduce) window.addEventListener('pointermove', onPointer, { passive: true });

  let rz: number | undefined;
  const ro = new ResizeObserver(() => {
    window.clearTimeout(rz);
    rz = window.setTimeout(() => {
      size();
      draw((performance.now() - start) / 1000);
    }, 120);
  });
  ro.observe(canvas);

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
    destroy() {
      loop?.stop();
      window.clearTimeout(rz);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      loseContext(gl);
    },
  };
}
