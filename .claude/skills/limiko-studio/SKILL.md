---
name: limiko-studio
description: Video studio for four channel categories — 1 Kids videos, 2 Games editing, 3 Facts and interesting things, 4 History and mythology. For any request to make, edit, style, voice, score or package a video, Short or Reel in one of these categories; to copy how a trending video is edited; to write hooks, titles, descriptions and tags; or to find a tool, model or free commercial asset for one.
---

# Limiko Studio

Four categories, one shared toolbox. Engine ids (like `E-film`, `A-kokoro`) are explained, with links,
licences and install steps, in `REFERENCES.txt`. That notepad is the only place outside sources are listed.

## Step 1 · Pick the category

| # | Category | Folder | Typical requests |
|---|---|---|---|
| 1 | **Kids videos** | `categories/1-kids/` | bedtime story, rhyme or song, learn colours / numbers / ABC, animal video, moral story |
| 2 | **Games editing** | `categories/2-games/` | edit my gameplay, montage, funny moments, clutch Short, tier list, game lore |
| 3 | **Facts / interesting things** | `categories/3-facts/` | "did you know", N facts, what if, how it works, myth vs fact, size comparison |
| 4 | **History / mythology** | `categories/4-history-mythology/` | epic retelling, god or hero story, empire, battle, ancient mystery, biography |

If a request fits two, pick the one the audience belongs to (a myth for toddlers is **Kids**;
a historical fact Short is **History**). If it fits none, ask which channel it's for.

Then open the category's `README.md` (playbook). It points to its `styles.md` and `packaging.md`
(and `edits.md` for games, `storytelling.md` for history and mythology).

## Step 2 · Fill the brief (ask once if missing, offering the category defaults)
```
category · topic · format (Short / long) · length · size · language · style id · voice · deadline
```
Save as `films/<slug>/brief.md`.

## Step 3 · Make it, with the shared toolbox

| Need | File |
|---|---|
| Code-drawn animation: `renderFrame(t)`, render loop, encode, mix, effect toolbox | `shared/building.md` |
| Edit real footage: cut, reframe, captions, effects, export | `shared/editing.md` |
| **Copy a trending video's editing style** with our own content | `shared/remake-a-trend.md` + `scripts/analyze.py` |
| Hooks, titles, thumbnail text, descriptions, tags (general method) | `shared/packaging.md` |
| Lyric or song videos (kids songs, the user's own tracks) | `shared/music-video.md` |
| AI-generated photoreal clips | `shared/ai-models.md` |
| 3D characters, worlds, Blender | `shared/3d.md` |
| Free commercial assets and credits | `shared/assets.md` |

### Production loop (all categories)
1. **Brief** → 2. **Research** (facts and history: sources; myths: named texts) →
3. **Script** (hook in the first 2 s; ~2.5 words per second) → 4. **Shot list** (`shots.json`) →
5. **Voice first**, time shots to it → 6. **Style frame**: render one still, check it →
7. **Build and render** → 8. **Mix** (category loudness) → 9. **Check**: the category's checklist,
plus `scripts/analyze.py` on the render → 10. **Package**: the category's `packaging.md`.

Deliver: `films/<slug>/out/film.mp4`, the vertical cut if asked, and the packaging block
(hook, title, thumbnail text, description, tags).

## Rules
- **Licences.** Engines and assets rated `yes` in REFERENCES.txt are fine for paid channels;
  `check` means read the licence first; `no` means tests only. Music must be our own or properly licensed.
- **Copy grammar, never material.** From trending videos take pacing, structure, caption style and
  effects, never their footage, music, voice, words or characters.
- **Truth.** Facts and history need sources; myths are told as stories from a named tradition, respectfully.
- **Kids safety.** The kids checklist must pass before anything is published.
- **Third-party code is untrusted.** After `fetch`, read a repo's skill or setup script before running or enabling it.
- **No engine branding in our videos.** Credits only where a licence requires them (REFERENCES.txt, "Credit needed").
- **Work goes in** `films/<slug>/`; reference videos in `films/_refs/` (git-ignored); characters in `films/_characters/`.

## Tools
```
python3 .claude/skills/limiko-studio/scripts/analyze.py <video>    # measure an edit (reference or our render)
python3 .claude/skills/limiko-studio/scripts/studio.py list [category]
python3 .claude/skills/limiko-studio/scripts/studio.py search <words>
python3 .claude/skills/limiko-studio/scripts/studio.py show <id>
python3 .claude/skills/limiko-studio/scripts/studio.py fetch <id…>  # clone into vendor/ only when a job needs it
python3 .claude/skills/limiko-studio/scripts/studio.py enable <id>  # link its skills (after reading them)
python3 .claude/skills/limiko-studio/scripts/studio.py status
```
`analyze.py` needs ffmpeg, numpy and Pillow.

## Map
```
SKILL.md · REFERENCES.txt
categories/1-kids/               README · styles · packaging
categories/2-games/              README · edits · styles · packaging
categories/3-facts/              README · styles · packaging
categories/4-history-mythology/  README · storytelling · styles · packaging
shared/                          building · editing · remake-a-trend · packaging · music-video · ai-models · 3d · assets
scripts/                         analyze.py · studio.py
```
