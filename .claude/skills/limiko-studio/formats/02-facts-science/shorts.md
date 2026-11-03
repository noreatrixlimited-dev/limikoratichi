# Facts Short · "firm narrator" format

A vertical facts Short of about 60 s: one surprising topic, told by a firm, confident narrator in short punchy
sentences, with a number or concrete detail in every beat, a twist near the end and a fixed outro. Built from the
measured delivery of a reference set of facts Shorts the user supplied (only the numbers were kept). Example:
`films/ant-nest-rain/` (script, scene, sources, final).

Use it for: facts and science Shorts, nature-facts Shorts, "places on Earth" Shorts. English or Telugu.

## 1 · Structure (about 160 words, about 60 s)
| Part | Time | What | Example (ant nest) |
|---|---|---|---|
| Strike | 0–3 s | a bold statement or the most surprising fact, ≤ 9 words | "Ants were building rain-proof cities long before us." |
| Gap | 3–6 s | the question the viewer can't answer yet, with a number | "So why do a hundred thousand ants still end up floating?" |
| Promise | 6–9 s | the open loop: "By the end…" | "By the end, you'll know their backup plan." |
| Part 1: how it works | 9–37 s | 4–6 beats, one fact each, each with a visual mechanism. Order: the expected answer first. | roof → rim → sealed door → drainage → eggs go up |
| Turn | 1 line | "But sometimes…" | "But sometimes, the rain wins, and the whole nest floods." |
| Part 2: the twist | 37–58 s | 4–5 beats, the surprising answer, a number per beat | link → 100 seconds → trapped air → queen → weeks |
| Outro | 2 s | fixed line, calmer | "Follow for more incredible facts." |

Writing rules: sentences of 6–14 words; one idea per line (one `[narrator]` line = one beat and one cue).
Numbers are spoken simply ("a hundred thousand", "about a hundred seconds"). Every claim goes in `plan/sources.md`.
Hedge honestly ("some ants", "many rooms") rather than overclaim. Write three openings and score them
(`hookcheck.py --options`); keep the best one (the example scored 100).

## 2 · Delivery (the narrator's "accent")
Targets are in `shared/voice-profiles/facts-short-firm.json`, measured with `scripts/voicestyle.py`:

| Measure | Target | Why it matters |
|---|---|---|
| Pace | ~160 wpm overall, ~230 while speaking | fast but every word lands |
| Pauses | ~0.34 s between thoughts, about half of them sentence-length | the rhythm of the format |
| Pitch | ~132 Hz median, ~10.6 semitones range | firm but not monotone; too deep turns muddy |
| Brightness | ~1600 Hz spectral centre, ~17% energy under 300 Hz | the consonants stay clear on phone speakers |
| Clarity | ≥ 90% of the script's words recognised by ASR | the test for "words are clear" |

**Voice recipe (measured: within tolerance on all 8 measures, 95% clarity):** `engine: chatterbox`,
`ref:` a studio-made Kokoro **am_fenrir** clip (speed 0.9, about 7 s; see `films/ant-nest-rain/voice-ref/`),
`emotion: 0.65`, `cfg: 0.5`, `gap: 0.34`, and outro `emotion=0.5`. Alternatives: Kokoro am_fenrir at speed 0.82
(plain, clear), bm_george (closest overall, British). Never clone a voice we don't own (for example, a
commercial voice library's voices); to use one, the user renders our script in their own account and we use `engine: recorded`.

Process:
1. Render 3–4 candidate voices on the first three lines, then run
   `python3 scripts/voicestyle.py pick shared/voice-profiles/facts-short-firm.json cand1.wav cand2.wav … --text "<lines>"`.
2. Render the full script with the winner.
3. Run `voicestyle.py compare shared/voice-profiles/facts-short-firm.json out/voice-en/voice.wav --text "<script>"`. Fix
   anything flagged using its advice, until clarity is ≥ 90% and at most 2 measures are off.
4. For a new reference channel: `voicestyle.py analyze reference.mp3 --out shared/voice-profiles/<name>.json`
   (numbers only; never commit the reference audio).

## 3 · Picture
- Vertical 1080×1920 at 30 fps. **A cross-section or close-up mechanism for every beat** (show how it works,
  never just illustrate the noun).
- Camera always moving: drift, a push-in per beat, pans that follow the action (`shortkit.drift`, `cam`).
- A new shot at each new fact: a hard cut with a 0.14 s white flash and a 7% zoom punch (`shortkit.flash`, `punch`).
  Long beats move the camera inside the same world instead of cutting.
- **One kinetic label per beat** at 30% of the height (yellow, the key word or number: "RAISED RIM", "66 s",
  "WEEK 2") via `shortkit.label` and `shortkit.pill`.
- Word-by-word captions at 66% of the height, white with the spoken word in yellow, two lines at most
  (`shortkit.captions`). Keep all text between 18% and 72% of the height and out of the right 12% (the Shorts buttons).
- The hook shows the payoff early: a flash-forward glimpse of the twist (the raft) during the gap line.

## 4 · Sound
- Generated ambience (no licence issues): weather or environment bed ducked under the voice, one low-end hit
  (thunder or boom) on the strike and on the turn. See the ffmpeg recipe in `films/ant-nest-rain/` history.
- Final mix −14 LUFS (`make.py final` normalises to the format target).

## 5 · Build it
```bash
python3 scripts/make.py new <slug> --format facts --lang en        # then write voice.en.md in this structure
```
```bash
python3 scripts/make.py check <slug>                               # hook score + parse
```
```bash
python3 scripts/make.py draft <slug>                               # voice + half-rate preview → show the user
```
```bash
python3 scripts/make.py approve <slug> && python3 scripts/make.py final <slug>
```
`scene.js` imports `frames/shortkit.js`, with shots chosen by voice cues: `K.pickShot(t, [[0, 'a'], [c('gap'), 'b'], …])`.

## 6 · Checklist
- [ ] Strike ≤ 9 words; hook score ≥ 72; the twist glimpsed in the first 6 s
- [ ] ~160 words, about 60 s; one fact and one cue per line; outro line
- [ ] Every claim sourced; hedged where the evidence is partial
- [ ] Voice: clarity ≥ 90%, at most 2 measures off the profile
- [ ] A mechanism visual and one label per beat; camera moving in every shot; text in the safe zone
- [ ] Ambience ducked; final at −14 ±1 LUFS; 1080×1920 at 30 fps
