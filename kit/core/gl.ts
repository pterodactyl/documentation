// WebGL boilerplate the shaders share: one program drawn as a single
// full-screen triangle (three vertices, no index buffer, no seams).

export const FULLSCREEN_VERT = /* glsl */ `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/** A program on its way: `ready()` is false while the GPU builds it, then true, or null if the GPU said no. */
export interface PendingProgram {
  prog: WebGLProgram;
  /** the browser can say when the build is done (KHR_parallel_shader_compile) */
  tells: boolean;
  /** `now` asks at once, waiting out the rest of the build if it must */
  ready: (now?: boolean) => boolean | null;
}

/**
 * Compile and link without waiting. Asking a program anything (did it link,
 * where is a uniform) waits until the GPU has built it. In Firefox WebGL runs
 * in its own process and cannot report progress (no
 * KHR_parallel_shader_compile), so that wait stops the whole page for as long
 * as the compile takes. So nothing asks until the build is done (where the
 * browser can tell) or the program is needed on screen: the GPU builds it
 * meanwhile and the page goes on.
 */
export function buildProgram(gl: WebGLRenderingContext, vert: string, frag: string): PendingProgram | null {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  // The triangle's attribute is always 0, so no draw needs to ask for it.
  gl.bindAttribLocation(prog, 0, 'a');
  gl.linkProgram(prog);
  // start the build now, not with the next draw
  gl.flush();
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  let state: boolean | null | undefined;
  return {
    prog,
    tells: !!parallel,
    ready(now = false) {
      if (state !== undefined) return state;
      if (!now && !(parallel && gl.getProgramParameter(prog, parallel.COMPLETION_STATUS_KHR))) return false;
      state = gl.getProgramParameter(prog, gl.LINK_STATUS) ? true : null;
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!state) gl.deleteProgram(prog);
      return state;
    },
  };
}

/**
 * Wait for a build without holding up the page: watch it while the browser
 * can say when it is done, and otherwise wait until `el` is on screen and has
 * to draw, then ask once. `done` gets the program, or null if the GPU said
 * no. Returns a cancel.
 */
export function whenBuilt(el: Element, build: PendingProgram, done: (prog: WebGLProgram | null) => void): () => void {
  const at = performance.now();
  let onScreen = false;
  let raf = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    io.disconnect();
  };
  const check = () => {
    raf = 0;
    // a frame or two first, so the GPU has a start on one already on screen
    const ok = build.ready(onScreen && performance.now() - at > 50);
    if (ok === false) {
      if (onScreen || build.tells) raf = requestAnimationFrame(check);
      return;
    }
    stop();
    done(ok ? build.prog : null);
  };
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((e) => e.isIntersecting);
    if (onScreen && !raf) raf = requestAnimationFrame(check);
  });
  io.observe(el);
  raf = requestAnimationFrame(check);
  return stop;
}

/** Feed the full-screen triangle to attribute 0 (buildProgram binds `a` there). */
export function fullscreenTriangle(gl: WebGLRenderingContext) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

/** Release the context when a surface is destroyed, so pages with many never hit the browser's limit. */
export const loseContext = (gl: WebGLRenderingContext) => gl.getExtension('WEBGL_lose_context')?.loseContext();

export type RGB = [number, number, number];

/** '#3d7bfd' → [0.24, 0.48, 0.99] */
export const hexToRgb = (hex: string): RGB => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
