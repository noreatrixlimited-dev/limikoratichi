# Limiko Studio: the whole picture

This is the map of every job the studio does. Find the job in the index and open its card. Each card lists
what to read, what to run, where to stop and ask the user, what to deliver, and the job's known limits.
`SKILL.md` is the router and rulebook. This file shows how the parts connect.

All paths are relative to `.claude/skills/limiko-studio/` unless they start from the repo root.

## 1 · One picture

```
                         ┌────────────────────── REQUEST ──────────────────────┐
                         │ new video · edit my footage · thumbnail · voice ·   │
                         │ copy a trend · characters · find tools/assets       │
                         └───────────────┬─────────────────────────────────────┘
                                         ▼
  PLAN       G1 topic → G2 format + look → G3 characters → G4 concept / moments → G5 storyboard + hook → G6 sample frames
             (formats/NN-*/direction.md)   (character-sheet)  (charglow identify)  (hookcheck)            (render.cjs)
                                         │
                                ◆ USER APPROVES ◆   ← never skipped
                                         ▼
  PRODUCE    ┌─ voice ──────────┐   ┌─ picture ────────────────┐   ┌─ footage (gaming) ─────────┐
             │ voice.py render  │──►│ animate.cjs + timeline.js│   │ gameedit.py scan → badges  │
             │ words, cues,     │cue│ character.js, textfx.js  │   │ charglow.py track (SAM 2)  │
             │ captions         │   │ three.js 3D              │   │ gameedit.py render         │
             └──────────────────┘   └────────────┬─────────────┘   └──────────────┬─────────────┘
                                                 └──── transitions.cjs ───────────┘
                                                                 ▼
  FINISH     voice.py mix (loudness) → analyze.py (pacing vs the format) → format checklist
                                                                 ▼
  PACKAGE    title · thumbnail (thumbnail.py) · description · tags   (shared/packaging.md + format packaging.md)
                                                                 ▼
  DELIVER    films/<slug>/out/film.mp4  (+ vertical cut)  + packaging block
```

## 2 · Use-case index

