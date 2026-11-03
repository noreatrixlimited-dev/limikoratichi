# Voice-over: native English and native Telugu

The studio speaks **two languages only: English and Telugu**. Every film is written natively in one of
them (never machine-translated word for word). A bilingual channel makes **one animation, two narrations**:
the scene is driven by the voice's cues, so it re-times itself to each language automatically.

Tools: `../scripts/voice.py` (render, check, mix, voices) and `../scripts/voice-setup.sh` (once per machine).
Working example in both languages: `../voice-examples/rain.en.md`, `../voice-examples/rain.te.md` →
`../frames/examples/rain.js` → previews `../frames/previews/rain-en.mp4`, `rain-te.mp4`.

## 1. Engines

| | English | Telugu |
|---|---|---|
| **Default** | `kokoro`: local, offline, Apache-2.0; native US (`af_`, `am_`) and UK (`bf_`, `bm_`) voices | `parler`: AI4Bharat Indic Parler-TTS, local, Apache-2.0; speakers **Lalitha** (F), **Prakash** (M), Kiran (M), tone set with `style=` |
| Channel signature voice | | `indicf5`: AI4Bharat IndicF5, local, MIT; speaks in the voice of a 5–12 s reference clip (`ref=clip.wav` + `clip.txt` transcript) |
| Best quality | | `recorded` (native voice artist or the user) |
| Cloud | `google` (en-US / en-GB Neural2, Chirp HD), `azure` (en-US / en-GB Neural) | `google` te-IN (Standard A/B, Chirp HD if enabled), `azure` te-IN-ShrutiNeural (F), te-IN-MohanNeural (M) |
| Draft only | n/a | `espeak`: robotic, for timing and animatics. **Never publish** |

Setup notes
- **Kokoro:** `bash scripts/voice-setup.sh` builds it from npm + PyPI (works where model hosts are blocked).
- **Parler (Telugu):** needs `huggingface.co` reachable and a Hugging Face token in `HF_TOKEN` from an account that accepted
  the terms at huggingface.co/ai4bharat/indic-parler-tts (free, automatic). Then `bash scripts/voice-setup.sh --telugu`.
  On CPU it is slow (expect several times longer than real time); a GPU machine is fast. Speakers are named in the
  description: `voice: Lalitha`, `style: warm, gentle and cheerful`, `speed:` maps to slow / moderate / fast pace.
- **Google:** the `gcloud` CLI is preinstalled in cloud sessions. Sign in (`gcloud auth login` or a service account), set
  `GOOGLE_CLOUD_PROJECT`, and enable the Text-to-Speech API. Commercial use is covered by Google Cloud's terms.
- **Azure:** set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, and allow `*.tts.speech.microsoft.com` in the
  environment's network settings. The free tier covers about 0.5 M characters a month. Commercial use is covered by Azure's terms.
- **Not allowed:** browser "read aloud" services (for example Edge online TTS) for published videos, because their terms
  don't cover it. Cloned voices are allowed only of people who gave written consent (the user's own voice, a hired artist).

Choosing for Telugu: `parler` is the free, commercial-safe default. For a channel's main narrator, **a native Telugu
voice artist (or the user) recording the script** still sounds best and builds a recognisable channel voice. Cloud
voices are the fast option when a project or key is available.

### Telugu setup runbook (do this in order)
1. On huggingface.co, signed in: accept the terms of **ai4bharat/indic-parler-tts** and **ai4bharat/IndicF5** (automatic).
2. Environment settings → Network access → Allowed domains: **`huggingface.co`** and **`*.hf.co`** (model files are served
   from `*.hf.co`, e.g. `us.aws.cdn.hf.co`, `cas-bridge.xethub.hf.co`). Keep "Allow package managers" ticked.
3. Environment settings → Network secrets (or environment variables): **`HF_TOKEN`** = a read token. Never paste it in chat.
4. Start a **new session** (settings apply to new sessions), then:
   `bash .claude/skills/limiko-studio/scripts/voice-setup.sh && bash .claude/skills/limiko-studio/scripts/voice-setup.sh --telugu`
   (≈ 3 GB runtime + ≈ 5 GB models; takes a while on first run).
