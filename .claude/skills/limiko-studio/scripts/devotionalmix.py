#!/usr/bin/env python3
"""Devotional sound design for a narration: tanpura drone, soft harmony pad and temple bells, placed by the voice
cues. Everything is synthesised here (no samples, no recordings, no licences): free for commercial use.

    devotionalmix.py <voice dir with voice.wav + timeline.json> --out mix.m4a [--lufs -16] [--level 1.0]
                     [--sa 138.6] [--seed 3]

What goes where
    whole film       tanpura (Pa · Sa' · Sa' · Sa cycle, jawari buzz) + a quiet Sa–Pa pad, ducked under speech
    sNN cues         one deep temple-bell strike in the pause before each section
    bell… cues       a pooja hand-bell ringing (put {cue bell1} in the script)
    lines with గంట    a hand-bell after the line (the script mentions the bell)
    first + last     a big bell and a short flute phrase before the first word; three strikes and a closing flute phrase after
                     the last line (--no-flute: drone and bells only)
--sa sets the drone's tonic (Hz). 138.6 (C#) sits under a male voice; try 155.6 (D#) for a female voice.
Output: two-pass loudness-normalised m4a (and .mp3).
"""
import argparse, json, os, re, subprocess, sys
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
def norm(x): return x / (np.max(np.abs(x)) + 1e-9)


def lowpass(x, hz):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / hz) ** 4)
    return np.fft.irfft(X, len(x)).astype(np.float32)


def env_follow(v, win=0.25):
    k = int(win * SR); e = np.sqrt(np.convolve(v ** 2, np.ones(k) / k, mode="same"))
    return e / (e.max() + 1e-9)


def pluck(f0, r, dur=3.6):
    """One tanpura string: many harmonics, the 'jawari' buzz as a bright band that slides down the harmonics."""
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    centre = 14 - 9 * (1 - np.exp(-t * 1.2))            # buzz band moves from harmonic ~14 down to ~5
    for k in range(1, 30):
        fk = f0 * k * (1 + 0.0004 * k)                    # slight stiffness
        if fk > SR / 2.2: break
        buzz = 0.35 + np.exp(-((k - centre) / 3.0) ** 2)
        amp = buzz / k ** 0.8 * np.exp(-t * (0.5 + 0.09 * k))
        ph = r.uniform(0, 6.28)
        out += amp * (np.sin(2 * np.pi * fk * t + ph) + 0.5 * np.sin(2 * np.pi * fk * 1.0012 * t + ph))
    att = np.minimum(1, t / 0.012)
    return (out * att).astype(np.float32)


def tanpura(n, sa, r):
    strings = [sa * 0.75, sa, sa, sa / 2]                 # Pa (lower), Sa, Sa, Sa (low)
    notes = [norm(pluck(f, r)) for f in strings]
    out = np.zeros(n + 5 * SR, np.float32); t = 0.0; cycle = 3.2
    while t * SR < n:
        for i, x in enumerate(notes):
            at = t + i * cycle / 4 + r.normal(0, 0.012)
            j = int(max(0, at) * SR); k = min(len(out), j + len(x))
            if k > j: out[j:k] += x[: k - j] * (0.9 if i == 3 else 0.7)
        t += cycle
    return lowpass(norm(out[:n]), 3200) * db(-25)


def pad(n, sa, r):
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * t + r.uniform(0, 6)) * (0.75 + 0.25 * np.sin(2 * np.pi * lfo * t + r.uniform(0, 6)))
            for f, a, lfo in [(sa / 2, 1, 0.031), (sa * 0.75, 0.6, 0.043), (sa, 0.45, 0.027), (sa * 1.5, 0.15, 0.051)])
    return norm(s).astype(np.float32) * db(-33)


