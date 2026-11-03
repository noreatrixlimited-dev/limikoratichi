# Rendering engines: which one, and what we learned from each

Engine ids are in `../REFERENCES.txt` (section 11 and above). The default is our own renderer
(`../frames/`): HTML canvas + three.js, rendered frame by frame. It needs no installs beyond Node and
Playwright, and its timeline toolkit (`../frames/timeline.js`) carries the best ideas from the engines below.
Fetch an outside engine only when its strength is essential to the shot.

## Choosing
| Need | First choice | Reach for |
|---|---|---|
| Kids picture-book animation, storybook history | own renderer (2D + parallax + character rig) | `R-opentoonz` for hand-drawn hero shots |
| Infographics, kinetic type, lyric videos, captions | own renderer / HTML | `E-html`, `E-remotion` for big template series |
| Maths, physics, step-by-step science | own renderer for simple; `E-manim` / `E-manim-3b1b` for equations and transforms | |
| Narrated explainers with precise voice sync | own renderer with cue timeline | `R-mcanvas` |
| 3D products, kids 3D worlds, cutaways | own renderer (three.js) | `R-r3f` + `R-drei` for component-heavy scenes |
| Cinematic 3D: characters, temples, battlefields, volumetric light | `R-blender` (on a machine that has it) | AI clips for photoreal inserts |
| Data-driven series (100 Shorts from a spreadsheet) | `E-remotion` | own renderer with a data loop |

Licences: all are fine for our videos; `E-remotion` is free only for individuals and companies of up to 3 people.

## What each engine taught us (and where we use it)

### HTML → video (`E-html`)
- **Seek, don't play.** Time is an input: the page draws the exact state for time *t*, so any frame can be
  rendered again identically. Our `renderFrame(t)` rule (`building.md`) is this idea.
- Paused animation timelines can be seeked the same way, so CSS-style motion works in video.
- Captions, lower-thirds and overlays are just HTML: fast to build and restyle.

### Remotion (`E-remotion`)
- **Composition = component with props.** One scene definition, many videos from data (titles, numbers, names).
- **Frame-driven maths:** `interpolate(frame, [in…], [out…], clamp)` and physical `spring()` replace hand-written easing.
- **Sequences:** each scene lives in its own time window with its own local clock; scenes can be reordered without retiming their insides.
- → `timeline.js`: `interpolate`, `spring`, `sequence`, data-driven scenes.

### Motion Canvas (`R-mcanvas`)
- **Animation as a script:** tweens run in order and wait for each other ("move, then fade, then wait for the voice"), which reads like a storyboard.
- **Time events:** named cues that line up with the voiceover; move the cue, the animation follows.
- **Signals:** values that other values depend on (a label follows a moving object automatically).
- **Camera as an object** that pans, zooms and follows, separate from the scene.
- → `timeline.js`: `script()` (sequential/parallel tweens), `cues` from the voice track, `camera()`, derived values.

### ManimGL and Manim Community (`E-manim-3b1b`, `E-manim`)
- **Explain by transformation:** a shape morphs into the next idea (equation → graph, circle → unrolled line) so the viewer sees *why*.
- **Value trackers with updaters:** one number drives the whole diagram (angle, temperature, time); everything redraws from it.
- **Build-up order:** write, then highlight, then transform, then fade what's no longer needed. One idea on screen at a time.
- **Moving camera frame** and 3D axes for spatial maths.
- → `timeline.js`: `tracker()`; `morph()` between point sets; the facts direction profile's "visual mechanism" rule.

### OpenToonz (`R-opentoonz`)
- **Exposure sheet:** each drawing is held for a number of frames (on ones, twos, threes). Timing *is* the animation's personality.
- **Keys and inbetweens:** strong key poses first, then breakdowns, then inbetweens; spacing (not just timing) creates weight.
- **Onion skin** to check arcs; **bone and mesh rigs** for cut-out characters; **lip-sync charts** from the voice track.
- **Layered compositing** with per-layer effects (glow, blur, light).
- → `timeline.js`: `exposure()`; the character rig's pose interpolation; lip-sync from mouth-shape data (`A-rhubarb`).

### Blender (`R-blender`)
- **Cinematic 3D grammar:** real camera rigs (dolly, crane, focal length), depth of field, volumetric god-rays, three-point lighting.
- **Faces with shape keys**, bodies with rigs and retargeted motion; **Grease Pencil** draws 2D inside 3D space (storybook look with real depth).
- **Headless Python** (`blender --background --python scene.py`) renders shots from a script: same storyboard JSON in, PNG sequence out.
- → `3d.md` Blender recipe; our three.js scenes copy the lighting and lens habits (focal lengths, DOF bands, fog for depth).

### React Three Fiber + Drei (`R-r3f`, `R-drei`)
- **Scene as components:** a temple, a tree, a character become reusable pieces with props.
- **Polish helpers:** contact shadows under objects, image-based environment light, floating motion, 3D text, billboards.
- **Per-frame hook:** for video, drive it from the frame number, never from the clock.
- → our `three3d()` helper and 3D style frames; contact-shadow and environment-light habits for kids and product 3D.

## Rules for adopting outside code
1. Check the licence in REFERENCES.txt (and the repo, if it has changed). Record what was adopted.
2. Learn techniques and re-implement them in our own code where practical; vendor code only with its licence notice kept.
3. Never copy whole projects, example artwork, models or fonts without their own licence allowing it.
4. Deterministic output: whatever engine, every frame is a function of time, so re-renders match.
