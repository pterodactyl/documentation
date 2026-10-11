// A photograph drawn as a live halftone on the kit's dither grid.
//
// Each cell samples the image and draws a round dot whose size follows the
// brightness there, in the image's own colour (pushed a little more
// saturated), over a faint wash of the same colour. Cells too dark for their
// ordered-dither threshold drop out, so shadows go to ink. It is tuned to read
// as dither first and picture second: small, dim, sparse dots. The picture
// drifts on a slow pan-and-zoom, follows the pointer a little, and the odd
// dot sparkles.
//
// Changing image is a dissolve: every cell flips from the old picture to the
// new one at its own moment, ordered by a noisy sweep up from the bottom-left,
// and the cells at the front of the sweep flash as they turn.
//
// `hole` falls the picture away towards the middle, for when something sits
// on top of it (a card, a headline): 0 is the whole picture, 0.74 leaves only
// a quarter of the brightness at the centre. Images are fetched one at a time
// as they are shown, the next one behind it. Like every kit surface, it stops
// its loop off screen and draws a single still frame under reduced motion.
import { GLSL_BAYER, GLSL_NOISE } from '../core/bayer';
import { createProgram, FULLSCREEN_VERT, fullscreenTriangle, loseContext, type RGB } from '../core/gl';
import { dpr, prefersReducedMotion, visibleLoop } from '../core/loop';

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform vec2 u_res;
uniform float u_time;
uniform float u_mix;
uniform float u_cell;
uniform float u_aspA;
uniform float u_aspB;
uniform vec2 u_ptr;
uniform float u_hole;
uniform vec3 u_ink;
${GLSL_NOISE}
${GLSL_BAYER}

// cover-fit a view uv (0..1, y down) into an image of the given aspect
vec2 cover(vec2 uv, float img, float view, float zoom, vec2 pan) {
  vec2 s = view > img ? vec2(1.0, img / view) : vec2(view / img, 1.0);
  return (uv - 0.5) * s / zoom + 0.5 + pan;
}

