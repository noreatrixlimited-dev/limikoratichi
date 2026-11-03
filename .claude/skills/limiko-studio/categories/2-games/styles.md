# Games graphics styles

For intros, overlays, tier boards, lore and explained videos (drawn in code, `../../shared/building.md`).

| id | Look | Motion | Sound | Best for |
|---|---|---|---|---|
| `pixel-quest` 🟡 | 16-bit pixel art, tile maps, dialogue boxes | Tile-step movement, shake on hits | Chiptune, 8-bit effects | Retro lore, reviews |
| `diorama-2d` 🔴 | Pixel sprites in a 3D-lit miniature with depth of field | Slow dolly, light shafts | Orchestral chiptune | Story recaps, intros |
| `micro-games` 🟢 | Rapid mini-game screens, bold instructions, timer bars | 3–5 s each, hard cuts | Jingles, success/fail stings | Challenges, quizzes |
| `quiz-show` 🟢 | Flat game-show stage, podiums, giant digits | Snaps on the beat, confetti | Brass hits, cheers | Versus, rankings, trivia |
| `terminal-crt` 🟢 | Green/amber ASCII on a curved CRT | Type-on text, glitch flicker | Key clicks, hum | Hacker lore, logs, speedruns |
| `holo-hud` 🔴 | Sci-fi hologram panels, cyan glow, wireframes | Panels unfold, scans sweep | Synth swells, UI chirps | Stats, builds, tier lists |
| `liminal-tape` 🟡 | VHS found footage, empty halls, timestamp | Handheld drift, tracking errors | Fluorescent buzz | Horror games, creepy lore |
| `space-sitcom` 🟡 | Rounded sci-fi cartoon, bright flats | Snappy acting, smears | Theremin, comedy stings | Funny skits |
| `neon-arcade` 🟡 | Black background, neon outlines, bloom, grid floor | Pulses on the beat, outlines trace | Synthwave | Intros, montages, end screens |
| `anime-impact` 🔴 | Speed lines, impact frames, bold black-and-white flashes | Smash zoom, 2-frame impact flash | Hits, shouts, drums | Hype moments, clutch reveals |
| `tier-board` 🟢 | S/A/B/C/D rows in bold colours, item cards | Cards fly in and drop into rows | Swoosh, thud per drop | Tier lists |

## Overlay kit (reuse across videos)
Kill counter · combo meter · "WAIT FOR IT" banner · rank badge · health bar mock · subscribe end card.
Build them once as HTML components, render with transparency (PNG sequence, alpha) and overlay in ffmpeg.
