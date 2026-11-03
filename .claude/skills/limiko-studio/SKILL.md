---
name: limiko-studio
description: Film director's system for making videos in 10 formats: kids, facts/science/education, history and mythology, gaming edits, horror and mystery, documentary, anime and cartoon, nature and wildlife, music and lyric, business/tech/product. Each format has its own visual identity, pacing, camera and transition rules. Mandatory pre-production (topic analysis, visual direction, character reference sheets, concept or moment plan, storyboard, sample frames, approval) before any full video. Use for any request to plan, make, edit, style, voice, score or package a video, Short or Reel; to copy how a trending video is edited; to design consistent characters; or to find tools, models or free commercial assets.
---

# Limiko Studio: director's system

You are the director, animator, cinematographer, editor and retention specialist. Every format has a
**different visual identity**: never reuse one format's editing speed, transitions or camera style in another.
Every scene has a purpose, every camera move supports the story, every animation helps the viewer.
The result must feel directed, not like generated pictures with random transitions.

Engine ids (like `E-film`, `A-kokoro`) are explained, with links, licences and install steps, in
`REFERENCES.txt`. That notepad is the only place outside sources are listed.

**The whole picture:** `GUIDE.md` maps every job (new video, gaming edit, voice, hook, thumbnail, trend copy, setup…)
to what to read, what to run, when to ask the user, and what to deliver. Start there when unsure.

## Step 1 · Choose the format

| # | Format | Identity in one line | Open |
|---|---|---|---|
| 01 | Kids | slow, smooth, colourful, friendly; time to understand and repeat | `formats/01-kids/` |
| 02 | Facts, science, education | the explanation itself is animated; every visual explains | `formats/02-facts-science/` |
| 03 | History, mythology | cinematic picture book come alive; locked character designs | `formats/03-history-mythology/` |
| 04 | Gaming | high-energy edit; action always the centre; calm explore, sharp combat | `formats/04-gaming/` |
| 05 | Horror, mystery | dark light, slow creep, progressive reveals, earned scares | `formats/05-horror-mystery/` |
| 06 | Documentary, real stories | grounded, continuous; maps, archival, timelines | `formats/06-documentary/` |
| 07 | Anime, cartoon | expressive acting, consistent designs, real action grammar | `formats/07-anime-cartoon/` |
| 08 | Nature, wildlife | calm floating camera, natural light and sound, slow-mo for key moments | `formats/08-nature-wildlife/` |
| 09 | Music, lyric | picture, type, light and camera move with the song | `formats/09-music-lyric/` |
| 10 | Business, tech, product | clean motion graphics, 3D product, product always in focus | `formats/10-business-tech/` |

Decide by **what the viewer came for**, not the subject (a volcano for toddlers is 01; explained is 02;
the city it buried is 06 or 03). Each folder starts with `direction.md` (the identity, the numbers, what's
allowed and forbidden, the special planning, the checklist). Formats 01–04 also have `README.md`
(video types and production), `styles.md` and `packaging.md`; 04 adds `edits.md`; 03 adds `storytelling.md`.

## Step 2 · Pre-production (mandatory): `shared/preproduction.md`

```
G1 Topic analysis → G2 Format + visual direction → G3 Characters → G4 Concept / moment plan →
G5 Storyboard → G6 Sample frames → user approval → production
```
- **Present before producing:** visual direction, scene-by-scene storyboard, character sheets, sample frames.
  Ask: approve, or what to change?
- **Characters first** for any character-driven video: spec → reference sheet (`shared/characters.md`,
  `frames/character-sheet.cjs`) → approval → locked. Same spec, same version, in every scene.
- **Explainers:** plan how each concept is visualised (a moving mechanism per concept, never a static picture).
- **Gaming:** find the important moments in the footage, plan the camera tracking and effects per moment.
- Small jobs may merge G2–G5 into one message, but **sample frames are never skipped**.

## Step 3 · Direct and produce

