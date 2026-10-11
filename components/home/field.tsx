'use client';

import { useTheme } from 'next-themes';
import { LightField, type LightFieldProps } from '@/kit/react';

/**
 * The kit's light field, aware of the docs' theme. On the dark canvas it glows;
 * on white it prints as a coloured halftone, which wants less of it, so light
 * mode runs it at `lightIntensity`. The intensity eases between the two when
 * the theme switches.
 */
export function Field({ intensity = 0.7, lightIntensity, ...props }: LightFieldProps & { lightIntensity?: number }) {
  const { resolvedTheme } = useTheme();
  const light = resolvedTheme === 'light';
  return <LightField {...props} intensity={light ? (lightIntensity ?? intensity * 0.7) : intensity} />;
}
