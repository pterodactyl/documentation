// The five section hues, the panel's own quick themes, for code that needs
// them as values (a light field's colour, a chart series). In CSS use the
// --color-hue-* tokens.
export const HUES = {
  blue: '#3d7bfd',
  emerald: '#34d399',
  violet: '#a78bfa',
  amber: '#f5a524',
  rose: '#fb7185',
} as const;

export type Hue = keyof typeof HUES;
