# Building a code-drawn film

Shared technique for every style in `README.md`.

## Project layout
```
films/<slug>/
  brief.md          # audience, takeaway, length, size, style id
  script.md         # narration with beat markers [B1] [B2] …
  shots.json        # [{id, start, end, picture, motion, sound}]
  audio/voice.wav   # narration, rendered first
  audio/music.wav
  src/index.html    # one page, exposes window.renderFrame(t)
  render.mjs        # opens the page in headless Chromium, steps time, saves PNGs
  out/frames/*.png
  out/film.mp4
  credits.txt
```

## The one rule: time is a parameter
The page never animates on its own. It exports `renderFrame(t)` (seconds) and draws the exact
state for that moment. No `requestAnimationFrame`, no `Date.now()`, no CSS transitions.
That makes every render identical and lets you scrub to any frame.

Randomness: use a seeded generator (e.g. mulberry32) so "hand-made" wobble is the same every render.

## Render loop (Playwright)
```js
// render.mjs
import { chromium } from 'playwright';
const fps = 30, dur = Number(process.argv[2] ?? 30);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + process.cwd() + '/src/index.html');
for (let f = 0; f < fps * dur; f++) {
  await p.evaluate(t => window.renderFrame(t), f / fps);
  await p.screenshot({ path: `out/frames/${String(f).padStart(5, '0')}.png` });
}
await b.close();
```

## Encode and mix
```
ffmpeg -framerate 30 -i out/frames/%05d.png -i audio/mix.wav \
  -c:v libx264 -pix_fmt yuv420p -crf 18 -c:a aac -b:a 192k -shortest \
  -movflags +faststart out/film.mp4
```
Voice + music with ducking:
```
ffmpeg -i audio/voice.wav -i audio/music.wav -filter_complex \
 "[1]volume=0.35[m];[m][0]sidechaincompress=threshold=0.05:ratio=8[d];[d][0]amix=2:normalize=0,loudnorm=I=-14:TP=-1.5" \
 audio/mix.wav
```

## Style toolbox (how the looks are made)
| Effect | How |
|---|---|
| Paper / crayon grain | Pre-render a noise texture once, multiply over each frame |
| Hand-drawn wobble ("boil") | Offset path points by seeded noise that changes every 2nd frame |
| Draw-on lines | SVG `stroke-dasharray` / canvas path length driven by `t` |
| Watercolor bloom | Several low-alpha blurred fills, darker edge via a stroke of the same path |
| Halftone | Sample brightness on a grid, draw circles sized by value |
| Film grain / scratches | Seeded noise layer + random vertical lines, flicker exposure ±3% |
| CRT | Scanline overlay, slight barrel warp (WebGL), RGB split on glitch |
| Tilt-shift | Gaussian blur mask top and bottom, boost saturation |
| Isometric | Draw on a 2:1 grid; z-sort by x+y |
| Low-poly 3D | Three.js with flat shading, orthographic camera for iso |

## Easing that feels alive
- Ease-out for arrivals, ease-in for exits, overshoot (back-out) for playful pops.
- Hold every key pose ≥ 8 frames so the eye can read it.
- Animate on twos (change every 2nd frame) for hand-made styles; on ones for UI/kinetic type.

## Captions
Burn in, 2 lines max, 6–8 words per line, centred in the lower third (vertical: 62–72% height).
Highlight the key word in the style's accent colour.
