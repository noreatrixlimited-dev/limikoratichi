# Editing real footage (Route C)

Engines: `C-ffmpeg` (local tool set), `C-subs` / `C-smartsub` (captions). See REFERENCES.txt.
Everything below works with plain ffmpeg too.

## Procedure
1. **Probe**: `ffprobe -v error -show_streams -of json in.mp4`: size, fps, rotation, audio.
2. **Transcribe** (if speech): Whisper → `words.json` with word times. Use it to cut and caption.
3. **Rough cut**: remove silences > 0.4 s and retakes.
   `ffmpeg -i in.mp4 -af silencedetect=noise=-35dB:d=0.4 -f null -` → cut list.
4. **Structure**: reorder to hook → setup → beats → payoff. The best moment often moves to the front.
5. **Reframe** for vertical: `crop=ih*9/16:ih` centred on the subject (track the face per shot if it moves).
6. **Pace**: apply the trend card if there is one (`remake-a-trend.md`); otherwise Shorts median shot 1.5–2.5 s.
7. **Emphasis**: punch-in 110–120% on stressed words (`zoompan` or scale+crop keyframes), with a sound effect.
8. **Captions**: word groups of 2–4, burned in with `subtitles=` (ASS file for styling), key word in accent colour.
9. **Sound**: voice clean-up `highpass=f=80,afftdn,acompressor`, music ducked under voice, sound effects on cuts.
10. **Grade**: `eq=contrast=1.05:saturation=1.1` as a baseline; match shots to each other first.
11. **Export**: H.264 High, yuv420p, CRF 18, AAC 192k, `-movflags +faststart`, −14 LUFS.
12. **Verify**: run `scripts/analyze.py` on the export; watch the first 3 s muted.

## Moving camera on footage
Real footage keeps a **virtual camera** in every shot (moving-camera rule, `directing.md` §0): slow drift + breathing
zoom at minimum, eased push-ins towards the subject on key moments. For gameplay use `../scripts/gameedit.py`, which does this.

## Handy filters
| Need | ffmpeg |
|---|---|
| Speed ramp | `setpts=0.5*PTS` + `atempo=2.0` |
| Freeze frame | `tpad=stop_mode=clone:stop_duration=0.5` |
| Flash transition | overlay white `color` with `fade=in` / `fade=out` 3 frames |
| Shake | `crop=iw-20:ih-20:10+5*sin(n*1.7):10+5*cos(n*2.3)` |
| Blur background fill for vertical | split → scale+boxblur background, overlay sharp centre |
| Progress bar | `drawbox=w=iw*t/DUR:h=12:y=ih-12:color=white@0.9:t=fill` |
