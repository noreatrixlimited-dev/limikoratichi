# Pre-production: the mandatory workflow

No full video is produced until the user approves the plan. Every project goes through these
gates, in order. Each gate writes a file in `films/<slug>/plan/` and ends with a short summary
to the user plus a question: **approve, or what to change?**

```
G1 Topic analysis → G2 Format + visual direction → G3 Characters (if any) →
G4 Concept / moment plan → G5 Storyboard → G6 Sample frames → ✔ approval → production
```

Small jobs (a single Short, an edit of a few clips) may combine G2–G5 into one message,
but sample frames (G6) are never skipped.

---

## G1 · Topic analysis → `plan/01-topic.md`
```
Topic:            <one line>
Audience:         <age / interest / platform>
One takeaway:     <what the viewer must feel or know at the end>
Truth status:     fact | legend/myth | fiction | mixed (mark which parts)
Research:         <sources, or named texts and versions for myths>
Format(s):        <one of the 10 formats; a second only if it truly mixes, e.g. history + documentary>
Length / size:    <s> · <16:9 | 9:16 | both>
Risks:            <sensitive subject, kids safety, copyright, accuracy>
```
Choosing the format: decide by **what the viewer came for**, not the subject. A volcano for toddlers is
01 Kids; a volcano explained is 02 Facts; a volcano that buried a city is 06 Documentary or 03 History;
a volcano level in a game is 04 Gaming.

## G2 · Visual direction → `plan/02-direction.md`
Read the format's `direction.md`, then fill:
```
Format:           <NN name>
Style id:         <from the format's styles.md, or a style of the E-film engine>; why, in one line
Palette:          <4–6 hex colours + 1 accent>; mood words: <3>
Light:            <time of day, key direction, contrast>
Camera grammar:   <moves allowed, from the format profile>
Transition set:   <the 2–4 transitions this film will use, nothing else>
Pace:             <median shot length, cuts per minute, where it speeds up / slows down>
Animation:        <speed, timing on ones or twos, squash/stretch amount>
Type & captions:  <font, case, position, highlight rule>
Sound:            <voice, music genre and bpm, sound-effect palette, loudness target>
Reference frames: <trend card or reference videos, if any>
Not doing:        <explicit list of effects and moves this film avoids>
```

## G3 · Characters → `characters/<id>.json` + reference sheet
Required for any recurring character (kids hero, mythological figures, anime cast, mascots).
1. Write the spec (see `characters.md` for the schema): face, proportions, age, skin, hair, clothing,
   colours (exact hex), accessories, signature pose, personality, voice.
2. Render the reference sheet: `node ../frames/character-sheet.cjs <spec.json>` (from `shared/`; or `node frames/character-sheet.cjs …` from the skill root) gives turnaround
   (front, 3/4, side, back) + 5 expressions + a colour strip.
3. Show it to the user and get approval. **Locked after approval.** Every scene uses the same spec file;
   a change to a character means a new version (`<id>@2`) and re-approval.
4. Sacred or historical figures: traditional attributes come from the texts or sources (see `../formats/03-history-mythology/storytelling.md`).

## G4 · Concept or moment plan → `plan/04-concepts.md`
Format-specific. Use the matching template:

**Explainers (02, 10):** one row per concept. *What must the viewer understand → what moves on screen to show it.*
```
| # | Concept | Visual mechanism (what animates) | 2D/3D | Labels | Proof shot |
| 1 | Magma rises because it's less dense | cutaway of crust; orange blobs rise through layers; density arrows | 3D cutaway | "less dense", "pressure" | gauge needle climbing |
```
Rule: a static picture is never the explanation. If nothing moves, redesign the shot.

**Gaming (04):** the moment map from footage.
```
| t (raw) | Moment | Type (kill/clutch/fail/funny/explore) | Intensity 1–5 | Camera (track/zoom/slow-mo) | Effects | Beat |
```

**Stories (01, 03, 05, 07):** the beat sheet (5–8 beats) with the emotion of each beat and its turn.

**Documentary / nature (06, 08):** the sequence list: establishing → subject → detail → context (map / timeline) → payoff.

**Music (09):** the song map: section, time, lyric line, beat grid, visual idea, energy 1–5.

## G5 · Storyboard → `plan/05-storyboard.json` (+ `.md` table)
One entry per shot. Every shot has a purpose; if the purpose column is empty, cut the shot.
```json
{
  "id": "S03", "start": 8.0, "dur": 3.2,
  "purpose": "show magma rising: the cause of the eruption",
  "picture": "3D cutaway of the mountain, magma chamber glowing",
  "characters": [], "camera": "slow push-in 100→115%, slight orbit 8°",
  "motion": "magma blobs rise 0→60% height, ease-in-out",
  "text": "Magma rises", "transition_in": "match-cut on the mountain shape",
  "sound": "low rumble rising, bubble pops", "voice": "Deep underground, molten rock is rising…",
  "continuity": "same mountain model and light as S02"
}
```
Rules:
- Shot lengths follow the format profile's pacing table.
- Each transition comes from the G2 transition set.
- Continuity column: what must match the previous shot (character version, light, screen direction, props, time of day).
- Keep screen direction: a character walking left→right keeps doing so unless a shot shows them turn.

**Opening (first 10 s):** before the storyboard is approved, write three openings in the O-10 format
(`hooks.md`), score them with `../scripts/hookcheck.py --options`, and show the top two with their scores.
The storyboard's first shots follow the chosen opening beat by beat.

## G6 · Sample frames → `plan/frames/`
Render 3–6 key frames in the chosen style **with the real characters**: the hook frame, one frame
per act, and the most complex shot. Use `frames/` (style frames) and the character rig.
Show them together on one contact sheet. Get approval before animating anything.

## Approval and change log
- Record each approval in `plan/approvals.md` (date, gate, what was approved, changes asked).
- After approval, changes go through the log; don't silently drift.

## Continuity log (during production) → `plan/continuity.md`
Per scene: character versions used, light direction, palette, props in hand, costume state (torn, wet),
time of day, screen direction. Check it before rendering each new scene.

## Production after approval
Follow `building.md` (code-drawn), `editing.md` (footage) or `ai-models.md` (generated clips),
then the format's checklist and `../scripts/analyze.py` on the render.
