# @pterodactyl/kit

The visual system pterodactyl.io and docs.pterodactyl.io share: the tokens,
the rails, and the dither shaders that paint every glow, halftone and lit
figure. The design is documented in [DESIGN.md](../DESIGN.md); this is the
code.

| Path | What it is |
| --- | --- |
| `tokens.css` | The design tokens as a Tailwind v4 `@theme`, with an opt-in light mode (`html.light`) |
| `kit.css` | The primitives: rails, the inset rhythm, buttons, status lights, the dot-matrix sign, the figure card, halftone |
| `core/` | The Bayer threshold (CPU and GLSL), the frame-loop contract, WebGL helpers |
| `shaders/lightfield.ts` | Glow, beams and horizon as an ordered dither (WebGL) |
| `shaders/ditherimage.ts` | Photographs as a live halftone with a dissolve (WebGL) |
| `canvas/lightbuffer.ts` | Light for canvas figures, dithered on the same grid (CPU) |
| `canvas/spark.ts` | A history drawn as a dithered sparkline (CPU) |
| `react/` | `<LightField>`, `<DitherImage>`, `<DitherSpark>`, `<Halftone>` |

## Use

```css
@import 'tailwindcss';
@import './kit/tokens.css';
@import './kit/kit.css';
```

```tsx
import { LightField } from './kit/react';

<div className="relative isolate">
  <LightField mode="glow" color="#3d7bfd" focus={[0.5, 0.3]} className="absolute inset-0 -z-10 size-full" />
  …
</div>
```

Fonts: load Mona Sans and JetBrains Mono however the site loads fonts. With
`next/font`, set their `variable` to `--kit-font-sans` and `--kit-font-mono`.

## Sharing it

The kit lives in the landing repository and is copied into other projects
(shadcn-style), so each builds on its own:

```bash
node kit/sync.mjs ../../documentation/kit
```

The copy carries a `VENDORED.md` with the commit it came from. Change the kit
here, then sync; never edit a copy.