| # | The user wants… | Card | Main tool |
|---|---|---|---|
| A | a new video in any of the 10 formats | [A](#a--plan-a-new-video) | gates G1–G6 |
| B | a kids video | [B](#b--kids-01) | `animate.cjs`, character rig |
| C | a facts / science / education video | [C](#c--facts-and-science-02) | `animate.cjs`, 3D, morph/tracker |
| D | history or mythology | [D](#d--history-and-mythology-03) | `animate.cjs`, locked characters |
| E | their gameplay edited | [E](#e--gaming-edit-04) | `gameedit.py`, `charglow.py` |
| F | horror, documentary, anime, nature, music, business | [F](#f--formats-0510) | `direction.md` + engines |
| G | the first 10 seconds / a hook / a script | [G](#g--script-and-hook) | `hookcheck.py` |
| H | a voice-over (English or Telugu) | [H](#h--voice-over-en--te) | `voice.py` |
| I | a character designed and kept consistent | [I](#i--characters) | `character-sheet.cjs` |
| J | style frames / a look test | [J](#j--style-frames) | `render.cjs` |
| K | transitions or animated text | [K](#k--transitions-and-text) | `transitions.cjs`, `textfx.js` |
| L | a thumbnail | [L](#l--thumbnail) | `thumbnail.py` |
| M | title, description, tags | [M](#m--title-description-tags) | `packaging.md` |
| N | "edit it like this trending video" | [N](#n--copy-a-trend) | `analyze.py` |
| O | 3D, Blender, AI clips, outside engines | [O](#o--3d-outside-engines-ai-clips) | `studio.py` |
| P | free assets, music, licences | [P](#p--assets-and-licences) | `REFERENCES.txt` |
| Q | a fresh session set up | [Q](#q--setup-in-a-fresh-session) | setup scripts |

---

## A · Plan a new video
- **Read:** `SKILL.md` (choose the format by what the viewer came for), `shared/preproduction.md`, then the format's `direction.md`.
- **Do:** G1 topic analysis → G2 format and look → G3 characters → G4 concept (explainers) or moment plan (gaming) → G5 storyboard with three scored openings → G6 sample frames.
- **Ask the user:** after G6, show the direction, storyboard, character sheets, sample frames and the top two hooks. Ask them to approve or say what to change.
- **Output:** `films/<slug>/plan/` (brief, storyboard, continuity), `films/<slug>/characters/`.
- **Always:** use a moving camera in every shot (`shared/directing.md` §0) and only the transitions and effect level the format allows.

## B · Kids (01)
- **Read:** `formats/01-kids/` (direction, README, styles, packaging).
- **Run:** voice, then `frames/animate.cjs` scene, with `character.js` rig and parallax. Example: `frames/examples/pip-meadow.js`, `rain.js`.
- **Rules:** slow and gentle pacing. No fear or warnings in the hook, and the greeting comes after the first line. The kids checklist must pass before publishing.

## C · Facts and science (02)
- **Read:** `formats/02-facts-science/`. Every concept needs a moving mechanism (morph, tracker, cutaway) and never a static picture.
- **Run:** use `animate.cjs` with `timeline.js` (`tracker`, `morph`, `script().until(cue)`), plus three.js for cutaways (style `cutaway-3d`).
- **Rules:** every claim needs a source in `plan/sources.md`, and the hook's claims too.

## D · History and mythology (03)
- **Read:** `formats/03-history-mythology/`, including `storytelling.md`.
- **Run:** lock the characters (card I), then animate. Example characters: `characters/examples/krishna.json`, `warrior-king.json`.
- **Rules:** label legend apart from documented history. Tell myths from a named tradition, with respect, and never invent "secrets" about faith.

## E · Gaming edit (04)
- **Read:** `formats/04-gaming/edits.md` (the user's rules) and `direction.md`.
- **Run** (in `~/.cache/limiko-voice/venv-vision`):
  1. `gameedit.py scan <video> --b END` finds loud peaks and gives a 1 fps grid. Then `gameedit.py badges <video> --t …` reads the kill banners.
  2. `charglow.py identify <video> --a A --b B --out DIR` finds the player's character. **Exit 3 = not sure: show `identify.jpg`, ask which number is theirs**, then re-run with `--pick N`.
  3. Write `edit.json` (highlights, punches, outline style, grade, `full_highlights`).
  4. `gameedit.py render edit.json --preview`, then the final render. SAM 2 tracking runs per highlight. **Exit 4 = uncertain outline: show the check sheet and ask.**
  5. Use `transitions.cjs chain` to join highlights with GL transitions when wanted.
- **User's rules:** full-highlight videos have no hook. Zoom in and back out around every kill. Add a transition after every highlight. The player's character gets a glow (sticker by default, or neon or aura; optional `"grade": "leak"`). Use game audio plus generated effects, and add no text unless asked.
- **Limits:** CPU tracking takes about 15 minutes per 30 s highlight. GL transitions aren't automatic inside `gameedit` yet.
- **Privacy:** never commit the user's footage or frames of it. The repo is public.

## F · Formats 05–10
- **Read:** `formats/NN-*/direction.md` for horror (05), documentary (06), anime (07), nature (08), music and lyric (09, plus `shared/music-video.md`) and business and tech (10, plus 3D product).
- **Run:** the same pipeline as A. Pick the engine in `shared/engines.md`.
- **Limit:** these formats have no rendered style frames yet. Render samples in G6 before any production.

## G · Script and hook
- **Read:** `shared/hooks.md` (O-10: strike 0–1.5 s → gap → stakes → promise and open loop, plus 12 hook types, per-format and Telugu notes).
- **Run:** `python3 scripts/hookcheck.py --options opts.txt [--lang te] [--format kids]` ranks three openings. After rendering the voice, run `hookcheck.py script.md --timeline out/timeline.json`.
- **Ask the user:** show the top two hooks with their scores and types, and let the user pick.
- **Rules:** never open with a greeting, "in this video" or a subscribe request. Mark the beats with comment lines (`# @strike` …), with `#` only at the start of a line.
- **Example:** `voice-examples/volcano.en.md` scores 96 (STRONG). The `rain.*.md` examples predate O-10 and need a rewrite before reuse.

## H · Voice-over (EN / TE)
- **Read:** `shared/voiceover.md`. Write each language natively and never translate word for word.
- **Engines:**

  | Language | Engine | Voices | Where |
  |---|---|---|---|
  | English | `kokoro` (offline, Apache-2.0) | af_heart, am_puck, bm_george… | `venv` |
  | Telugu | `parler` (Indic Parler-TTS) | Lalitha, Prakash | `venv-te` |
  | Telugu, a cloned voice | `indicf5` (reference clip we have rights to) | — | `venv-f5` (not yet tested end to end) |
  | Either | `recorded` (a human artist) | — | — |
  | Drafts only | `espeak` | — | **never published** |
- **Run:** `python3 scripts/voice.py check <script.md>`, then `voice.py render <script.md> --out DIR` writes `voice.wav`, `timeline.json` (words, cues, captions) and `captions.srt`. Then `voice.py mix --voice … [--music …] --out … --lufs -14|-16`.
- **Check Telugu:** transcribe it with the wav2vec2 Telugu ASR (about 45% WER, so judge the meaning, not the spelling).
- **Limits:** Parler renders at about 8–10× real time on CPU (20 s of audio takes about 6 min). It sometimes stops early, so the tool retries.

## I · Characters
- **Read:** `shared/characters.md` (spec schema, including `voices: {en, te}`).
- **Run:** from `frames/`, `node character-sheet.cjs <spec.json>` draws 4 views, 6 expressions and 5 poses.
- **Ask the user:** they approve the sheet, and then the spec version is locked. Every scene uses the same spec, and continuity is tracked in `plan/continuity.md`.

## J · Style frames
- **Run:** from `frames/`, `node render.cjs <kids|gaming|facts|history|all> [names…]` renders 2D and three.js 3D frames with contact sheets. There are 59 styles. Previews are in `frames/previews/*.jpg`.

## K · Transitions and text
- **Read:** `shared/transitions-text.md` (the picks per format).
- **Run:** `node frames/transitions.cjs list|sheet|join|chain` (166 GL transitions, MIT/BSD, vendored). Simple ones use ffmpeg `xfade`. For text, `frames/textfx.js` has 25 presets, is Telugu-safe and splits by grapheme. Demo: `examples/textfx-demo.js`.

## L · Thumbnail
- **Read:** `shared/packaging.md` and the format's `packaging.md`. Use 0–4 words of text.
- **Run** (venv-vision): `thumbnail.py make --video raw.mp4 --t SEC --title "LINE1|LINE2" [--tag …] [--lang te] [--style sticker] [--grade leak]`. Use `variants --titles "A|B;C|D"` for A/B tests.

## M · Title, description, tags
- **Read:** `shared/packaging.md` and the format's `packaging.md`. Deliver one packaging block: hook, title, thumbnail text, description and tags, in EN or TE as asked.

## N · Copy a trend
- **Read:** `shared/remake-a-trend.md`.
- **Run:** `python3 scripts/analyze.py <reference video>` writes `analysis.json`, `shots.jpg`, `hook.jpg` and `recipe.md` (cuts, pacing, hook, motion, captions, loudness, beat, colour).
- **Rule:** copy the editing grammar, never the material (footage, music, voice, words, characters). Reference videos live in `films/_refs/`, which is git-ignored.

## O · 3D, outside engines, AI clips
- **Read:** `shared/engines.md` (which engine for which shot), `shared/3d.md` and `shared/ai-models.md`.
- **Run:** `python3 scripts/studio.py for <kids|games|facts|history>`, `search`, `show <id>`, `fetch <id>`, then **read its code before running it** and `enable <id>`.

## P · Assets and licences
- **Read:** `shared/assets.md`. `REFERENCES.txt` is the only place outside sources are named, each with its licence and commercial-use status.
- **Rules:** `yes` means fine on a paid channel, `check` means read the licence first, and `no` means tests only. Music must be our own or licensed. Record anything adopted in REFERENCES.txt, and use no copied text or branding.

## Q · Setup in a fresh session
```bash
cd .claude/skills/limiko-studio && bash scripts/voice-setup.sh && bash scripts/voice-setup.sh --telugu
```
```bash
cd .claude/skills/limiko-studio/frames && npm install
```
```bash
cd .claude/skills/limiko-studio && bash scripts/vision-setup.sh
```
These are large downloads, so run them in the background. If Telugu fails, check Hugging Face access (`CLAUDE.md`).

| Environment | Holds | Used by |
|---|---|---|
| `~/.cache/limiko-voice/venv` | Kokoro ONNX | `voice.py` (EN) |
| `…/venv-te` | torch, transformers 4.46, Parler | `voice.py` (TE) |
| `…/venv-f5` | transformers 5.x, IndicF5 | `voice.py` engine `indicf5` |
| `…/venv-vision` | shares torch with venv-te; transformers 4.57, DETR, SAM 2.1 | `charglow.py`, `gameedit.py`, `thumbnail.py` |
| `frames/node_modules` | Playwright, three.js | every `frames/*.cjs` |

---

## 3 · Rules that apply to every job
1. Make the **pre-production gates and approval** before any full video, and never skip the sample frames.
2. Spend **the first 10 seconds** on curiosity (O-10), except in full-highlight gaming videos.
3. Give **every shot a moving camera**, in every format.
4. Use **two languages only**, native English and native Telugu, and never publish espeak.
5. Give **each format its own identity**, with no borrowed pacing, transitions or effects.
6. **Truth:** facts need sources, and myths are labelled as stories.
7. **Kids safety:** the checklist passes before publishing.
8. **Copy grammar, never material.** Write everything fresh. Sources go only in `REFERENCES.txt`.
9. **Licences:** check them before using any code, model or asset (this is a commercial channel).
10. **Ask when unsure.** That covers which character is the player's, uncertain outlines and picking the hook.
11. **Privacy:** the repo is public, so no user footage, frames of it or personal data go into it.

## 4 · State and open items (2026-11-03)
| Done and tested | Open |
|---|---|
| director system and 10 format profiles | style frames for formats 05–10 |
| 59 style frames (2D and 3D), character rig and sheets | rewrite the rain examples to O-10 |
| timeline toolkit, `animate.cjs` | automatic GL transitions inside `gameedit` |
| English voice (Kokoro), native Telugu voice (Parler) | IndicF5 end-to-end test |
| gaming edit, SAM 2 outline, thumbnails | faster tracking (GPU) |
| 166 transitions, 25 text presets, hook scoring | |