5. Test: `python3 scripts/voice.py render voice-examples/rain.te.md --out voice-examples/out/rain-te`, listen, then
   render `frames/examples/rain-te.js`.

Making a signature voice with `indicf5`: pick the voice (your own recording, a consenting artist, or a Parler line you
like), cut a clean 5–12 s clip, save it as `films/_voices/<name>.wav` with its exact Telugu transcript in
`films/_voices/<name>.txt`, then use `ref=../_voices/<name>.wav` (path relative to the script) in `cast` lines.

## 2. Casting

One voice per character for the whole channel, recorded in the character spec (`characters.md`):
```json
"voices": { "en": { "engine": "kokoro", "voice": "am_puck", "speed": 1.08 },
            "te": { "engine": "google", "voice": "te-IN-Standard-B", "speed": 1.0 } }
```
Then in a script's front matter: `cast pip: voice=am_puck speed=1.08` (copy from the spec).

| Format | English narrator (Kokoro) | Telugu narrator | Pace EN / TE (words per minute) |
|---|---|---|---|
| 01 Kids | `af_heart`, `af_bella` (warm), `bf_emma` (UK) | warm female, smiling | 120–135 / 95–110 |
| 02 Facts / science | `af_heart`, `am_michael`, `bm_george` | clear, curious | 150–170 / 115–130 |
| 03 History / mythology | `bm_george`, `bm_fable`, `am_onyx` (deep) | deep storyteller, unhurried | 135–150 / 100–115 |
| 04 Gaming | `am_puck`, `am_eric`, `af_nova` | energetic, young | 175–195 / 135–150 |
| 05 Horror / mystery | `am_onyx`, `bm_lewis` | low, quiet, close | 120–135 / 95–110 |
| 06 Documentary | `bm_george`, `af_sarah` | measured, neutral | 145–160 / 110–125 |
| 07 Anime / cartoon | per character (`am_puck`, `af_sky`, `bf_lily`) | per character | by scene |
| 08 Nature / wildlife | `bm_daniel`, `af_heart` | soft, warm | 125–140 / 100–110 |
| 09 Music / lyric | (songs, not TTS) | (songs) | n/a |
| 10 Business / tech | `am_michael`, `af_sarah` | confident, crisp | 155–170 / 120–135 |

Telugu runs about 20–25% fewer words per minute than English, but the same idea takes a similar time;
always time scenes to the rendered voice, never to a word count.

## 3. Script format (`*.en.md` / `*.te.md`)
```
---
lang: te                  # en | te
engine: google            # kokoro | google | azure | recorded | espeak (draft)
voice: te-IN-Standard-A
speed: 1.0
gap: 0.4                  # silence between lines
cast pip: voice=te-IN-Standard-B speed=1.05
lexicon: lexicon.te.txt   # optional pronunciation fixes
---
# comments are ignored
[narrator] నమస్కారం పిల్లలూ! {pause 0.4} ఈ రోజు మనం ఒక చిన్న ప్రశ్న అడుగుదాం.
[pip] వర్షం ఎలా పడుతుంది?
[narrator] సూర్యుడు నీటిని వేడి చేస్తాడు. {cue steam}నీరు ఆవిరిగా మారుతుంది.
[narrator file=rec/04.wav] …a line recorded by a voice artist
```
| Markup | Meaning |
|---|---|
| `[who opts]` | speaker (from `cast`), optional `voice= speed= engine= gap= file=` for this line |
| `{pause 0.5}` | silence in seconds (also breaks the caption) |
| `{cue name}` | timestamp the next word as a cue; scenes trigger beats on it |
| `{say shown\|spoken}` | show one spelling on screen, speak another (names, numbers, English words in Telugu) |
| `lexicon:` file | `word = respelling` lines applied to every line (spoken only) |

`python3 scripts/voice.py check script.md` prints lines, words and the estimated length before rendering.

## 4. Writing natively

