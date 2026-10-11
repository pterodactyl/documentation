'use client';
// <DitherSpark>: a history on the dither grid. Pass values 0..1, oldest
// first; it redraws when they change and when its box resizes.
import { useEffect, useRef, type CSSProperties } from 'react';
import { drawDitherSpark, fitCanvas, type SparkOptions } from '../canvas/spark';

export type DitherSparkProps = SparkOptions & {
  values: number[];
  className?: string;
  style?: CSSProperties;
  label?: string;
};

export function DitherSpark({ values, className, style, label, ...opts }: DitherSparkProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ values, opts });
  latest.current = { values, opts };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (fitCanvas(canvas)) drawDitherSpark(canvas, latest.current.values, latest.current.opts);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas?.width) drawDitherSpark(canvas, values, opts);
  });

  return <canvas ref={ref} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} className={className} style={style} />;
}
