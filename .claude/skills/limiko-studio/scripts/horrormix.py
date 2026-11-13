#!/usr/bin/env python3
"""Horror / mystery sound design for a narration, placed by the voice cues. Everything is synthesised here
(no samples, no licences): drone, wind, section swells, low hits, heartbeat, door creak.

    horrormix.py <voice dir with voice.wav + timeline.json> --out mix.m4a [--lufs -16] [--level 1.0] [--seed 7]

Cues read from the script (put them in the voice script as {cue …}):
    sNN        a new section: a slow reverse swell into it
    hit…       a low impact on that line (reveals)
    beat… / beatend…   a slow heartbeat between the two cues (tension)
    creak…     a door creak
    calm…      effects fade out from here (closing message, helplines)
The voice gets a light room echo; the bed ducks under speech. Output: two-pass loudness-normalised m4a (and .mp3).
Taste rule: atmosphere, not mockery — real-tragedy stories get restrained levels (--level 0.7–1.0).
"""
import argparse, json, os, subprocess, sys
from pathlib import Path

CACHE = Path(os.environ.get("LIMIKO_VOICE_CACHE", Path.home() / ".cache" / "limiko-voice"))
VENV = CACHE / "venv" / "bin" / "python"
try:
    import numpy as np, soundfile as sf
except ImportError:
    if VENV.exists() and Path(sys.prefix).resolve() != (CACHE / "venv").resolve():
        os.execv(str(VENV), [str(VENV), *sys.argv])
    sys.exit("needs numpy + soundfile: run scripts/voice-setup.sh")

SR = 24000


def db(x): return 10 ** (x / 20)


def band(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x)).astype(np.float32)


def norm(x): return x / (np.max(np.abs(x)) + 1e-9)


def env_follow(v, win=0.25):
    k = int(win * SR); e = np.sqrt(np.convolve(v ** 2, np.ones(k) / k, mode="same"))
    return e / (e.max() + 1e-9)


def drone(n, r):
    t = np.arange(n) / SR
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.05 * t + r.uniform(0, 6))
    s = sum(np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * a for f, a in [(55, 1), (55.6, 0.8), (82.4, 0.35), (110.3, 0.15)])
    brown = np.cumsum(r.standard_normal(n)).astype(np.float32); brown = band(brown - np.convolve(brown, np.ones(SR) / SR, "same"), 30, 220)
    return norm(s * lfo + 0.6 * norm(brown)) * db(-30)


def wind(n, r):
    w = band(r.standard_normal(n).astype(np.float32), 250, 1400)
    t = np.arange(n) / SR
    gust = 0.35 + 0.65 * np.clip(np.sin(2 * np.pi * 0.031 * t) * 0.5 + np.sin(2 * np.pi * 0.077 * t + 1) * 0.5, 0, 1)
    return norm(w) * gust * db(-36)


def swell(r, dur=1.8):
    n = int(dur * SR); x = band(r.standard_normal(n).astype(np.float32), 200, 4000)
    e = np.linspace(0, 1, n) ** 3
    return norm(x * e) * db(-26)


