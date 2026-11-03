# Remake a trend: study a trending video's edit, rebuild it with our content

Goal: learn the **editing grammar** of a video that's working (pacing, hook, captions,
transitions, sound pattern, structure) and make a new video with the same grammar and
completely our own content.

**Copy the grammar, never the material.** Their footage, music, voice, exact script,
characters, logos and thumbnail art are theirs. Shot lengths, caption treatment, hook
structure, transition types and sound-effect rhythm are techniques anyone may use.

---

## Step 1 · Get the reference

- Best: the user gives the file (screen recording, downloaded own video, or a clip they have rights to study).
- A URL: if `yt-dlp` is installed and the user confirms they may download it, run
  `yt-dlp -f "bv*[height<=1080]+ba/b" -o "films/_refs/%(id)s.%(ext)s" <url>`.
  Otherwise ask the user to upload the file. Don't bypass logins, paywalls or DRM.
- Study 2–3 videos of the same trend, not one. The grammar is what they share.

## Step 2 · Measure

```
python3 .claude/skills/limiko-studio/scripts/analyze.py films/_refs/<file> [--threshold 0.3]
```
Lower `--threshold` (0.2) for soft cuts and dark videos, raise it (0.4) when camera motion
creates false cuts. Check: the shot count should match what you see in `shots.jpg`.

Output in `films/_refs/<name>/`: `analysis.json`, `shots.jpg`, `hook.jpg`, `recipe.md`.

## Step 3 · Look

Open `hook.jpg` and `shots.jpg` with the Read tool and fill every ✍️ line of `recipe.md`.
What to look for:

| Area | Questions |
|---|---|
| Hook | What's on screen at 0.0 s? Is the payoff shown first? Text in the first frame? Face or object? |
| Captions | Word-by-word or line? Case? Outline or box? Highlight colour on key word? Position? Emoji? |
| Motion | Punch-in zooms on emphasis? Constant slow push? Shake on impact? Speed ramps? |
| Transitions | Hard cuts only, or whips / zoom-throughs / flashes / match cuts? |
| Framing | Face fills how much? Centre-framed for vertical? B-roll share? |
| Graphics | Arrows, circles, progress bar, stickers, screenshots, maps? |
| Sound | Sound effect on every cut? Riser before reveal? Music drops on payoff? Silence used as a hit? |
| Structure | Times of hook → setup → each beat → payoff → CTA. Does the ending loop into the start? |

The numbers that matter most:
- `shot_len_median` and `cuts_per_5s`: the rhythm. Copy the curve, not just the average.
- `cuts_in_first_3s` and `first_shot_len`: hook speed.
- `cuts_on_beat_ratio` > 0.5: the edit is cut to the music. Do the same.
- `integrated_lufs`: match loudness (social videos usually sit −14 to −10 LUFS).
- `likely_burned_captions`: if true, captions are part of the style.

## Step 4 · Write the trend card

Save `films/_refs/<trend>/trend-card.md`, the reusable result:

```
Trend: <short name>          Seen on: <platform>, <date>
Length: <s>  Size: <WxH>  Shots: <n>  Median shot: <s>
Hook: <type> · <what happens in 0–1.5 s> · hook text "<pattern, not their words>"
Rhythm: <e.g. 0.6 s cuts for 3 s, then 1.5–2 s, rapid 0.4 s build before payoff>
Captions: <font weight, case, colour, highlight, words per line, position, animation>
Motion: <punch-in on every stressed word / slow push / shake>
Transitions: <list>
Sound: <voice style> · <music genre, bpm> · <sfx pattern> · <LUFS>
Structure: hook 0–2 · setup 2–6 · beats 6–40 · payoff 40–50 · CTA/loop 50–55
Why it works: <one or two lines>
```

## Step 5 · Rebuild with our content

1. Pick our topic and channel playbook (`playbooks/`).
2. Pick the look:
   - The trend is real footage → use our own footage or AI clips (`guides/ai-models.md`) and edit with `guides/editing.md`.
   - The trend is animated or graphic → closest style in `styles/README.md`.
3. Write our script on the trend card's structure: same beat count, same timings ±10%.
4. Make the shot list using the **reference shot lengths** from `analysis.json` (`shot_list[].len`),
   stretched or trimmed to our voice track.
5. Apply the caption spec, motion pattern, transition set and sound-effect pattern from the card.
6. Build with `styles/building.md` (code-drawn) or the editing guide (footage).
7. Run `analyze.py` on **our** render and compare with the reference:

| Check | Target |
|---|---|
| median shot length | within ±20% of reference |
| cuts in first 3 s | equal or more |
| cuts per 5 s curve | same shape |
| on-beat ratio | similar if reference > 0.5 |
| loudness | within ±2 LU |
| captions | present if reference had them |

Fix the biggest gap, re-render once, and report the comparison table to the user.

## Step 6 · Package

Use `guides/packaging.md`: the hook line, title, thumbnail text and tags follow the trend's
*pattern* in our own words.