void main() {
  vec2 cell = floor(gl_FragCoord.xy / u_cell);
  vec2 local = fract(gl_FragCoord.xy / u_cell) - 0.5;
  vec2 uv = (cell + 0.5) * u_cell / u_res;
  uv.y = 1.0 - uv.y;
  float view = u_res.x / u_res.y;

  // a slow pan and breathe, nudged by the pointer
  float zoom = 1.1 + 0.05 * sin(u_time * 0.07);
  vec2 pan = vec2(sin(u_time * 0.045), cos(u_time * 0.038)) * 0.025 + u_ptr * 0.012;
  vec3 ca = texture2D(u_a, cover(uv, u_aspA, view, zoom, pan)).rgb;
  vec3 cb = texture2D(u_b, cover(uv, u_aspB, view, zoom, pan)).rgb;

  // the dissolve: each cell turns at its own threshold along a noisy sweep
  float b = bayer8(cell) + 0.5 / 64.0;
  float n = fbm(uv * vec2(4.0, 3.0) + u_time * 0.04);
  float th = clamp((1.0 - uv.y) * 0.5 + uv.x * 0.22 + n * 0.3, 0.0, 1.0) * 0.86 + b * 0.14;
  float useB = step(th, u_mix);
  vec3 col = mix(ca, cb, useB);

  float L = dot(col, vec3(0.299, 0.587, 0.114));
  col = clamp(mix(vec3(L), col, 1.15), 0.0, 1.0);

  // the picture holds at the edges, falls away in the middle by u_hole,
  // and out at the corners
  float d = length((uv - vec2(0.5, 0.5)) * vec2(1.0, 1.1));
  float frame = mix(1.0 - u_hole, 1.0, smoothstep(0.2, 0.6, d));
  float corners = mix(0.55, 1.0, smoothstep(1.05, 0.55, d));
  float I = clamp(L * frame * corners * 0.95, 0.0, 1.0);

  // mostly dither, a little image: the ordered threshold decides which cells
  // light at all, and the dots stay small and dim
  float r = 0.12 + 0.24 * sqrt(I);
  float on = step(length(local), r) * step(b, I * 1.25);
  vec3 dotc = col * (0.35 + 0.55 * I);
  vec3 wash = col * I * 0.05;

  // the odd sparkle, and a flash along the dissolve's front
  float tw = step(0.997, hash(cell + floor(u_time * 2.5))) * I;
  float front = (1.0 - smoothstep(0.0, 0.06, abs(u_mix - th))) * step(0.001, u_mix) * step(u_mix, 0.999);

  vec3 outc = u_ink + wash + dotc * on + vec3(tw * 0.5) * on + front * (0.15 + col * 0.55) * step(length(local), 0.36);
  gl_FragColor = vec4(outc, 1.0);
}
`;

export interface DitherImageOptions {
  /** dither cell in CSS pixels */
  cell?: number;
  /** 0..1: how far the picture falls away towards the centre */
  hole?: number;
  /** the well the dots sit in, 0..1 RGB (the kit's ink by default) */
  ink?: RGB;
}

export interface DitherImage {
  /** dissolve to image `index`; resolves when the dissolve has finished */
  show: (index: number) => Promise<void>;
  destroy: () => void;
}

export function mountDitherImage(canvas: HTMLCanvasElement, urls: string[], opts: DitherImageOptions = {}): DitherImage {
  const reduce = prefersReducedMotion();
  const none: DitherImage = { show: () => Promise.resolve(), destroy: () => {} };
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  const prog = gl && createProgram(gl, FULLSCREEN_VERT, FRAG);
  if (!gl || !prog) return none;
  fullscreenTriangle(gl, prog);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('u_res'), uTime = u('u_time'), uMix = u('u_mix'), uCell = u('u_cell');
  const uAspA = u('u_aspA'), uAspB = u('u_aspB'), uPtr = u('u_ptr');
  gl.uniform1i(u('u_a'), 0);
  gl.uniform1i(u('u_b'), 1);
  gl.uniform1f(u('u_hole'), opts.hole ?? 0);
  const ink = opts.ink ?? [0.0196, 0.0196, 0.0196];
  gl.uniform3f(u('u_ink'), ...ink);

  // a 1×1 ink texture stands in until the first image arrives
  const blank = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([...ink.map((c) => Math.round(c * 255)), 255]));
  type Tex = { tex: WebGLTexture; aspect: number };
  let A: Tex = { tex: blank, aspect: 1 };
  let B = A;

  const load = (url: string) =>
    new Promise<Tex>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        resolve({ tex, aspect: img.naturalWidth / img.naturalHeight });
      };
      img.onerror = () => resolve({ tex: blank, aspect: 1 });
      img.src = url;
    });
  const cache = new Map<number, Promise<Tex>>();
  const texture = (i: number) => {
    let t = cache.get(i);
    if (!t) cache.set(i, (t = load(urls[i])));
    return t;
  };

  let mix = 0;
  let time = 30;
  let ptrX = 0, ptrY = 0, toX = 0, toY = 0;

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const ratio = dpr();
    canvas.width = Math.max(1, Math.round(r.width * ratio));
    canvas.height = Math.max(1, Math.round(r.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uCell, Math.max(2, Math.round((opts.cell ?? 3) * ratio)));
  };
  const draw = () => {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, B.tex);
    gl.uniform1f(uAspA, A.aspect);
    gl.uniform1f(uAspB, B.aspect);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uMix, mix);
    gl.uniform2f(uPtr, ptrX, ptrY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const t0 = performance.now();
  let tween: { start: number; ms: number; resolve: () => void } | null = null;
  const loop = reduce
    ? null
    : visibleLoop(canvas, (now) => {
        time = 30 + (now - t0) / 1000;
        ptrX += (toX - ptrX) * 0.06;
        ptrY += (toY - ptrY) * 0.06;
        if (tween) {
          const k = Math.min(1, (now - tween.start) / tween.ms);
          mix = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          if (k >= 1) {
            A = B;
            mix = 0;
            const done = tween.resolve;
            tween = null;
            done();
          }
        }
        draw();
      }, { margin: '0px' });

  const ro = new ResizeObserver(() => {
    size();
    draw();
  });
  ro.observe(canvas);
  const onPointer = (e: PointerEvent) => {
    if (!loop?.visible) return;
    const r = canvas.getBoundingClientRect();
    toX = ((e.clientX - r.left) / r.width) * 2 - 1;
    toY = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  if (!reduce) window.addEventListener('pointermove', onPointer, { passive: true });

  size();
  draw();

  let latest = -1;
  return {
    async show(index) {
      if (!urls[index]) return;
      latest = index;
      const next = await texture(index);
      // a later call won while this image was loading
      if (index !== latest) return;
      // fetch the one after it while this one is on screen
      void texture((index + 1) % urls.length);
      tween?.resolve();
      tween = null;
      B = next;
      // no animation without motion, or in a tab nobody can see
      if (reduce || document.hidden) {
        A = next;
        mix = 0;
        draw();
        return;
      }
      mix = 0;
      return new Promise<void>((resolve) => {
        tween = { start: performance.now(), ms: 1400, resolve };
      });
    },
    destroy() {
      loop?.stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      loseContext(gl);
    },
  };
}