def temple_bell(r, f0=196.0, dur=9.0):
    """Large bronze bell: inharmonic partials (hum, prime, tierce, quint, nominal…), slow beating pairs, long decay."""
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for ratio, amp, decay in [(0.5, 0.7, 0.35), (1.0, 1.0, 0.5), (1.19, 0.55, 0.7), (1.5, 0.35, 0.9),
                              (2.0, 0.6, 0.9), (2.51, 0.3, 1.4), (2.66, 0.25, 1.5), (3.01, 0.2, 1.9), (4.1, 0.12, 2.6)]:
        f = f0 * ratio
        beat = 1 + 0.25 * np.sin(2 * np.pi * r.uniform(0.6, 2.2) * t)   # the warble of a real bell
        out += amp * beat * np.exp(-t * decay) * np.sin(2 * np.pi * f * t + r.uniform(0, 6))
    strike = r.standard_normal(int(0.03 * SR)) * np.exp(-np.arange(int(0.03 * SR)) / SR * 150)
    out[: len(strike)] += 0.3 * strike
    return norm(out).astype(np.float32) * db(-14)


def hand_bell(r, dur=2.6, f0=1180.0):
    """Pooja ghanta: a small bright bell struck repeatedly by its clapper (~7 strikes a second)."""
    n = int((dur + 2.0) * SR); out = np.zeros(n, np.float32)
    tt = np.arange(int(1.6 * SR)) / SR
    one = sum(a * np.exp(-tt * d) * np.sin(2 * np.pi * f0 * q * tt) for q, a, d in [(1, 1, 2.2), (2.76, 0.45, 4), (5.4, 0.2, 7), (1.003, 0.6, 2.4)])
    one = norm(one).astype(np.float32)
    t = 0.0
    while t < dur:
        j = int(t * SR); g = (0.55 + 0.45 * r.random()) * (1 if t < dur - 0.6 else (dur - t) / 0.6)
        out[j:j + len(one)] += one[: n - j] * g
        t += 1 / 7 + r.normal(0, 0.012)
    return norm(out) * db(-22)


SCALE = {"S": 1, "R": 9 / 8, "g": 6 / 5, "P": 3 / 2, "D": 5 / 3, "S'": 2, "D,": 5 / 6, "P,": 3 / 4}   # a calm pentatonic (S R g P D)
INTRO = [("P,", .6), ("S", 1.0), ("R", .5), ("g", 1.4), ("R", .5), ("S", 1.8)]
OUTRO = [("g", .7), ("P", .7), ("D", 1.1), ("P", .6), ("g", .6), ("R", .6), ("S", 2.6)]


def flute(phrase, sa, r):
    """Bansuri-like line: soft attack, breath noise, delayed vibrato, gliding between notes (meend)."""
    f_hi = sa * 2                                         # the flute plays an octave above the tanpura's Sa
    dur = sum(d for _, d in phrase) + 0.8; n = int(dur * SR); t = np.arange(n) / SR
    freq = np.zeros(n); amp = np.zeros(n); at = 0.0
    for note, d in phrase:
        i, j = int(at * SR), int((at + d) * SR); freq[i:j] = f_hi * SCALE[note]
        local = np.arange(j - i) / SR
        amp[i:j] = np.minimum(1, local / 0.12) * np.minimum(1, (d - local) / 0.08 + 0.35)
        at += d
    freq[int(at * SR):] = freq[int(at * SR) - 1]; amp[int(at * SR):] = np.linspace(amp[int(at * SR) - 1], 0, n - int(at * SR))
    k = int(0.06 * SR); freq = np.convolve(freq, np.ones(k) / k, "same"); freq[:k] = freq[k]; freq[-k:] = freq[-k - 1]
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t % 1.5) / 0.6, 0, 1)
    ph = 2 * np.pi * np.cumsum(freq * vib) / SR
    tone = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    breath = lowpass(r.standard_normal(n).astype(np.float32), 2500) * 0.12
    x = (tone + breath) * np.convolve(amp, np.ones(int(0.03 * SR)) / int(0.03 * SR), "same")
    return lowpass(norm(x).astype(np.float32), 4000) * db(-20)


