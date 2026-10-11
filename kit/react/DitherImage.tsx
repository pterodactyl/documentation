'use client';
// <DitherImage>: photographs as a live halftone, dissolving between them.
// Controlled by `index`; the first image dissolves in from ink the first time
// the canvas is seen.
import { useEffect, useRef, type CSSProperties } from 'react';
import { whenNear } from '../core/loop';
import { mountDitherImage, type DitherImage as Surface, type DitherImageOptions } from '../shaders/ditherimage';

export type DitherImageProps = DitherImageOptions & {
  images: string[];
  index?: number;
  className?: string;
  style?: CSSProperties;
};

export function DitherImage({ images, index = 0, className, style, ...opts }: DitherImageProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const surface = useRef<Surface | null>(null);
  const want = useRef(index);
  want.current = index;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const cancel = whenNear(
      canvas,
      () => {
        surface.current = mountDitherImage(canvas, images, opts);
        void surface.current.show(want.current);
      },
      '200px',
    );
    return () => {
      cancel();
      surface.current?.destroy();
      surface.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.join('|')]);

  useEffect(() => {
    void surface.current?.show(index);
  }, [index]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={style} />;
}
