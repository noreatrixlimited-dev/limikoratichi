# 05 · Horror and mystery: direction profile

**Identity:** dark cinematic light, controlled camera, tension that builds gradually. Details are
revealed progressively. Suspense, not constant jump scares.

> **Moving-camera rule:** the camera moves in every shot (see `../../shared/directing.md` §0).

## Numbers
| | |
|---|---|
| Median shot | 5 s (2–12 s); long holds build dread; 0.3–0.8 s shots only at spikes |
| Camera | very slow creep-in (100→108% over 6–10 s), slow pans that stop just before the reveal, subtle handheld, one dolly zoom per film max |
| Animation | minimal and deliberate: a door moves 2 cm, a shadow passes, eyes open |
| Effects max | level 2 normally; level 3 at the climax (fog, flicker, subtle glitch ≤ 6 frames, film grain, vignette) |
| Transitions | straight cut, dip to black, slow dissolve, L-cut (sound arrives first). Glitch only as a story beat |
| Light | low key, one motivated source (torch, window, screen), large shadow areas, cold blue-green or sodium orange |
| Sound | room tone, low drones, distant noises, silence before reveals; −16 LUFS, wide dynamics |

## Tension curve
Quiet normal → small wrong detail → investigation (longer shots) → false calm → reveal (one scare
at most per act) → aftermath. Plot it in G4 with tension 1–5 per beat; at most 2 peaks per 5 minutes.

## Progressive reveal techniques
Show the edge of a thing before the thing · let sound tell first · hold on an empty frame after
movement · rack focus from foreground to the background detail · reveal in the reflection or the shadow.

## Styles
| id | Look | For |
|---|---|---|
| `liminal-tape` | VHS found footage, empty halls, timestamp | creepy lore, ARGs |
| `noir-evidence` | high-contrast black and white, rain, venetian-blind shadows, case files | true mystery, unsolved cases |
| `fog-forest` | layered silhouettes of trees in fog, moonlight, slow drift | folklore horror, legends |
| `candle-room` | single warm flame, deep black, faces half lit | ghost stories, old houses |
| `analog-glitch` | CRT, signal loss, corrupted frames as story beats | digital mysteries, haunted media |
| `halftone-file` | retro case-file dots and stamps | "strange but true" |

## Special planning (G4)
Beat sheet with tension 1–5, the **clue order** (what the viewer learns when), and the sound plan
for each reveal (what's heard before what's seen).

## Packaging
Hooks: the unexplained detail ("This photo has one thing wrong"), the timestamp ("At 3:12 AM the camera recorded…"),
the rule ("Never answer the door after midnight in <place>"). Titles: `The <Place> Mystery Nobody Solved`,
`What Happened at <Place>?`. Thumbnail: dark frame, one lit detail, 1–3 words. Real cases: facts sourced,
victims treated with respect, no gore.

## Checklist
- [ ] Tension builds; ≤ 2 scares per 5 minutes; each scare earned
- [ ] Every reveal prepared by sound or a partial view first
- [ ] Real cases: sources listed, speculation labelled, respectful
- [ ] Not too dark to read on a phone (check lifted shadows at 10–15% brightness)

## Horror narration and sound (`scripts/horrormix.py`)
- **Voice:** Telugu `parler` Prakash with `style: "low, slow, suspenseful and mysterious"`, `speed: 0.9`, `gap: 0.55`,
  and `{pause 1.2}` before each section. Use a calm, sincere cast for closing messages and helplines (`style: "calm, warm and sincere"`).
  English: `chatterbox` with `emotion: 0.4`, `cfg: 0.35` (slow, low).
- **Cues in the script** decide where the effects go: `{cue sNN}` section swell · `{cue hitN}` low impact on a reveal ·
  `{cue beatN}` … `{cue beatendN}` heartbeat under the tension · `{cue creakN}` door creak · `{cue calmN}` all effects fade out.
- **Mix:** `python3 scripts/horrormix.py out/voice-te --out out/film.horror.m4a --lufs -16 [--level 0.8]`. It synthesises
  everything (drone, wind, swells, hits, heartbeat, creak, so there are no licence issues), adds a light room echo to the
  voice, ducks the bed under speech, and normalises the loudness.
- **Real tragedies:** keep `--level` at 0.7–1.0, never mock the victims, label rumours as rumours, and end calm with help
  information where relevant. Make a **normal version** too (`style: "calm, clear and serious"`, no effects) for
  viewers and platforms that prefer documentary tone. Example: `films/kundanbagh-house/`.
