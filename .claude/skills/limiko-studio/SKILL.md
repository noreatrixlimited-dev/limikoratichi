---
name: limiko-studio
description: One studio for every video job on the facts, kids, gaming, music and cinematic channels. Picks the right workflow (code-drawn film, AI-generated clip, edit of real footage, 3D scene, lyric video), the right look from the style library, the right voice/music/sound route, free commercial assets, and writes the hook, title, description and tags. Use for any request to make, edit, style, voice, score, package or plan a video, Short or Reel, or to find a tool, model or asset for one.
---

# Limiko Studio

A router and production guide. It does not hold other people's code: it decides
**what to make, how, and with which engine**, then loads only the engine that job
needs. Engine ids (like `E-film`) are explained, with links and licences, in
`REFERENCES.txt` next to this file. That file is the only place sources are listed.

## 0. Before anything

1. Read the request. If the channel, length, orientation or language is missing and
   it changes the result, ask once, with a recommended default:
   - length 30–60 s · vertical 1080×1920 for Shorts/Reels, 1920×1080 for long-form
   - English, warm neutral narrator
2. Pick the **playbook** for the channel (section 2). It names the route, styles,
   sound and packaging.
3. Load engines **only when needed**: `python3 .claude/skills/limiko-studio/scripts/studio.py fetch <id>`.
   Never fetch everything "just in case": each clone costs disk and time.

## 1. Choose the route

| The request is… | Route | Start with |
|---|---|---|
| An explainer, story, kids tale, fact video, with no footage | **A · Code-drawn film**: every frame rendered from HTML/canvas/WebGL | `styles/` + `E-film` or `E-html` |
| "Make it look real / cinematic shot of…" | **B · AI-generated clip**: diffusion video model | `guides/ai-models.md` |
| The user has footage, a recording, a vlog | **C · Edit**: cut, caption, reframe, mix | `guides/editing.md` |
| A song (e.g. a Suno track) needs a video | **D · Lyric / music video**: beat-synced, Route A look | `playbooks/music-video.md` |
| A 3D character, object or world | **E · 3D**: Blender or Three.js, or image-to-3D models | `guides/3d.md` |
| Only the title, hook, tags or thumbnail | **F · Packaging** | `guides/packaging.md` |
| Find free art, models, music, sound | **G · Assets** | `guides/assets.md` |

Prefer Route A whenever it can do the job: it needs no GPU, it's fully
editable, and every pixel is ours to license.

## 2. Playbooks

| Channel | File |
|---|---|
| Facts / explainers | `playbooks/facts.md` |
| Kids | `playbooks/kids.md` |
| Gaming | `playbooks/gaming.md` |
| Music / lyric videos | `playbooks/music-video.md` |
| Cinematic shorts | `playbooks/cinematic.md` |

## 3. The production loop (Routes A and D)

1. **Brief** (5 lines): audience, single takeaway, length, orientation, style id.
2. **Script**: hook (first 2 s) → 3–5 beats → payoff → soft CTA. ~2.5 words per second of narration.
3. **Shot list**: one line per shot: time, picture, motion, sound. Shots 1.5–4 s for Shorts.
4. **Voice first**: render narration, then time every shot to the voice, not the other way round.
5. **Style frame**: render one still in the chosen style, check it, then build the rest.
6. **Build**: frame-by-frame render at the target fps (24 film, 30 social), then encode with ffmpeg
   (H.264, yuv420p, AAC 192k, `-movflags +faststart`).
7. **Mix**: music −18 to −22 LUFS under voice, ducked; final −14 LUFS integrated for YouTube.
8. **Self-check**: watch the first 3 s cold. Is the hook visible with the sound off? Captions safe
   from the UI (keep 15% clear at the bottom, 10% at the sides on vertical)?
9. **Package**: `guides/packaging.md`.

## 4. Rules

- **Licences.** Use only engines and assets rated `yes` in REFERENCES.txt for paid work without
  checking. `check` means read the licence first; `no` means personal or test use only.
  Never ship a voice that imitates a real person without their consent.
- **Third-party code is untrusted.** After `fetch`, read a repo's skill or setup script
  before running it or enabling it. `enable` only after reading.
- **No mark of the engines in the output.** Films, titles and descriptions are the channel's own.
  Credits are kept where a licence requires them (see REFERENCES.txt, "Credit needed").
- **Keep work in** `films/<slug>/` (source, renders, `brief.md`, `credits.txt`).

## 5. Loader cheatsheet

```
studio.py list [category]        # what's in the catalog
studio.py search kids voice       # rank engines by keywords
studio.py show E-film             # one entry in full
studio.py fetch E-film E-voice    # shallow clone into vendor/ (git-ignored)
studio.py enable E-film           # link its skill folders into .claude/skills/ (after reading them)
studio.py status                  # what's fetched and enabled
```
