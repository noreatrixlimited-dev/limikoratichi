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