def hit(r, dur=3.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 38 + 30 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    thud = band(r.standard_normal(n).astype(np.float32), 40, 400) * np.exp(-t * 18)
    return norm(boom + 0.5 * norm(thud)) * db(-12)


def heartbeat(dur, bpm=62):
    n = int(dur * SR); out = np.zeros(n, np.float32); period = 60 / bpm
    beat_t = np.arange(int(0.18 * SR)) / SR
    pulse = (np.sin(2 * np.pi * 48 * beat_t) * np.exp(-beat_t * 28)).astype(np.float32)
    t0 = 0.0
    while t0 < dur - 0.4:
        for off, g in ((0, 1.0), (0.24, 0.7)):
            i = int((t0 + off) * SR); j = min(n, i + len(pulse)); out[i:j] += pulse[: j - i] * g
        t0 += period
    fade = np.minimum(1, np.minimum(np.arange(n) / (1.5 * SR), (n - np.arange(n)) / (1.0 * SR)))
    return out * fade * db(-16)


def creak(r, dur=1.4):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 260 + 140 * np.sin(2 * np.pi * 0.6 * t) + 25 * r.standard_normal(n).cumsum() / np.sqrt(n)
    ph = np.cumsum(f) / SR
    saw = 2 * (ph % 1) - 1
    stick = (np.sin(2 * np.pi * 23 * t) > 0.2).astype(np.float32) * 0.6 + 0.4   # stick-slip roughness
    x = band((saw * stick).astype(np.float32), 300, 3000)
    e = np.sin(np.pi * np.minimum(1, t / dur)) ** 0.7
    return norm(x * e) * db(-24)


def place(buf, clip, at):
    i = max(0, int(at * SR)); j = min(len(buf), i + len(clip))
    if j > i: buf[i:j] += clip[: j - i]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("voice_dir"); ap.add_argument("--out", required=True); ap.add_argument("--lufs", type=float, default=-16)
    ap.add_argument("--level", type=float, default=1.0, help="effects level (0.7 restrained … 1.2 strong)"); ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    vd = Path(a.voice_dir); tl = json.loads((vd / "timeline.json").read_text(encoding="utf-8"))
    v, sr = sf.read(vd / "voice.wav", dtype="float32", always_2d=True); v = v.mean(axis=1)
    if sr != SR:
        sys.exit(f"expected {SR} Hz voice.wav (voice.py output), got {sr}")
    tail = 4.0; n = len(v) + int(tail * SR); r = np.random.default_rng(a.seed)
    voice = np.zeros(n, np.float32); voice[: len(v)] = v
    # light room echo on the voice (distance, unease) — subtle so every word stays clear
    for d, g in ((0.055, 0.22), (0.13, 0.12), (0.27, 0.06)):
        k = int(d * SR); voice[k:] += np.concatenate([v, np.zeros(n - len(v), np.float32)])[: n - k] * g
    cues = tl.get("cues", {})
    calm_at = min([t for k, t in cues.items() if k.startswith("calm")] or [n / SR])
    bed = drone(n, r) + wind(n, r)
    fx = np.zeros(n, np.float32)
    for k, t in cues.items():
        if k.startswith("s") and k[1:].isdigit() and t > 0.5 and t < calm_at: place(fx, swell(r), t - 1.8)
        elif k.startswith("hit") and t < calm_at: place(fx, hit(r), t - 0.05)
        elif k.startswith("creak") and t < calm_at: place(fx, creak(r), t - 0.2)
    starts = sorted(t for k, t in cues.items() if k.startswith("beat") and not k.startswith("beatend"))
    ends = sorted(t for k, t in cues.items() if k.startswith("beatend"))
    for s in starts:
        e = next((x for x in ends if x > s), s + 8)
        place(fx, heartbeat(e - s + 0.8), s)
    # bed ducks under speech; everything fades out at the calm cue (closing message stays clean)
    sp = env_follow(np.abs(voice)); duck = 1 - 0.6 * np.clip(sp * 3, 0, 1)
    t = np.arange(n) / SR
    calm = np.clip(1 - (t - calm_at) / 4.0, 0.12, 1)      # a faint bed remains under the ending
    intro = np.clip(t / 2.0, 0, 1)
    mix = voice + a.level * (bed * duck * intro * calm + fx * np.where(t < calm_at, 1, 0))
    mix = (mix / max(1.0, np.max(np.abs(mix)) / 0.95)).astype(np.float32)
    out = Path(a.out); tmp = out.with_suffix(".pre.wav"); sf.write(tmp, mix, SR)
    # two-pass loudness
    r1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(tmp), "-af", f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    import re
    d = json.loads(re.search(r"\{[^{}]*\}", r1.stderr, re.S).group(0))
    af = (f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:"
          f"measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(out)], check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(out), "-c:a", "libmp3lame", "-b:a", "192k", str(out.with_suffix(".mp3"))], check=True)
    tmp.unlink()
    r2 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    got = re.findall(r"I:\s+(-?[\d.]+) LUFS", r2.stderr)
    n_hits = sum(k.startswith("hit") for k in cues); n_sec = sum(k.startswith("s") and k[1:].isdigit() for k in cues)
    print(f"✓ {out}  ({out.with_suffix('.mp3').name})  {len(mix) / SR:.1f} s · {got[-1] if got else '?'} LUFS · {n_sec} swells, {n_hits} hits, {len(starts)} heartbeat runs")


if __name__ == "__main__":
    main()
