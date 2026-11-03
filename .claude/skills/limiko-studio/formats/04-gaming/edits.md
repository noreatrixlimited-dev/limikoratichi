# Game edit techniques and formats

## Formats
| Format | Structure | Pace |
|---|---|---|
| **Clutch / highlight Short** | peak moment frozen 0.5 s + "wait for it" → 3 s of setup → the play → slow-mo replay of the key hit → reaction | 0.6–1.5 s shots |
| **Montage** | intro hit on the drop → plays grouped by type → best play last on the biggest drop | every cut on a beat |
| **Funny moments** | cold open with the funniest clip → 8–15 clips, each with its own mini setup and punchline → outro clip | let jokes breathe: 1 s hold after the punchline |
| **Fail compilation** | fail shown, freeze, sound effect, quick replay | 2–4 s per fail |
| **Velocity edit** | speed ramps between slow (0.3×) and fast (2–3×) on the beat, flashes on transitions | beat-locked |
| **Tier list / ranking** | tier board graphic, each item: clip + reason + drop into tier | 6–15 s per item |
| **Lore / explained** | Route A graphics + gameplay b-roll, narrated story | 2–4 s shots |
| **Tutorial / tip** | result first → steps with arrows and circles → result again | 1.5–3 s shots |

## Highlight structure rules
| The video is… | Hook? | Structure |
|---|---|---|
| **Full highlights** (every part is action: montage, kill compilation, a match cut down to its fights) | **No hook.** Start straight in the first highlight | highlight → transition → highlight → … → outro (victory screen) |
| **One big moment with build-up** (a clutch Short, a long fight, a story) | Yes: the best ~1.2 s first (result first / wait for it) | hook → transition → build-up → the moment → outro |

- **Transition after every highlight.** Default `glow-zoom` (zoom-through with a light flash and bloom, plus a whoosh).
  Alternatives: `whip` (energy), `flash` (beat drops), `cut` (only inside one continuous highlight).
  For a GL transition from the library (WhipPan, GlitchDisplace, CrossZoom… see `../../shared/transitions-text.md`),
  render each highlight as its own edit (or cut the final at highlight boundaries) and join them with
  `frames/transitions.cjs chain`.
- **Zoom in and zoom out on every event:** ease in towards the player before the hit, punch on the hit, ease back out after.
  Not only punches. The camera never stops (`direction.md`, Camera rules).
- **Character glow on the player** throughout the highlights (aura around the outline, never filling the body),
  brighter for a moment on each kill. The glow colour is the channel's colour (default cyan `#3fe8ff`).
- **Identify the player's character before glowing.** `charglow.py identify` decides automatically when it is
  sure. **If not sure, ask the user:** show `identify.jpg` (numbered outlines) and ask which number is their
  character, then use `--pick N` or the anchor. Never guess and glow the wrong person (an enemy or a teammate).

## Tool workflow (`scripts/gameedit.py`, runs in `venv-vision`: `bash scripts/vision-setup.sh` once)
1. **Scan:** `gameedit.py scan raw.mp4 --a 0 --b <end>` → 1 frame/s grid + loud peaks. Find the fights, the
   downtime to cut (looting, walking, menus, phone notifications, volume sliders) and the victory screen.
2. **Pin kills:** `gameedit.py badges raw.mp4 --t 31,37,40,…` → 4 frames/s strips of the HUD centre; take the first
   frame where each kill badge appears. Multi-kill banners ("DOUBLE", "QUADRA"…) are `"big": true`.
3. **Character:** `charglow.py identify raw.mp4 --a <first fight> --b <last fight> --out work/id` → auto, or ask the user.
   Tracking then uses **SAM 2** (follows that one object; tight outline incl. limbs and weapon). If more than 15% of
   frames are uncertain, the render stops and shows `masks_N.check.jpg`: show it to the user; on approval set
   `"glow": {"approved": true}`; if the outline is on someone else, identify again and ask.
4. **Edit list:** write `edit.json` (format in `gameedit.py --help`): `full_highlights`, highlights with events,
   slow motion on the biggest moment, `glow.anchor`, outro.
5. **Preview:** `gameedit.py render edit.json --preview` (640 px, fast) → check timing, then show the user.
6. **Final:** `gameedit.py render edit.json` → 1920×1080 (or 1080×1920) at 60 fps, game audio + generated sound
   effects, mixed to the loudness target.
Rendering speed on CPU: character tracking ≈ 2 s per analysed frame (6 per second of highlight); the edit itself ≈ 2–4× real time.

## Effects (ffmpeg patterns in `../../shared/editing.md`)
| Effect | Use it for | Settings |
|---|---|---|
| Zoom punch-in | kills, headshots, big damage | 115–130% over 3–4 frames, hold, ease back |
| Screen shake | explosions, hits | 6–12 px, 4–8 frames, decaying |
| Speed ramp | velocity edits, before a big hit | 1× → 0.3× at the hit → 1× |
| Freeze frame | "wait for it", meme pause | 0.4–1 s, add a desaturate or zoom |
| Flash | transitions on beat drops | white 2–3 frames at 60–80% opacity |
| Chromatic split | glitch / hype moments | RGB offset 4–8 px for 3 frames |
| Slow-mo replay | the key moment | 0.25–0.5× with frame blending (`minterpolate`) |
| Kill counter / combo | streaks | top-left, pops +1 with a scale bounce |
| Arrow / circle callout | tutorials, "look here" | hand-drawn red circle draws on over 6 frames |
| Motion blur | fast whips | `tmix=frames=3` on whip transitions |

## Sound kit
Whoosh (transitions), impact boom (hits), riser (before the reveal), bass drop (payoff),
record scratch (freeze), "ding" (counter), crowd cheer (win, royalty-free).
Keep the game's own sound for authenticity, ducked under voice and effects.

## Captions for gaming
Bold heavy sans, uppercase, 2–3 words at a time, white with black outline, key word in yellow or green,
pop-in scale 80%→100% over 3 frames. Keep them above the bottom 15% (platform UI).
