// WebGL boilerplate the shaders share: one program drawn as a single
// full-screen triangle (three vertices, no index buffer, no seams).

export const FULLSCREEN_VERT = /* glsl */ `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

/** Compile and link, or return null if the GPU says no (the caller falls back). */
export function createProgram(gl: WebGLRenderingContext, vert: string, frag: string): WebGLProgram | null {
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
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  return prog;
}

/** Bind the full-screen triangle to the program's `a` attribute. */
export function fullscreenTriangle(gl: WebGLRenderingContext, prog: WebGLProgram) {
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
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
