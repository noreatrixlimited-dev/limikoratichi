# Frames: style frames, sample frames and character sheets

Everything here draws in code (canvas 2D or three.js WebGL) and renders headless with Playwright.

## Setup (once per machine)
```
cd .claude/skills/limiko-studio/frames
npm install            # three.js; Playwright is used from the machine (preinstalled in cloud sessions)
```

## Style frames
```
node render.cjs <kids|gaming|facts|history|all> [styleId…]
```
→ `out/<set>/<id>.png` and `out/<set>-sheet.jpg`. Committed previews of every style: `previews/*.jpg`.

| Set file | Formats it serves |
|---|---|
| `styles/kids.js` (12) | 01 Kids · 08 Nature (watercolour, island) · 09 Music (kids songs) |
| `styles/facts.js` (16) | 02 Facts / science · 06 Documentary · 10 Business / tech |
| `styles/history.js` (20) | 03 History / mythology · 06 Documentary · 09 Music (devotional) |
| `styles/gaming.js` (11) | 04 Gaming · 05 Horror (liminal-tape, terminal-crt) · 07 Anime (anime-impact, space-sitcom) |

## Character sheets
```
node character-sheet.cjs <spec.json…> [--out DIR]
```
See `../shared/characters.md`. Styles can draw approved characters: `import { drawCharacter } from '../character.js'`
and load specs with `fetch('../characters/…')` (the server root is the skill folder).

## Sample frames for a film (G6)
Write `films/<slug>/plan/frames.js` in the same shape as a style set (export `{ id: { dim, title, draw } }`),
one entry per key shot, using the approved characters and the chosen style's helpers. Copy it into
`styles/` under a temporary name (e.g. `styles/film-<slug>.js`), run `node render.cjs film-<slug>`,
then move the sheet to `films/<slug>/plan/frames/` and delete the temporary file.

## Animated scenes → video
```
node .claude/skills/limiko-studio/frames/animate.cjs <scene.js> [--out film.mp4] [--from s] [--to s] [--every n] [--audio file]
        [--workers N] [--props p.json] [--keep-frames]
node .claude/skills/limiko-studio/frames/preview.cjs <scene.js> [--props p.json]     # live player: scrub, play with audio, cues, props, hot reload
node .claude/skills/limiko-studio/frames/preview.cjs <scene.js> --snap 0,2,5 --out strip.jpg   # headless check
```
`--workers` renders chunks in parallel browser pages (default: cores, max 4); frames are identical to one worker
because every frame starts from a fresh canvas state. `--props` passes data (`env.props` in setup, `state.props` in
draw, merged over the scene's `defaultProps`; `width`/`height` in props change the canvas, e.g. 1080×1920).

### Templates (data → video)
`node frames/templates.cjs list | render <name> [--props p.json] [--set k=v,…] [--vertical] | batch <name> --data rows.csv|json | still <name> --t 1.5`
Templates in `templates/`: `title-card`, `countdown` (top-N), `stat` (count-up + comparison bar), `quote`, `lower-third`
(green key for overlay). Props: `theme` (kids, facts, history, gaming, business, mystery), `lang` (en, te), content fields.
Each keeps the moving-camera rule and the theme's pacing. CSV: arrays as `a|b`, countdown items as `title::note|title::note`.

### Equations (`mathfx.js`, Manim-style)
`const eq = await M.tex('a^2+b^2=c^2')` in setup (MathJax, Apache-2.0), then in draw: `M.draw(ctx, eq, {x, y, size, t, start, preset: 'write'|'fade'|'rise'|'pop'})`,
`M.transform(ctx, eqA, eqB, p, {...})` (matching symbols travel, the rest fade), `M.box(ctx, eq, await eq.find('c^2'), {p})`.
Example: `examples/math-demo.js`.

### Cinematic 3D (`look3d.js`)
`const look = await cinematic(THREE, canvas, W, H, { quality: 'final'|'draft', grade, fog, focal })` gives image-based
light, filmic tone mapping, MSAA, ambient occlusion, depth of field, bloom, colour grade, vignette and grain.
Helpers: `lens(camera, mm)`, `rig.orbit|dolly|crane|handheld`, `lightShaft`, `dust`, `materials.gold|stone|marble|glass|…`.
Render with `look.render(t, { focus: [x, y, z] })` (move the focus point for a rack focus). Example: `examples/temple-3d.js`.
Use `draft` while blocking shots; `final` costs ≈ 2 s per frame on CPU.
Run from the repo root (the scene must be inside it). A scene module exports
`{ dim, fps, duration, width, height, audio?, setup?(env), draw(ctx, W, H, L, T, t, state) }`
(3D: `draw({ THREE, canvas, W, H, L, T, t, state })`). `T` is `timeline.js`:

| Tool | Use |
|---|---|
| `interpolate(t, [t0,t1,…], [v0,v1,…], {ease})` | any value over time, multi-step |
| `spring(t, {from, to, delay, stiffness, damping})` | natural pops and settles |
| `sequence(t, start, dur)` | a scene's local clock (`.active`, `.t`, `.p`) |
| `script(init, cues).to().wait().together().until('cue')` | storyboard-like tween scripts synced to voice cues |
| `cuesFromWords(words)` | voiceover word timings → named cues |
| `tracker(fn)` | one value drives a whole diagram |
| `onTwos(t, fps)`, `exposure(t, fps, holds)` | hand-made timing, exposure-sheet holds |
| `camera(ctx, W, H, {x, y, zoom, rot, shake}, draw)` | pan / zoom / rotate / shake |
| `parallax(ctx, W, H, cam, layers)` | depth layers for storybook scenes |
| `morph(ptsA, ptsB, p)` | shape-to-shape explanations |
| `sway`, `bob` | secondary motion |

Working example: `examples/pip-meadow.js` (Kids format: slow push-in, character on twos, parallax,
drifting clouds, spring title) → `previews/pip-meadow.mp4`. Use 'examples' as the starting point for new scenes.
Speed: about 4 frames/s for a layered 2D scene at 1280×720 in this container.

## Transitions and text animations
`transitions.cjs` (GL Transitions, 166, in `transitions/gl/` with their licence) and `textfx.js` (25 text presets).
Usage, previews and picks per format: `../shared/transitions-text.md`. Demos: `examples/textfx-demo.js`.

## Adding a style
1. Add an entry to the right `styles/<set>.js`: `{ dim: '2d' | '3d', title, draw }`.
   2D: `draw(ctx, W, H, L)`. 3D: `draw({ THREE, canvas, W, H, L })`. `L` is `lib.js` (seeded random, paper,
   grain, crayon, wash, halftone, isometric, film damage, three.js setup).
2. Render it, look at it, fix it.
3. Add a row for it in the format's `styles.md` (or `direction.md` styles table).

## Rules
- Seeded randomness only (`L.rng(seed)`): every render is identical.
- 3D canvases that need 2D overlays (labels, blur) draw onto a 2D canvas that replaces `#c`.
- No copyrighted characters, logos or artwork in any style.
