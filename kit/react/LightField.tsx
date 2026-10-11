'use client';
// <LightField>: the light field as a component. Position it like any canvas
// (absolute inset-0, behind the content); it sizes itself to its box.
//
// The WebGL context is created as the canvas nears the viewport (or on the
// next frame when `lazy` is off), never synchronously during mount: React's
// development double-mount would otherwise create a context, lose it in the
// cleanup and try to reuse the lost one.
import { useEffect, useRef, type CSSProperties } from 'react';
import { hexToRgb, type RGB } from '../core/gl';
import { whenNear } from '../core/loop';
import { mountLightField, type LightField as Field, type LightFieldOptions } from '../shaders/lightfield';

type Paint = string | RGB;
const rgb = (c: Paint): RGB => (typeof c === 'string' ? hexToRgb(c) : c);

export type LightFieldProps = Omit<LightFieldOptions, 'color' | 'color2'> & {
  /** a hex colour or 0..1 RGB; changes ease across */
  color?: Paint;
  color2?: Paint;
  /** create the context only when near the viewport (default true) */
  lazy?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function LightField({ color = '#3d7bfd', color2, intensity = 1, lazy = true, className, style, ...opts }: LightFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const field = useRef<Field | null>(null);
  const latest = useRef({ color, color2, intensity });
  latest.current = { color, color2, intensity };

  // Mode, focus, radius and the rest are fixed for the life of the canvas.
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const mount = () => {
      const now = latest.current;
      field.current = mountLightField(canvas, { ...opts, color: rgb(now.color), color2: now.color2 ? rgb(now.color2) : undefined, intensity: now.intensity });
    };
    let cancel: () => void;
    if (lazy) cancel = whenNear(canvas, mount);
    else {
      const id = requestAnimationFrame(mount);
      cancel = () => cancelAnimationFrame(id);
    }
    return () => {
      cancel();
      field.current?.destroy();
      field.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = typeof color === 'string' ? color : color.join(',');
  const key2 = color2 === undefined ? '' : typeof color2 === 'string' ? color2 : color2.join(',');
  useEffect(() => {
    field.current?.setColor(rgb(color), color2 ? rgb(color2) : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, key2]);
  useEffect(() => field.current?.setIntensity(intensity), [intensity]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={['lf-canvas', className].filter(Boolean).join(' ')}
      style={{ ...(typeof color === 'string' ? ({ '--hue': color } as CSSProperties) : {}), ...style }}
    />
  );
}