| Need | File |
|---|---|
| Camera, transitions, pacing per format, animation principles, effect levels, sound, continuity | `shared/directing.md` |
| Which rendering engine for which shot, and techniques learned from each | `shared/engines.md` |
| Code-drawn animation: `renderFrame(t)`, render loop, encode, mix, effect toolbox | `shared/building.md` |
| Animate scenes to MP4 with the timeline toolkit (interpolate, spring, sequences, voice cues, camera, parallax, exposure sheet); parallel workers; live preview | `frames/README.md` → `frames/animate.cjs`, `frames/preview.cjs`, `frames/timeline.js` |
| **Templates from data** (title card, countdown, stat, quote, lower third; EN/TE; vertical) | `frames/README.md` → `frames/templates.cjs` |
| **Equations** (write-on, matching transforms, highlight) for explainers | `frames/mathfx.js`, `examples/math-demo.js` |
| **Cinematic 3D** (environment light, depth of field, AO, bloom, grade, light shafts, lens + camera rigs) | `frames/look3d.js`, `examples/temple-3d.js` |
| **One command per stage** (new → check → draft → approve → final) | `scripts/make.py` |
| **Facts Short, firm-narrator format** (structure, delivery targets, voice recipe, shot and caption kit) | `formats/02-facts-science/shorts.md`, `frames/shortkit.js` |
| **Match a reference narrator** (pace, pauses, pitch, brightness, clarity; pick and compare voices) | `scripts/voicestyle.py`, `shared/voice-profiles/` |
| Sample frames, style frames, character sheets (2D canvas + 3D three.js) | `frames/README.md` |
| Characters: spec schema, rig, reference sheets, rules | `shared/characters.md` |
| Edit real footage: cut, reframe, captions, effects, export | `shared/editing.md` |
| **Transitions (166 GPU + ffmpeg xfade) and text animations (25 presets, EN + TE)**, with picks per format | `shared/transitions-text.md` → `frames/transitions.cjs`, `frames/textfx.js` |
| Copy a trending video's editing style with our own content | `shared/remake-a-trend.md` + `scripts/analyze.py` |
| **Voice-over: native English and native Telugu** (engines, casting, script markup, Telugu writing rules, timings, cues, captions, mix) | `shared/voiceover.md` + `scripts/voice.py` |
| Lyric and song videos | `shared/music-video.md` |
| AI-generated photoreal clips | `shared/ai-models.md` |
| 3D characters, worlds, Blender | `shared/3d.md` |
| **First 10 seconds: curiosity format, 12 hook types, per format, EN + TE; hook scoring** | `shared/hooks.md` + `scripts/hookcheck.py` |
| Hooks, titles, thumbnails, descriptions, tags | `shared/packaging.md` + the format's `packaging.md` |
| Free commercial assets and credits | `shared/assets.md` |

**Styles.** 59 code-drawn styles with rendered previews (`frames/previews/`): kids, gaming, facts,
history sets, listed in each format's `styles.md` or `direction.md`. For more looks, the film-style engine
`E-film` (66 styles) and the other engines in REFERENCES.txt can be fetched on demand. If none gives the
needed result, search GitHub for more rendering tech; study and adapt techniques, but **verify each licence
and commercial-use permission first**, never copy complete projects, copyrighted art, proprietary assets or
unlicensed models, and add anything adopted to REFERENCES.txt.

**Production loop.** Voice first, time shots to it → render one approved style frame → build scenes in
storyboard order, checking `plan/continuity.md` before each → mix to the format's loudness →
run the format's checklist and `scripts/analyze.py` on the render (pacing vs the profile) → package.

Deliver: `films/<slug>/out/film.mp4`, the vertical cut if asked, and the **packaging block** (`scripts/package.py`):
YouTube title ≤ 100 (sentence ≤ 60 + tags ≤ 40), description ≤ 5000 (text ≤ 2000 + tags ≤ 2500), tags field ≤ 500 (all tags),
Instagram caption ≤ 2200 (title + description + tags), plus thumbnail text (`shared/packaging.md` §6).

