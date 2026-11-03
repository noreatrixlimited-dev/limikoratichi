#!/usr/bin/env python3
"""Measure how a video is edited, so its editing style can be rebuilt with new content.

Usage:
    python3 analyze.py <video> [--out DIR] [--threshold 0.30]

Writes to DIR (default films/_refs/<video-name>/):
    analysis.json   numbers: cuts, shot lengths, pacing curve, hook, motion, audio, beat, colour
    shots.jpg       one frame from the middle of every shot, with time stamps
    hook.jpg        the first 3 seconds at 4 frames per second
    recipe.md       an edit recipe pre-filled with the measurements, to finish by eye

Needs only ffmpeg/ffprobe, numpy and Pillow.
"""
import argparse, json, math, re, subprocess, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def run(cmd, binary=False):
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd[:4])} …\n{r.stderr.decode(errors='ignore')[-800:]}")
    return r.stdout if binary else r.stdout.decode(errors="ignore") + r.stderr.decode(errors="ignore")


def probe(path):
    out = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path])
    info = json.loads(out[out.index("{"):])
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    if v is None:
        sys.exit("no video stream found")
    num, den = (v.get("avg_frame_rate") or "0/1").split("/")
    fps = float(num) / float(den) if float(den) else 0.0
    w, h = int(v["width"]), int(v["height"])
    return {
        "duration": float(info["format"].get("duration", v.get("duration", 0))),
        "width": w, "height": h, "fps": round(fps, 3),
        "orientation": "vertical" if h > w else "horizontal" if w > h else "square",
        "has_audio": a is not None,
    }


def detect_cuts(path, threshold):
    out = run(["ffmpeg", "-hide_banner", "-i", path, "-an", "-filter:v",
               f"select='gt(scene,{threshold})',showinfo", "-f", "null", "-"])
    return sorted({round(float(t), 3) for t in re.findall(r"pts_time:([0-9.]+)", out)})


def gray_frames(path, fps, size=64):
    raw = run(["ffmpeg", "-v", "error", "-i", path, "-vf",
               f"fps={fps},scale={size}:{size},format=gray", "-f", "rawvideo", "-"], binary=True)
    n = len(raw) // (size * size)
    return np.frombuffer(raw[: n * size * size], np.uint8).reshape(n, size, size).astype(np.float32)


def motion_curve(path, fps=4):
    f = gray_frames(path, fps)
    if len(f) < 2:
        return [], 0.0
    diff = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2)) / 255.0
    return [round(float(x), 4) for x in diff], float(diff.mean())


def frame_at(path, t, width):
    raw = run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1",
               "-vf", f"scale={width}:-2", "-f", "image2pipe", "-vcodec", "png", "-"], binary=True)
    from io import BytesIO
    return Image.open(BytesIO(raw)).convert("RGB")


def colour_stats(img):
    hsv = np.asarray(img.convert("HSV"), np.float32) / 255.0
    rgb = img.resize((48, 48)).quantize(colors=5, method=Image.Quantize.MEDIANCUT)
    pal = rgb.getpalette()[:15]
    counts = sorted(rgb.getcolors(), reverse=True)
    palette = ["#%02x%02x%02x" % tuple(pal[i * 3:i * 3 + 3]) for _, i in counts if i < 5]
    return {"brightness": round(float(hsv[..., 2].mean()), 3),
            "saturation": round(float(hsv[..., 1].mean()), 3), "palette": palette}


def lower_third_text_score(img):
    """Rough caption detector: how much busier the caption band is than the top of the frame.

    Burned-in captions put many sharp light/dark edges in a band at 55-85% height.
    Returns band edge density divided by top-third edge density (higher = more likely text).
    """
    g = np.asarray(img.convert("L"), np.float32)
    h = g.shape[0]

    def density(part):
        return float((np.abs(np.diff(part, axis=1)) > 60).mean())

    band = density(g[int(h * 0.55): int(h * 0.85)])
    top = density(g[: int(h * 0.33)])
    return round(band / (top + 0.002), 3) if band > 0.003 else 0.0


