# limikoratichi

Video production studio for YouTube channels (kids, facts/science, history and mythology, gaming, and more),
built as a Claude Code skill. Two narration languages only: **native English** and **native Telugu**.

Work happens on the branch `claude/blissful-archimedes-vuzaqf`. The skill lives in `.claude/skills/limiko-studio/`;
start with its `SKILL.md`.

## Map
| Path | What |
|---|---|
| `.claude/skills/limiko-studio/SKILL.md` | Router: 10 formats, mandatory pre-production gates, tools, rules |
| `…/formats/NN-*/direction.md` | Per-format identity, pacing, allowed camera/transitions, checklist |
| `…/shared/` | Pre-production, directing, characters, voice-over, engines, editing, packaging, assets |
| `…/frames/` | Renderer: style frames (`render.cjs`), character sheets (`character-sheet.cjs`), animation → MP4 (`animate.cjs`, `timeline.js`) |
| `…/scripts/voice.py` | Voice-over: render / check / mix / voices; engines kokoro (EN), parler + indicf5 (TE), recorded, espeak (draft) |
| `…/scripts/voice-setup.sh` | One-time voice install (`--telugu` adds the native Telugu models) |
| `…/REFERENCES.txt` | The only place outside repos/models are named: links, licences, commercial-use status |
| `…/voice-examples/` | `rain.en.md`, `rain.te.md` (same cues), `volcano.en.md` |
| `…/frames/examples/rain-en.js`, `rain-te.js` | One animation, two narrations, driven by voice cues |

Rules the user set: fresh original writing (no copied text or branding from other projects; sources only in
REFERENCES.txt); check licences before using any code, model or asset (commercial channel); never publish the
robotic `espeak` voice.

## State (2026-11-03)
Done and tested: director system, 59 style frames (2D + three.js 3D), character rig + reference sheets, timeline
toolkit + animate.cjs, English voice (Kokoro, offline), voice timings/cues/captions/mixing, Telugu captions font,
bilingual rain example. English rain video: `frames/previews/rain-en.mp4`.

**Open task: native Telugu voice.** Code is ready (`parler` = AI4Bharat Indic Parler-TTS, Apache-2.0;
`indicf5` = AI4Bharat IndicF5, MIT, voice from a reference clip). Both models are gated on Hugging Face.
Environment setup by the user: network access allows `huggingface.co` and `*.hf.co`; a network secret adds
`Authorization: Bearer <token>` to huggingface.co requests (or `HF_TOKEN` env). In the last session the gated
download still returned 401 (the secret was saved after that session started).

## Next steps for the Telugu voice
1. Test access (expect 200, not 401):
   `curl -s -o /dev/null -w '%{http_code}\n' -L https://huggingface.co/ai4bharat/indic-parler-tts/resolve/main/config.json`
   If 401: tell the user to check the network secret (Header `Authorization`, Prefix `Bearer`, Value `hf_…`),
   that the same account accepted the terms of ai4bharat/indic-parler-tts and ai4bharat/IndicF5, and stop.
2. Install: `cd .claude/skills/limiko-studio && bash scripts/voice-setup.sh && bash scripts/voice-setup.sh --telugu`
   (frames: `cd frames && npm install` for three.js). Large downloads; run in the background.
3. Render: `python3 scripts/voice.py render voice-examples/rain.te.md --out voice-examples/out/rain-te`
   then `python3 scripts/voice.py mix --voice voice-examples/out/rain-te/voice.wav --out voice-examples/out/rain-te/voice.m4a --lufs -16`
   (English too: same with `rain.en.md` / `rain-en`).
4. Video (from the repo root): `node .claude/skills/limiko-studio/frames/animate.cjs .claude/skills/limiko-studio/frames/examples/rain-te.js --out <out>.mp4`
5. Check pronunciation and pace (CPU rendering is slow); adjust `style=`/`speed=`/`{say}` in `rain.te.md`.
   Replace `frames/previews/rain-te-draft-voice.mp4` with the native version (compress: `-crf 30`), commit, push,
   and send the video to the user.
