// Numbers that are always the same for one thing, so a page can give each
// item (an egg, an extension) its own composition without storing one.

/** `count` numbers from 0 to 1 for a text, by FNV-1a. The same text gives the same numbers. */
export function seedOf(text: string, count = 3): number[] {
  let h = 0x811c9dc5;
  const out: number[] = [];
  for (let n = 0; n < count; n++) {
    for (const ch of `${text}:${n}`) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out.push(h / 0xffffffff);
  }
  return out;
}

/**
 * Where to put a light field's core so it spills out around a card centred
 * in the canvas: a point on the card's edge, at an angle the text picks.
 * Pass the result to mountLightField or <LightField>.
 */
export function edgeLight(text: string): { focus: [number, number]; radius: number } {
  const [a, b] = seedOf(text, 2);
  const angle = a * Math.PI * 2;
  return {
    focus: [0.5 + Math.cos(angle) * 0.44, 0.5 + Math.sin(angle) * 0.36],
    radius: 0.55 + b * 0.25,
  };
}
