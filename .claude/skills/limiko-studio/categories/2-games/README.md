# 2 · Games editing

**Promise:** the best moments of gameplay, cut hard and fast: wins, fails, clutches, funny bits,
plus lore and ranking videos.
**Files here:** `edits.md` (edit techniques and formats) · `styles.md` (graphics looks) · `packaging.md` · this playbook.

## Settings
| | Default |
|---|---|
| Formats | Short 15–45 s · montage 1–3 min · highlights / funny moments 8–12 min · lore / tier list 8–15 min |
| Size | 1080×1920 Shorts (gameplay top 60%, reaction cam or graphics bottom) · 1920×1080 long |
| Route | C · edit real footage (`../../shared/editing.md`); graphics and lore in Route A |
| Pace | Shorts median shot 0.8–1.5 s; montage cuts on the beat |
| Voice | high energy, 180–200 wpm, natural reactions |
| Music | phonk / trap / EDM / chiptune 120–160 bpm, royalty-free or our own |
| Loudness | −12 to −10 LUFS for Shorts, −14 long-form |
| Engines | `C-ffmpeg`, `C-subs`, `C-cut`, `G-pixelfx`, `G-sprites`; analyzer `../../scripts/analyze.py` |

## Footage rules
- Use the user's own recordings (OBS, console capture). Record at 60 fps so slow-motion works.
- Check the game publisher's video policy; most allow monetised gameplay with your own commentary or edit.
- Never use other creators' clips without permission. Use only royalty-free or our own music:
  copyrighted songs get Shorts muted or claimed.

## Procedure
1. **Ingest**: probe each recording; make a 2 fps proxy for fast review.
2. **Find moments**: audio peaks (shouts, explosions), kill-feed and score changes, motion spikes.
   Run `analyze.py` on raw footage: loud and high-motion seconds are the candidates.
   List them as `moments.json` with start, end, type (win, fail, funny, clutch, skill).
3. **Pick the format** from `edits.md` and the structure it needs.
4. **Hook**: the best moment's peak (or a freeze frame of it with "wait for it…") in the first second.
5. **Cut**: trim every moment to its action, no walking or menus. Cuts on the beat for montages.
6. **Effects** (from `edits.md`): zoom punch-ins, shake, speed ramps, freeze frames, flashes; one effect per hit, not everything everywhere.
7. **Text and overlays**: captions for speech, meme text sparingly, counters and rank graphics in our style.
8. **Sound**: game audio −6 dB under voice, a sound effect on every cut and effect, bass drop on the payoff.
9. **Vertical**: crop to the action (follow the crosshair or player), reaction cam or a second view below.
10. **Verify**: `analyze.py` on the export, compare to the trend card if remaking a trend.
11. **Package** with `packaging.md`.

## Series ideas
Funny moments · "1 HP clutch" · "rate my build" · tier lists · "things you missed in <game>" ·
speedrun explained · "noob vs pro" · patch changes in 60 s · weekly best plays.
