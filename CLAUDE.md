# limikoratichi

Video production studio for YouTube channels (kids, facts/science, history and mythology, gaming, and more),
built as a Claude Code skill. Two narration languages only: **native English** and **native Telugu**.

Work happens on the branch `claude/blissful-archimedes-vuzaqf`. The skill lives in `.claude/skills/limiko-studio/`;
start with its `SKILL.md`.

## Map
| Path | What |
|---|---|
| `.claude/skills/limiko-studio/GUIDE.md` | **The whole picture**: every job → read, run, ask, deliver, limits |
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
toolkit + animate.cjs, English voice (Kokoro, offline), **native Telugu voice (Indic Parler-TTS: Lalitha, Prakash)**,
voice timings/cues/captions/mixing, Telugu captions font, bilingual rain example.
Previews: `frames/previews/rain-en.mp4`, `frames/previews/rain-te.mp4` (native Telugu voice).

Telugu voice notes
- `parler` renders on CPU at roughly 8–10× real time (a 20 s narration ≈ 5–7 min). The model loads once per script.
- Neural TTS sometimes stops early; `voice.py` cleans text (`…` → comma) and `voice_parler.py` retries short outputs.
- Verify Telugu output by transcribing it: the wav2vec2 Telugu ASR model (Apache-2.0, ~45% WER, so judge
  meaning, not spelling) lives in `~/.cache/limiko-voice/models/` (clone from huggingface.co/anuragshas/wav2vec2-large-xlsr-53-telugu).
- `indicf5` (voice from a reference clip) is installed in its own venv (`venv-f5`, transformers 5.x; parler's
  `venv-te` pins 4.46). Not yet tested end to end. Reference voices: only ones we have rights to (user, consenting
  artist, or a synthetic Parler voice).

Gaming edits (2026-11-03): `scripts/gameedit.py` (scan → badges → edit.json → render) with the user's rules:
full-highlight videos have no hook; zoom in + zoom out around every kill (not only punches); a transition after
every highlight; a glow on the player's character (`scripts/charglow.py identify`: if it isn't sure, show
identify.jpg and ask the user which character is theirs). Moving camera in every shot of every video (all formats;
`shared/directing.md` §0 and each `direction.md` "Camera rules"). Setup: `bash scripts/vision-setup.sh`
(venv-vision shares torch with venv-te). Tested on the user's gameplay (raw clip not in the repo).
Character outline tracking uses SAM 2.1 tiny (transformers 4.57 inside venv-vision only; venv-te keeps 4.46 for
Parler); DETR only identifies. Transitions: 166 GL Transitions vendored in frames/transitions/gl (`frames/transitions.cjs`),
text animations `frames/textfx.js` (25 presets, Telugu-safe); guide `shared/transitions-text.md`.
Outline styles in gameedit: sticker (default, white stroke + warm glow, from the user's thumbnail reference), neon,
aura; optional "grade": "leak" (purple→gold). Thumbnails: `scripts/thumbnail.py` (SAM 2 cut-out + sticker outline +
leak grade + 3D text, mixed Telugu/Latin runs). The repo is public: don't commit the user's footage or frames of it.

Scripts: first 10 seconds follow the O-10 curiosity format (`shared/hooks.md`); score openings with
`scripts/hookcheck.py` (EN/TE, per format, uses the rendered timeline when given).

Environment: network allows `huggingface.co` and `*.hf.co`; a network secret adds `Authorization: Bearer <token>`
to huggingface.co (account accepted the terms of ai4bharat/indic-parler-tts and ai4bharat/IndicF5).

## Setting up a fresh session
1. `cd .claude/skills/limiko-studio && bash scripts/voice-setup.sh && bash scripts/voice-setup.sh --telugu`
   and `cd frames && npm install`, then `bash scripts/vision-setup.sh` for gaming edits. Large downloads; run in the background.
2. Check access if Telugu fails: `curl -s -o /dev/null -w '%{http_code}\n' -L https://huggingface.co/ai4bharat/indic-parler-tts/resolve/main/config.json` (200 = ok).
3. Narration: `python3 scripts/voice.py render voice-examples/rain.te.md --out voice-examples/out/rain-te`, then
   `python3 scripts/voice.py mix --voice voice-examples/out/rain-te/voice.wav --out voice-examples/out/rain-te/voice.m4a --lufs -16`.
4. Video (from the repo root): `node .claude/skills/limiko-studio/frames/animate.cjs .claude/skills/limiko-studio/frames/examples/rain-te.js --out <out>.mp4`.
