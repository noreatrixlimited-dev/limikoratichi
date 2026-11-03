# limikoratichi · Limiko Studio

A director's system for YouTube videos, built as a [Claude Code](https://claude.ai/code) skill. It plans, animates,
voices, edits, scores and packages videos in **10 formats**, with **native English and native Telugu** narration.

| | |
|---|---|
| **Formats** | kids · facts and science · history and mythology · gaming edits · horror · documentary · anime · nature · music and lyric · business and tech. Each format has its own pacing, camera, transitions and checklist. |
| **Planning** | Gates come before any full video: topic → look → characters → concept → storyboard → sample frames → your approval |
| **Picture** | Code-drawn 2D and three.js 3D, rendered frame by frame, so every render is identical. Includes 59 style frames, a character rig, a timeline toolkit, a cinematic 3D look (depth of field, ambient occlusion, bloom, light shafts, grade) and Manim-style equations. |
| **Templates** | Title card, countdown, stat, quote and lower third. Driven by JSON or CSV, in English or Telugu, horizontal or vertical (Shorts). |
| **Voice** | English: Kokoro (offline). Telugu: Indic Parler-TTS (Lalitha, Prakash, Kiran) and IndicF5 (a voice from a reference clip). Word timings, cues and captions drive the animation. |
| **Editing** | Gaming highlight editor with SAM 2 character outlines, zoom-on-kill and transitions. 166 GPU transitions and 25 text animations (Telugu-safe). |
| **Hooks and packaging** | Scoring of the first 10 seconds (the O-10 curiosity format, English and Telugu), thumbnails, titles, descriptions and tags |
| **Tools** | Live preview player, parallel rendering, one-command pipeline, tests and CI |

## Quick start
```bash
cd .claude/skills/limiko-studio
```
```bash
bash scripts/setup.sh            # renderer + English voice; add --telugu, --vision or --all
```
```bash
python3 scripts/make.py new why-the-sea-is-salty --format facts --lang en,te
```
Then fill in `films/why-the-sea-is-salty/plan/` and the voice scripts, and run each stage in order:
```bash
python3 scripts/make.py check why-the-sea-is-salty     # scripts parse, hook scores
```
```bash
python3 scripts/make.py draft why-the-sea-is-salty     # voice + half-rate preview video
```
```bash
python3 scripts/make.py approve why-the-sea-is-salty   # only after you approve the plan and samples
```
```bash
python3 scripts/make.py final why-the-sea-is-salty     # full render, loudness, hook check, report
```

With Claude Code, just ask, for example: *"make a 60-second facts video about why the sea is salty, English and Telugu"*.
The skill walks through planning, approval and production.

## Everyday commands (from `.claude/skills/limiko-studio`)
| Job | Command |
|---|---|
| Live preview of a scene (scrub, cues, props, hot reload) | `node frames/preview.cjs <scene.js>` (from the repo root) |
| Render a scene | `node frames/animate.cjs <scene.js> --out film.mp4 [--workers 4]` (from the repo root) |
| Template videos from data | `node frames/templates.cjs batch countdown --data rows.csv --vertical` |
| Voice-over | `python3 scripts/voice.py render voice.te.md --out out/voice-te` |
| Score an opening | `python3 scripts/hookcheck.py --text "Why does the sea taste salty?"` |
| Transitions | `node frames/transitions.cjs join A.mp4 B.mp4 --name CrossZoom --out AB.mp4` |
| Gaming edit | `scripts/gameedit.py scan → badges → render edit.json` (see `formats/04-gaming/edits.md`) |
| Thumbnail | `scripts/thumbnail.py make --video raw.mp4 --t 37 --title "LINE 1\|LINE 2"` |
| Copy a trend's editing | `python3 scripts/analyze.py reference.mp4` |

The full map of every job (what to read, what to run, when to ask, what to deliver) is in
[`.claude/skills/limiko-studio/GUIDE.md`](.claude/skills/limiko-studio/GUIDE.md).

## Tests
```bash
cd .claude/skills/limiko-studio && node --test tests/*.test.mjs && python3 -m unittest discover -s tests -v
```
CI runs the same tests on every push (`.github/workflows/tests.yml`). Render tests are skipped when Playwright or
ffmpeg are missing.

## Rules the studio keeps
- Native English and native Telugu only. Each language is written natively, never translated word for word.
- The first 10 seconds open a curiosity gap. The camera moves in every shot. Each format keeps its own identity.
- Facts need sources. Myths are told as stories from a named tradition.
- Everything is written fresh. Outside projects, models and assets are named only in
  [`REFERENCES.txt`](.claude/skills/limiko-studio/REFERENCES.txt), with their licence and commercial-use status.
- No personal footage or data in this public repository.

## Licences of included third-party parts
GL Transitions (MIT/BSD, notice in `frames/transitions/gl/`), Noto Telugu fonts (OFL, notice in `frames/fonts/`).
Installed at setup and not stored here: three.js (MIT), MathJax (Apache-2.0), Kokoro (Apache-2.0), Indic Parler-TTS
(Apache-2.0), IndicF5 (MIT), DETR and SAM 2 (Apache-2.0). Details and links are in `REFERENCES.txt`.