def audio_analysis(path, duration):
    raw = run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000",
               "-f", "s16le", "-"], binary=True)
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    if x.size < 16000:
        return None
    hop = 800  # 50 ms
    n = x.size // hop
    rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    quiet = float((db < db.max() - 35).mean())

    # tempo from onset strength autocorrelation (10 ms hops)
    hop2 = 160
    m = x.size // hop2
    env = np.sqrt((x[: m * hop2].reshape(m, hop2) ** 2).mean(axis=1))
    onset = np.maximum(np.diff(np.log(env + 1e-6)), 0)
    onset -= onset.mean()
    ac = np.correlate(onset, onset, "full")[len(onset) - 1:]
    lo, hi = int(100 * 60 / 180), int(100 * 60 / 70)  # 70–180 bpm
    bpm, conf = None, 0.0
    if len(ac) > hi:
        lag = lo + int(np.argmax(ac[lo:hi]))
        conf = float(ac[lag] / (ac[0] + 1e-9))
        bpm = round(6000 / lag, 1) if conf >= 0.1 else None  # weak pulse: no tempo claim

    lufs = None
    out = run(["ffmpeg", "-hide_banner", "-i", path, "-vn", "-af", "ebur128", "-f", "null", "-"])
    mm = re.findall(r"I:\s+(-?[0-9.]+) LUFS", out)
    if mm:
        lufs = float(mm[-1])
    first3 = db[: min(60, len(db))]
    return {
        "integrated_lufs": lufs,
        "quiet_ratio": round(quiet, 3),
        "tempo_bpm": bpm, "tempo_confidence": round(conf, 3),
        "hook_audio_peak_db": round(float(first3.max()), 1) if first3.size else None,
        "loudness_curve_db_per_sec": [round(float(db[i: i + 20].mean()), 1) for i in range(0, len(db), 20)],
    }


