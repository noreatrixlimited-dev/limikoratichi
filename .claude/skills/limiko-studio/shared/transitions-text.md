# Transitions and text animations

Two libraries, both rendered by our own tools:
- **Video transitions:** 166 GPU transitions (`../frames/transitions/gl/`, the GL Transitions collection, MIT/BSD,
  licence kept in that folder) run by `../frames/transitions.cjs`, plus ffmpeg's own `xfade` set for quick jobs.
- **Text animations:** 25 kinetic-type presets in `../frames/textfx.js` (written for this studio), for English and
  Telugu (Telugu syllables are animated whole, never split).

Previews: `../frames/previews/transitions.jpg` (every GL transition at mid-point), `transition-cube.mp4`,
`textfx.mp4` (every text preset, English and Telugu rows).

## Video transitions

```
cd .claude/skills/limiko-studio/frames
node transitions.cjs list [tag]                         # name · tags · description (e.g. list glitch, list zoom)
node transitions.cjs join A.mp4 B.mp4 --name CrossZoom --dur 0.6 [--ease inOut] [--set "strength=0.6"] --out AB.mp4
node transitions.cjs chain --list clips.txt --names WhipPan,CrossZoom --dur 0.5 --out all.mp4
node transitions.cjs sheet                              # rebuild the preview sheet
```
`join` blends A's last `dur` seconds into B's first `dur` seconds and crossfades the audio over the same time.
Speed on CPU: ~40 s per 0.6 s transition at 1920×1080.

Quick alternative without the GPU renderer (ffmpeg built-in):
`ffmpeg -i A.mp4 -i B.mp4 -filter_complex "[0][1]xfade=transition=circleopen:duration=0.6:offset=<lenA-0.6>[v];[0:a][1:a]acrossfade=d=0.6[a]" -map "[v]" -map "[a]" out.mp4`
xfade names: fade fadeblack fadewhite fadegrays dissolve distance wipeleft/right/up/down wipetl/tr/bl/br slideleft/right/up/down
smoothleft/right/up/down circlecrop rectcrop circleopen circleclose vertopen vertclose horzopen horzclose radial pixelize
diagtl/tr/bl/br hlslice hrslice vuslice vdslice hblur squeezeh squeezev zoomin hlwind hrwind vuwind vdwind
coverleft/right/up/down revealleft/right/up/down fadefast fadeslow.

### Which transitions per format (use 2–4 per film; repetition reads as style)
| Format | GL transitions that fit | Duration |
|---|---|---|
| 01 Kids | Fade, CircleOpen, HeartWipe, StarWipe, BookFlip, InvertedPageCurl, Bounce, WaterDrop, FlowerWipe, Dreamy | 0.6–1.0 s, ease inOut |
| 02 Facts / science | CrossZoom, SimpleZoom, ZoomInCircles, Directional, DirectionalWipe, Slides, SquaresWipe, Hexagonalize, GridFlip, Cube | 0.4–0.7 s |
| 03 History / mythology | InkBleed, BurnThrough, FilmBurn, FilmDissolve, PaperTear, BookFlip, Curtains, Doorway, LightRays, LeafWipe, FadeColor (dip to black) | 0.8–1.4 s |
| 04 Gaming | WhipPan, WhipSpin, WhipTilt, CrossZoom, GlitchDisplace, GlitchMemories, GlitchBands, StripDatamoshGlitch, Shatter, LightStreaks, Overexposure, Cube | 0.25–0.5 s, on the beat |
| 05 Horror / mystery | TvStatic, StaticFade, StaticWipe, TvTurnOff, TvRoll, GlitchFlicker, DefocusBlur, FadeColor (black), BurnThrough | 0.5–1.2 s |
| 06 Documentary | Fade, FadeColor, FilmDissolve, LinearBlur, FadeGrayscale, PhotoDevelop, Directional, Slides | 0.6–1.0 s |
| 07 Anime / cartoon | WhipPan, CrossZoom, Shatter, Bounce, Squeeze, SpiralWipe, StarWipe, PowerKaleido | 0.3–0.6 s |
| 08 Nature / wildlife | Fade, Dreamy, BokehDissolve, WaterDrop, Ripple, LeafWipe, Wind, LightRays | 0.8–1.5 s |
| 09 Music / lyric | CrossZoom, LightStreaks, ColorPhase, Kaleidoscope, PowerKaleido, Pinwheel, Prisms, Accordion, BowTieHorizontal | on the beat (1 beat) |
| 10 Business / tech | Slides, DirectionalWipe, GridFlip, Cube, SquaresWipe, ZoomWipeLeft, ZoomWipeRight, SimpleZoom, Box | 0.4–0.6 s |
Rules: kids never get glitch, static, shatter or fast whips; history never gets digital glitches; a transition must
not hide the hook or a kill moment.

## Text animations

```js
import { drawText, PRESET_INFO } from '<skill>/frames/textfx.js';
drawText(ctx, 'QUADRA TAKEDOWN', { x: 960, y: 200, t, start: 2.0, preset: 'stamp', exit: 'fadeDown',
          size: 120, font: 'Inter', weight: 900, color: '#fff', stroke: '#000', strokeW: 10, accent: '#ffd23f',
          unit: 'word', stagger: 0.06, dur: 0.45, hold: 1.5 });
// Telugu: font: L.FONT.te, lang: 'te' (unit 'grapheme' keeps syllables whole)
```
Presets: fade · fadeUp · fadeDown · slideLeft · slideRight · dropIn · popBounce · elasticPop · zoomIn · stamp ·
rotateIn · flipUp · blurIn · trackingIn · maskRise · typewriter · wave · jelly · glitch · neonFlicker · highlight ·
karaoke · underline · boxReveal · shake (descriptions in `PRESET_INFO`). Captions timed to the voice: start each
caption at its `timeline.captions[i].start` (from `voice.py`) and use `karaoke` with `dur` = the caption's length.

| Format | Text presets that fit |
|---|---|
| 01 Kids | popBounce, dropIn, elasticPop, wave, jelly, karaoke (sing-along) |
| 02 Facts | maskRise, highlight, underline, boxReveal, typewriter, fadeUp, trackingIn (numbers: popBounce) |
| 03 History / mythology | blurIn, trackingIn, fadeUp, maskRise (titles and dates: slow, dur 0.8–1.2 s) |
| 04 Gaming | stamp, zoomIn, glitch, shake, neonFlicker, popBounce |
| 05 Horror | typewriter, glitch, neonFlicker (flickering), blurIn |
| 06 Documentary | maskRise, fadeUp, typewriter (dates, places) |
| 07 Anime | stamp, zoomIn, elasticPop, shake |
| 09 Music | karaoke, wave, popBounce, maskRise |
| 10 Business | maskRise, slideLeft, boxReveal, trackingIn |
Readability: hold every text at least 1 s per 3 words; never animate text the viewer must read during the move.