def place(buf, clip, at):
    i = max(0, int(at * SR)); j = min(len(buf), i + len(clip))
    if j > i: buf[i:j] += clip[: j - i]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("voice_dir"); ap.add_argument("--out", required=True); ap.add_argument("--lufs", type=float, default=-16)
    ap.add_argument("--level", type=float, default=1.0, help="music level (0.7 subtle … 1.3 fuller)")
    ap.add_argument("--sa", type=float, default=138.6, help="tonic of the drone in Hz"); ap.add_argument("--seed", type=int, default=3)
    ap.add_argument("--no-flute", action="store_true", help="drone and bells only")
    a = ap.parse_args()
    vd = Path(a.voice_dir); tl = json.loads((vd / "timeline.json").read_text(encoding="utf-8"))
    v, sr = sf.read(vd / "voice.wav", dtype="float32", always_2d=True); v = v.mean(axis=1)
    if sr != SR: sys.exit(f"expected {SR} Hz voice.wav (voice.py output), got {sr}")
    lead, tail = 7.0, 12.0                                # a flute opening before the first word; flute + bells ring out at the end
    n = int(lead * SR) + len(v) + int(tail * SR); r = np.random.default_rng(a.seed)
    voice = np.zeros(n, np.float32); voice[int(lead * SR): int(lead * SR) + len(v)] = v
    cues = {k: t + lead for k, t in tl.get("cues", {}).items()}
    lines = tl.get("lines", [])
    bells = np.zeros(n, np.float32); n_big = n_hand = 0
    place(bells, temple_bell(r), 0.2); n_big += 1
    for k, t in cues.items():
        if re.fullmatch(r"s\d+", k) and t > lead + 1:
            place(bells, temple_bell(r) * 0.8, t - 1.4); n_big += 1
        elif k.startswith("bell"):
            place(bells, hand_bell(r), t); n_hand += 1
    for ln in lines:
        if "గంట" in ln.get("text", ""):
            place(bells, hand_bell(r), ln["end"] + lead + 0.1); n_hand += 1
    end = len(v) / SR + lead
    for i in range(3):
        place(bells, temple_bell(r) * (1 - 0.15 * i), end + 0.6 + 2.2 * i); n_big += 1
    music = tanpura(n, a.sa, r) + pad(n, a.sa, r)
    if not a.no_flute:
        place(music, flute(INTRO, a.sa, r), 1.0)
        place(music, flute(OUTRO, a.sa, r), end + 1.2)
    sp = env_follow(np.abs(voice)); duck = 1 - 0.5 * np.clip(sp * 3, 0, 1)
    t = np.arange(n) / SR
    fade = np.clip(t / 2.0, 0, 1) * np.clip((n / SR - t) / 4.0, 0, 1)
    bduck = 1 - 0.35 * np.clip(sp * 3, 0, 1)              # bells sit in the pauses; a little ducking if they overlap words
    mix = voice + a.level * (music * duck * fade + bells * bduck)
    mix = (mix / max(1.0, np.max(np.abs(mix)) / 0.95)).astype(np.float32)
    out = Path(a.out); tmp = out.with_suffix(".pre.wav"); sf.write(tmp, mix, SR)
    r1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(tmp), "-af", f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    d = json.loads(re.search(r"\{[^{}]*\}", r1.stderr, re.S).group(0))
    af = (f"loudnorm=I={a.lufs}:TP=-1.5:LRA=11:measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:"
          f"measured_thresh={d['input_thresh']}:offset={d['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(tmp), "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", str(out)], check=True)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(out), "-c:a", "libmp3lame", "-b:a", "192k", str(out.with_suffix(".mp3"))], check=True)
    tmp.unlink()
    r2 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "ebur128=framelog=quiet", "-f", "null", "-"], capture_output=True, text=True)
    got = re.findall(r"I:\s+(-?[\d.]+) LUFS", r2.stderr)
    print(f"✓ {out}  ({out.with_suffix('.mp3').name})  {n / SR:.1f} s · {got[-1] if got else '?'} LUFS · "
          f"{n_big} temple-bell strikes, {n_hand} hand-bells · voice starts at {lead:.1f} s (shift picture cues by this)")


if __name__ == "__main__":
    main()
