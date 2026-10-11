// <Halftone>: an image seen through the 3px dot grid, in CSS. The full image
// develops beneath it on hover, on focus within, or while `active`. No canvas,
// no client code: it renders on the server.
import type { CSSProperties } from 'react';

export interface HalftoneProps {
  src: string;
  alt?: string;
  active?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Halftone({ src, alt = '', active, className, style }: HalftoneProps) {
  return (
    <span className={['halftone-frame', className].filter(Boolean).join(' ')} data-active={active ? '' : undefined} style={style}>
      <img src={src} alt={alt} className="halftone-dots" loading="lazy" decoding="async" draggable={false} />
      <img src={src} alt="" aria-hidden="true" className="halftone-full" loading="lazy" decoding="async" draggable={false} />
    </span>
  );
}
