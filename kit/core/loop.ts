// The kit's performance contract, in one place. Every animated surface runs
// through these, so none of them can forget it:
//
//   - a frame loop exists only while its element is on screen in a visible
//     tab (no idle requestAnimationFrame wake-ups off screen);
//   - it renders at a capped rate (30fps by default: a dither only changes
//     when a dot crosses its threshold, so 60 looks the same and costs double);
//   - under prefers-reduced-motion nothing loops; callers draw one still frame;
//   - heavy setup (a WebGL context, a shader compile) can wait until the
//     element comes near the viewport.

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface VisibleLoop {
  readonly visible: boolean;
  stop: () => void;
}

/**
 * Call `frame` at up to `fps` while `el` is within `margin` of the viewport and
 * the tab is visible. `dt` is seconds since the previous frame, capped at 0.1
 * so a long pause never arrives as one huge step.
 */
export function visibleLoop(
  el: Element,
  frame: (now: number, dt: number) => void,
  { fps = 30, margin = '120px', onVisibility }: { fps?: number; margin?: string; onVisibility?: (visible: boolean) => void } = {},
): VisibleLoop {
  let visible = false;
  let raf = 0;
  let last = 0;
  const gap = 1000 / fps - 1;

  const loop = (now: number) => {
    if (!visible || document.hidden) {
      raf = 0;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
    if (last && now - last < gap) return;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    frame(now, dt);
  };
  const wake = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      onVisibility?.(visible);
      wake();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  document.addEventListener('visibilitychange', wake);

  return {
    get visible() {
      return visible;
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      document.removeEventListener('visibilitychange', wake);
    },
  };
}

/**
 * Run `mount` once `el` comes within `margin` of the viewport. Returns a
 * cancel function (for a component unmounting before it was ever near).
 */
export function whenNear(el: Element, mount: () => void, margin = '600px') {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      mount();
    },
    { rootMargin: margin },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Device pixels for a canvas, capped at 2: the dither is a pixel grid and beyond 2× nobody can see the difference. */
export const dpr = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);