def sheet(images, labels, cols, path):
    w, h = images[0].size
    rows = math.ceil(len(images) / cols)
    out = Image.new("RGB", (cols * w, rows * (h + 22)), "white")
    d = ImageDraw.Draw(out)
    for i, (im, lab) in enumerate(zip(images, labels)):
        x, y = (i % cols) * w, (i // cols) * (h + 22)
        out.paste(im, (x, y + 22))
        d.text((x + 4, y + 4), lab, fill="black")
    out.save(path, quality=85)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out")
    ap.add_argument("--threshold", type=float, default=0.30,
                    help="scene-change sensitivity, lower finds more cuts (0.2–0.4)")
    ap.add_argument("--max-shots", type=int, default=60)
    a = ap.parse_args()

    src = Path(a.video)
    if not src.exists():
        sys.exit(f"not found: {src}")
    out = Path(a.out or f"films/_refs/{src.stem}")
    out.mkdir(parents=True, exist_ok=True)

    meta = probe(str(src))
    dur = meta["duration"]
    cuts = [c for c in detect_cuts(str(src), a.threshold) if 0.05 < c < dur - 0.05]
    bounds = [0.0] + cuts + [dur]
    shots = [{"start": round(s, 3), "end": round(e, 3), "len": round(e - s, 3)}
             for s, e in zip(bounds, bounds[1:]) if e - s > 0.04]
    lens = np.array([s["len"] for s in shots])

    pacing = [sum(1 for c in cuts if i <= c < i + 5) for i in range(0, int(math.ceil(dur)), 5)]
    curve, motion_mean = motion_curve(str(src))

    # per-shot frames: colour, caption score
    thumb_w = 240 if meta["orientation"] != "vertical" else 160
    step = max(1, math.ceil(len(shots) / a.max_shots))
    imgs, labels = [], []
    for i, s in enumerate(shots):
        mid = (s["start"] + s["end"]) / 2
        im = frame_at(str(src), mid, 360)
        s.update(colour_stats(im))
        s["caption_score"] = lower_third_text_score(im)
        if i % step == 0:
            imgs.append(im.resize((thumb_w, int(im.height * thumb_w / im.width))))
            labels.append(f"#{i + 1} · {s['start']:.1f}s ({s['len']:.1f}s)")
    if imgs:
        sheet(imgs, labels, 6, out / "shots.jpg")

    hook_imgs, hook_labels = [], []
    for k in range(int(min(3.0, dur) * 4)):
        t = k / 4
        im = frame_at(str(src), t, thumb_w)
        hook_imgs.append(im)
        hook_labels.append(f"{t:.2f}s")
    if hook_imgs:
        sheet(hook_imgs, hook_labels, 6, out / "hook.jpg")

    audio = audio_analysis(str(src), dur) if meta["has_audio"] else None

    beat_sync = None
    if audio and audio["tempo_bpm"] and cuts:
        period = 60 / audio["tempo_bpm"]
        phase = [((c / period) % 1) for c in cuts]
        near = [min(p, 1 - p) for p in phase]
        beat_sync = round(float(np.mean([n < 0.15 for n in near])), 3)

    caption_scores = [s["caption_score"] for s in shots]
    summary = {
        "shots": len(shots),
        "cuts_per_minute": round(len(cuts) / dur * 60, 1) if dur else 0,
        "shot_len_mean": round(float(lens.mean()), 2) if lens.size else None,
        "shot_len_median": round(float(np.median(lens)), 2) if lens.size else None,
        "shot_len_min": round(float(lens.min()), 2) if lens.size else None,
        "shot_len_max": round(float(lens.max()), 2) if lens.size else None,
        "cuts_in_first_3s": sum(1 for c in cuts if c < 3),
        "first_shot_len": shots[0]["len"] if shots else None,
        "cuts_per_5s": pacing,
        "motion_mean": round(motion_mean, 4),
        "motion_level": "high" if motion_mean > 0.08 else "medium" if motion_mean > 0.03 else "low",
        "cuts_on_beat_ratio": beat_sync,
        "likely_burned_captions": bool(caption_scores and np.median(caption_scores) > 2.0),
        "avg_brightness": round(float(np.mean([s["brightness"] for s in shots])), 3) if shots else None,
        "avg_saturation": round(float(np.mean([s["saturation"] for s in shots])), 3) if shots else None,
    }
    report = {"source": str(src), "meta": meta, "summary": summary, "audio": audio,
              "motion_curve_4fps": curve, "shot_list": shots}
    (out / "analysis.json").write_text(json.dumps(report, indent=2))
    (out / "recipe.md").write_text(recipe(report))
    print(json.dumps({"out": str(out), "meta": meta, "summary": summary,
                      "audio": {k: v for k, v in (audio or {}).items() if k != "loudness_curve_db_per_sec"}},
                     indent=2))


def recipe(r):
    s, m, au = r["summary"], r["meta"], r["audio"] or {}
    return f"""# Edit recipe: {Path(r['source']).stem}

Measured by analyze.py. Lines marked ✍️ are filled by looking at shots.jpg and hook.jpg.

## Format
- {m['width']}×{m['height']} ({m['orientation']}), {m['fps']} fps, {m['duration']:.1f} s

## Pacing
- {s['shots']} shots, {s['cuts_per_minute']} cuts/min
- shot length: median {s['shot_len_median']} s, range {s['shot_len_min']}–{s['shot_len_max']} s
- cuts per 5 s across the video: {s['cuts_per_5s']}
- ✍️ rhythm pattern (e.g. fast open, slower middle, rapid build before payoff):

## Hook (first 3 s)
- first shot lasts {s['first_shot_len']} s, {s['cuts_in_first_3s']} cuts in the first 3 s
- audio peak in hook: {au.get('hook_audio_peak_db')} dBFS
- ✍️ hook type (question / shocking claim / result first / pattern break / POV / countdown):
- ✍️ on-screen hook text and its position:

## Camera and motion
- motion level: {s['motion_level']} (mean frame change {s['motion_mean']})
- ✍️ zoom punch-ins / pans / shake / speed ramps:
- ✍️ transitions (hard cut, whip, zoom, match cut, flash, glitch):

## Text and captions
- burned-in captions likely: {s['likely_burned_captions']}
- ✍️ caption style (font weight, case, colour, highlight word, words per line, position, pop animation):
- ✍️ other graphics (emoji, arrows, progress bar, stickers, lower thirds):

## Sound
- loudness {au.get('integrated_lufs')} LUFS integrated, quiet ratio {au.get('quiet_ratio')}
- tempo ≈ {au.get('tempo_bpm')} bpm (confidence {au.get('tempo_confidence')}), cuts on the beat: {s['cuts_on_beat_ratio']}
- ✍️ voice style (energy, speed, who speaks), music genre, sound effects on cuts (whoosh, pop, riser):

## Look
- brightness {s['avg_brightness']}, saturation {s['avg_saturation']}
- ✍️ colour grade and palette, framing (face size, centre vs thirds), b-roll vs talking ratio:

## Structure
- ✍️ beat map: hook → setup → beats → payoff → CTA, with times:
- ✍️ loop / rewatch trick (ending flows into the start?):

## Rebuild plan (our content, same grammar)
- ✍️ style id from styles/README.md (or "real footage"):
- ✍️ shot list with the same lengths as the shot_list in analysis.json:
- ✍️ what we keep: pacing, caption treatment, transition types, sound-effect pattern
- ✍️ what we never take: their footage, music, voice, exact words, logos
"""


if __name__ == "__main__":
    main()