### English
- Spoken, not written: short sentences, contractions, one idea per sentence.
- Numbers as people say them ("thirteen hundred and nine", "about two million").
- Read it aloud once; anything you stumble on, rewrite.

### Telugu
- Write in **Telugu script**, never transliterated Latin; the caption font is bundled (Noto Sans/Serif Telugu).
- **Register by format:**
  - Kids: warm spoken Telugu (పిల్లలూ, చూద్దాం, అడుగుదాం), short sentences, repetition.
  - Facts: clear standard spoken Telugu. English technical words are fine where Telugu speakers use them
    (స్క్రీన్, సైన్స్); explain the term once.
  - History and mythology: graceful, slightly literary Telugu. Use proper names in their Telugu form
    (శ్రీకృష్ణుడు, కాకతీయులు) and mention the source text (మహాభారతం ప్రకారం…).
  - Gaming: casual Telugu-English mix, as gamers really speak.
- **Numbers and dates** as words, the way they're spoken (పదమూడు వందల తొమ్మిది). Use `{say}` when the screen
  should show digits: `{say 1309|పదమూడు వందల తొమ్మిది}`.
- **Sanskrit and English words:** check each TTS pronunciation; fix with `{say}` or the lexicon.
- **Pauses:** Telugu sentences often end on the verb. Put `{pause}` before the reveal word, not after it.
- **Captions:** at most 32 characters per caption line (Telugu glyphs are wider); `voice.py` chunks automatically.

### Translating a channel's English script
Re-write, don't translate: keep the beat sheet and the cues, rewrite each line as a Telugu speaker would say it,
and keep cue names identical so the same animation works (see `rain.en.md` and `rain.te.md`).

## 5. Pipeline
```
1. write  films/<slug>/voice.<lang>.md              (after the storyboard is approved)
2. check  python3 scripts/voice.py check films/<slug>/voice.<lang>.md
3. render python3 scripts/voice.py render films/<slug>/voice.<lang>.md --out films/<slug>/audio/<lang>
          → voice.wav, timeline.json (lines, segments, words, cues, captions), words.json, cues.json, captions.srt
4. listen and fix pronunciation (lexicon / {say}), pacing ({pause}, speed=), then re-render
5. scene  reads timeline.json: cues trigger beats (T.script(...).until('cue')), captions from timeline.captions
6. mix    python3 scripts/voice.py mix --voice voice.wav --music music.wav --out mix.wav --lufs <format target> --duck 10
7. video  node .claude/skills/limiko-studio/frames/animate.cjs <scene.js>   (the scene's setup returns audio + duration)
```
Word timings are **estimated** inside each spoken segment (by letters for English, aksharas for Telugu).
They're accurate at segment and cue level; put a `{pause}` or `{cue}` wherever a beat must land exactly.

Recording a human voice (`recorded` engine): one file per line, named in order (`rec/01.wav`…), 48 kHz WAV,
quiet room, 20 cm from the mic, same distance every take. `voice.py` trims silence and keeps the timing system.

## 6. Mix targets
| Format | Voice-only | With music |
|---|---|---|
| 01 Kids, 06 Documentary, 08 Nature, 05 Horror | −16 LUFS | −16 LUFS, music ducked 10–12 dB |
| 02, 03, 07, 10 | −14 LUFS | −14 LUFS, ducked 8–10 dB |
| 04 Gaming Shorts | −12 LUFS | −12 to −10 LUFS, ducked 6–8 dB |
Tolerance ±1 LU (`voice.py mix` prints the measured value).

## 7. Checklist before publishing
- [ ] Native script in the right register; read aloud once by a fluent speaker, if possible
- [ ] Names, numbers, Sanskrit and English words pronounced correctly
- [ ] No `espeak` lines left (`voice.py render` warns)
- [ ] Each character uses its cast voice from the spec
- [ ] Cues land on the intended beats; captions in the right script and font, ≤ 2 lines
- [ ] Loudness within ±1 LU of the format target
- [ ] Rights: own or licensed voice; cloud voices under the provider's commercial terms; consent for any cloned voice
