# Directing: camera, transitions, pacing, animation, effects

Every choice must serve the story. Pick from these vocabularies in G2 and use only what you picked.

## 0. The moving-camera rule (every video, every format)
The camera moves in **every shot**. A fully static frame is never delivered.
- **Code-drawn scenes:** animate the camera with `T.camera()` / `T.parallax()` (drift, push, pan, tilt, orbit).
- **Real footage, gameplay, screen recordings, still images:** add a virtual camera in the edit: slow drift
  plus a breathing zoom at minimum, and push-ins towards whatever matters.
- **How much:** each format sets its own speed and size (`formats/NN/direction.md`, "Camera rules"). Kids and
  nature move slowly; gaming and anime move most; history is slow and grand; facts move towards the explanation.
- **Motivated:** every move goes towards, away from or along the subject. Never move just to move.
- **Check:** `scripts/analyze.py` on the render; its motion level must not be "low" for gaming, and
  a quick look at frames 1 s apart must show the frame changing in every shot.

## 1. Pacing by format (defaults; the format profile can override)

| Format | Median shot | Range | Cuts/min | Camera speed | Transition intensity |
|---|---|---|---|---|---|
| 01 Kids | 4.0 s | 3–6 s | 10–15 | very slow | gentle |
| 02 Facts / science | 2.5 s | 1.5–5 s | 20–30 | medium | engaging |
| 03 History / mythology | 4.0 s | 2.5–8 s | 10–18 | slow, sweeping | cinematic |
| 04 Gaming: explore | 2.0 s | 1–4 s | 25–35 | smooth | low |
| 04 Gaming: combat | 0.8 s | 0.3–1.5 s | 60–100 | fast, tracking | high (controlled) |
| 05 Horror / mystery | 5.0 s | 2–12 s | 8–14, spikes | very slow creep | rare, timed |
| 06 Documentary | 4.5 s | 3–9 s | 10–16 | measured | natural |
| 07 Anime / cartoon | 2.0 s | 0.5–5 s | 25–45 | matches emotion | expressive |
| 08 Nature / wildlife | 6.0 s | 4–12 s | 6–12 | slow, floating | gentle |
| 09 Music / lyric | on beat | 1–4 bars | per bpm | rhythmic | beat-matched |
| 10 Business / tech | 2.5 s | 1.5–4 s | 20–28 | smooth, precise | clean |

Rhythm is a curve, not a number. Typical shape: fast hook (2–3 short shots) → settle → build
(shots shorten) → payoff (one held shot) → resolve.

## 2. Camera vocabulary (code-drawn scenes animate the camera too)

| Move | Feels | Use for | Settings |
|---|---|---|---|
| Static lock-off | calm, observational | dialogue, kids learning, horror dread | slight drift 0.5%/s keeps it alive |
| Slow push-in | focus, importance, tension | reveals, emotion, "listen to this" | 100→110% over 3–5 s, ease-in-out |
| Pull-out | context, scale, loneliness | endings, scale facts | 115→100% |
| Pan | follow, survey | landscapes, kingdoms, timelines | ≤ 15% of frame width per second |
| Tilt up | awe, power | temples, gods, mountains | slow, ease-out |
| Tracking | involvement | walking characters, gameplay hero | keep subject on a third line |
| Orbit | dimensionality | 3D products, models, heroes | 10–30° over the shot |
| Parallax layers | depth in 2D | storybook, history, kids | foreground 1.6×, mid 1×, back 0.4× |
| Crash / smash zoom | shock, impact | gaming, anime, comedy | 100→140% in 3–4 frames |
| Handheld | presence, unease | horror, found footage, documentary | 1–3 px noise, low frequency |
| Dolly zoom | vertigo, realisation | horror, big twists | once per film at most |
| Aerial / top-down | geography, scale | nature, history maps, documentary | slow, constant speed |

Rules: one move per shot · motivated (it follows action or reveals information) · ease every start and stop ·
never move the camera and cut on the same frame unless it's a deliberate whip.

## 3. Transition vocabulary

| Transition | Meaning | Formats |
|---|---|---|
| Straight cut | continuity, the default | all |
| Match cut (shape / motion / colour) | connection between two ideas | 02, 03, 06, 07, 10 |
| Cross-dissolve (12–24 frames) | time passes, gentle | 01, 03, 06, 08 |
| Dip to black | chapter end, death, night | 03, 05, 06 |
| Page turn / paper slide | storybook | 01, 03 |
| Ink / paint bleed | myth, art styles | 03, 07 |
| Map / timeline transition | travel in space or time | 03, 06 |
| Whip pan | energy, "meanwhile" | 04, 07, 10 |
| Zoom-through | into detail / inside an object | 02, 10 |
| Flash (2–3 frames) | impact on a beat | 04, 07, 09 |
| Glitch (≤ 6 frames) | tech, unease | 05 (rare), 04, 10 |
| L-cut / J-cut (sound leads or trails) | smooth storytelling | 03, 05, 06, 08 |

Use 2–4 transition types per film. Repetition of a few reads as style; ten different ones read as random.

## 4. Animation principles (code-drawn)
- **Timing:** hand-made looks on twos (change every 2nd frame at 24 fps); UI, 3D and type on ones.
- **Ease:** arrivals ease-out, exits ease-in, pops overshoot (back-out, 10–20%).
- **Anticipation:** a small opposite move (3–6 frames) before a big action.
- **Follow-through:** ears, tails, hair, capes settle 6–12 frames after the body stops.
- **Holds:** every key pose holds ≥ 8 frames (kids: ≥ 16) so it reads.
- **Secondary motion:** backgrounds breathe: clouds drift, leaves sway, dust floats. Never fully static.
- **Squash and stretch:** kids and cartoon 10–25%; history 0–5%; documentary none.
- **Arcs:** limbs and thrown objects move on arcs, not straight lines.
- **Staging:** one centre of attention per moment; dim, blur or simplify everything else.

## 5. Effects intensity scale
Each format profile sets a maximum level. Never exceed it.

| Level | Allowed |
|---|---|
| 1 | soft glow, gentle particles, light leaks |
| 2 | + animated labels, highlights, subtle shake (≤ 3 px) |
| 3 | + zoom punch-ins, motion trails, speed ramps, depth blur |
| 4 | + impact frames, flashes, strong shake, chromatic split, glowing outlines |
| 5 | + everything, on the beat; only for peak gaming or anime moments, ≤ 1 s at a time |

Rule: no effect may cover the subject or important gameplay.

## 6. Sound direction
- Sound design starts at the storyboard, not after the edit.
- Every visual hit (pop, reveal, impact, cut on beat) has a sound, or a deliberate silence.
- Music: pick by the format's bpm range, then cut to it. Duck under voice by 8–12 dB.
- Silence before a reveal (0.3–1 s) is the strongest effect there is.
- Loudness targets: kids −16 LUFS, documentary and nature −16, others −14; gaming Shorts may sit at −10 to −12.

## 7. Continuity rules
- Characters: same spec file and version in every shot (`characters.md`).
- 180° rule in conversations and fights; keep screen direction across cuts.
- Light direction and time of day only change with a story reason.
- Props stay in the hand they were in; costume damage persists.
- Colour script: each act has a dominant colour; plan it in G2.

## 8. "Not a slideshow" checklist
- [ ] Something moves in every shot: camera, character, environment or graphics.
- [ ] Every cut has a reason: new information, new angle, rhythm or emotion.
- [ ] Narration and picture agree on the same frame (word → visual within 6 frames).
- [ ] At least one continuous action carries across a cut (match on action).
- [ ] The viewer always knows where to look.