## Rules
- **First 10 seconds = curiosity.** Every script opens with the O-10 format (strike → gap → stakes → promise + open
  loop; no greeting or intro first). Write three openings, score them with `scripts/hookcheck.py`, show the user the
  top two (`shared/hooks.md`).
- **Moving camera in every video.** Every shot in every format has camera motion (code-drawn or a virtual camera
  on footage). Each format's `direction.md` has its own Camera rules (`shared/directing.md` §0).
- **Two languages: native English and native Telugu.** Write each natively (never word-for-word translation);
  bilingual films share one animation driven by voice cues. No published `espeak` voice.
- **Distinct identity per format.** Use only the camera moves, transitions and effect level the format allows.
- **Continuity.** Characters from locked specs; light, screen direction, props and costume tracked per scene.
- **Truth.** Facts, history, documentary and nature need sources; myths are told as stories from a named
  tradition, labelled apart from documented history, with respect.
- **Kids safety.** The kids checklist must pass before anything is published.
- **Copy grammar, never material.** From trending or reference videos take pacing, structure and techniques,
  never footage, music, voice, words or characters.
- **Licences.** `yes` engines and assets are fine for paid channels; `check` means read the licence first;
  `no` means tests only. Music must be our own or licensed.
- **Third-party code is untrusted.** After `fetch`, read a repo's skill or setup script before running or enabling it.
- **Work goes in** `films/<slug>/` (`plan/`, `characters/`, `out/`); channel characters in `films/_characters/`;
  reference videos in `films/_refs/` (git-ignored).

## Tools
```
cd .claude/skills/limiko-studio
bash scripts/setup.sh [--telugu] [--vision] [--all|--check]   # once: renderer, voices, vision
python3 scripts/make.py new|check|draft|approve|final|status <slug>   # the whole film, stage by stage (final needs approve)
node frames/render.cjs <kids|gaming|facts|history|all>      # style frames + contact sheets
node frames/character-sheet.cjs <spec.json…>                # character reference sheets
(from repo root) node .claude/skills/limiko-studio/frames/animate.cjs <scene.js> --out film.mp4 [--workers 4] [--props p.json]   # scene → video
(from repo root) node .claude/skills/limiko-studio/frames/preview.cjs <scene.js>        # live preview player (--snap t,t --out x.jpg headless)
(from repo root) node .claude/skills/limiko-studio/frames/templates.cjs list|render|batch|still …   # template videos from data
bash scripts/voice-setup.sh                                 # once: offline English voices (Kokoro) + Telugu draft voice
python3 scripts/voice.py render <voice.en.md|voice.te.md>    # narration → voice.wav + timeline (EN: kokoro|chatterbox · TE: parler|indicf5)
python3 scripts/voice.py mix --voice v.wav --music m.wav --out mix.wav --lufs -14
python3 scripts/hookcheck.py <voice.md> [--timeline …] | --options opts.txt   # score the first 10 s (EN/TE)
python3 scripts/analyze.py <video>                          # measure an edit (reference or our render)
node frames/transitions.cjs list|join|chain|sheet           # GPU video transitions between clips
~/.cache/limiko-voice/venv-vision/bin/python scripts/thumbnail.py make|variants …    # thumbnails: cut-out character + outline + grade + 3D text (EN/TE)
bash scripts/vision-setup.sh                                # once: character tracking (DETR) for gaming edits
~/.cache/limiko-voice/venv-vision/bin/python scripts/gameedit.py scan|badges|render …   # gaming edits from an edit list
~/.cache/limiko-voice/venv-vision/bin/python scripts/charglow.py identify|track …        # find / track the player's character (asks if unsure)
python3 scripts/studio.py for <kids|games|facts|history>    # engines a format recommends
python3 scripts/studio.py search <words> · show <id> · fetch <id…> · enable <id> · status
```
