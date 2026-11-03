# AI-generated clips (Route B)

Use when the shot must look photographic or cinematic and code drawing can't fake it.
These need a GPU (12–24 GB VRAM) or a hosted runner; they don't run in this container.

## Pick a model
| Need | Engine id | Notes |
|---|---|---|
| Best open quality, text or image to video | `M-wan` | Apache-2.0, safe for paid use |
| Fast, smaller GPU | `M-ltx` | Apache-2.0 |
| Open alternatives | `M-opensora`, `M-cog` | Apache-2.0 |
| Animate our own character image | `M-animate`, `M-animate2` | consistent character |
| High quality, check region terms | `M-hunyuan*` | custom licence, read first |
| Run them all in one UI | `M-comfy` (+ `M-comfy-mcp` for agent control) | outputs are ours |
| Short drama pipeline (script → storyboard → prompts) | `M-drama` | MIT |
| Prompts for hosted models | `M-prompts` | MIT |

## Procedure
1. Make a **character sheet** first (front, side, 3/4, expressions) so every clip matches.
2. One prompt per shot: subject · action · setting · camera (lens, move) · light · style · duration.
3. Generate 3–4 takes per shot at low res, pick, then upscale the winner.
4. Generated clips are 3–6 s: plan the edit as many short shots, not one long take.
5. Add voice, music and captions in the edit (`guides/editing.md`); generated audio is rarely usable.
6. Keep the prompt, seed and model version in `films/<slug>/prompts.md` for re-renders.

## Rules
- No real people's likeness or voices without consent; no logos or trademarked characters.
- Kids channel: check every frame for artefacts (extra fingers, odd faces) before publishing.
