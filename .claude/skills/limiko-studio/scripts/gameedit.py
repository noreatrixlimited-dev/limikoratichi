#!/usr/bin/env python3
"""Gaming edit from an edit list (EDL). Runs in ~/.cache/limiko-voice/venv-vision (scripts/vision-setup.sh).

    gameedit.py scan <video> --a A --b B [--out DIR]
        1 frame per second grid (scan.jpg) + loudness peaks (scan.json): find fights and kill moments.
    gameedit.py badges <video> --t T1,T2,… [--out DIR]
        4 frames/s strips of the top-centre HUD around each time: pin the exact moment each kill badge appears.
    gameedit.py render <edit.json> [--preview]
        Render the edit. --preview = 640 px wide, fast, for checking timing.

Edit list (paths relative to the json file):
{
  "source": "raw.mp4",
  "out": "out/highlight.mp4",
  "aspect": "16:9",                       # "16:9" or "9:16" (vertical: big 4:3 gameplay band on blurred fill)
  "full_highlights": true,                # true = the whole video is highlights → no hook
  "hook": {"a": 58.15, "b": 59.45, "punch": 58.42},   # only used when full_highlights is false
  "glow": {"color": "#3fe8ff", "anchor": [0.46, 0.65]},  # player character glow; omit anchor → identify (may ask)
  "transition": "glow-zoom",              # between highlights: "glow-zoom" | "whip" | "flash" | "cut"
  "highlights": [
    {"a": 29.6, "b": 42.2, "events": [{"t": 31.05}, {"t": 40.85, "big": true}]},
    {"a": 45.4, "b": 49.0, "speed": 1.5},
    {"a": 49.0, "b": 60.4, "events": [{"t": 52.55, "big": true}, {"t": 58.42, "big": true}],
     "slowmo": {"a": 57.6, "b": 58.9}}
  ],
  "outro": {"a": 61.6, "b": 64.6},        # optional (victory screen), fades out
  "loudness": -12
}
Camera: every shot moves (slow drift + breathing zoom); around each event the camera eases in towards the
player, punches on the hit and eases back out. Effects never cover the player (zoom centres on the glow anchor).
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
SR, FPS = 48000, 60
VENV_VISION = Path.home() / ".cache" / "limiko-voice" / "venv-vision" / "bin" / "python"


# ------------------------------------------------------------------ helpers
def probe(video):
    s = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", video], capture_output=True, text=True, check=True).stdout.strip()
    return tuple(map(int, s.split(",")[:2]))


def hex_bgr(h):
    h = h.lstrip("#"); return np.array([int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16)], np.float32)


def ease(x):
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)


# ------------------------------------------------------------------ scan / badges
def cmd_scan(a):
    import cv2
    out = Path(a.out or Path(a.video).with_suffix("").as_posix() + "_scan"); out.mkdir(parents=True, exist_ok=True)
    w, h = probe(a.video)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.a), "-i", a.video, "-t", str(a.b - a.a), "-vf", "fps=1,scale=400:-2",
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
    th = int(round(400 * h / w / 2) * 2); n = len(raw) // (400 * th * 3)
    tiles = []
    for i in range(n):
        im = np.frombuffer(raw[i * 400 * th * 3:(i + 1) * 400 * th * 3], np.uint8).reshape(th, 400, 3).copy()
        cv2.putText(im, f"{a.a + i:.0f}s", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
        cv2.putText(im, f"{a.a + i:.0f}s", (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        tiles.append(im)
    while len(tiles) % 6:
        tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(str(out / "scan.jpg"), np.vstack([np.hstack(tiles[i:i + 6]) for i in range(0, len(tiles), 6)]))
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a.a), "-i", a.video, "-t", str(a.b - a.a), "-ac", "1", "-ar", "8000",
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    sec = [float(20 * np.log10(np.sqrt(np.mean(x[i * 8000:(i + 1) * 8000] ** 2)) + 1e-9)) for i in range(len(x) // 8000)]
    peaks = [round(a.a + i, 1) for i in range(1, len(sec) - 1) if sec[i] > max(sec) - 8 and sec[i] >= sec[i - 1] and sec[i] >= sec[i + 1]]
    (out / "scan.json").write_text(json.dumps({"loudness_db_per_sec": [round(v, 1) for v in sec], "loud_peaks": peaks}, indent=1))
    print(f"✓ {out}/scan.jpg ({n} frames) · loud peaks: {peaks}")


def cmd_badges(a):
    import cv2
    out = Path(a.out or Path(a.video).with_suffix("").as_posix() + "_badges"); out.mkdir(parents=True, exist_ok=True)
    w, h = probe(a.video)
    cw, ch = int(w * 0.33), int(h * 0.27); cx = (w - cw) // 2
    rows = []
    for t in [float(x) for x in a.t.split(",")]:
        s = max(0, t - 1.0)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s), "-i", a.video, "-t", "2.0", "-vf", f"fps=4,crop={cw}:{ch}:{cx}:0",
                              "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
        n = len(raw) // (cw * ch * 3); tiles = []
        for i in range(n):
            im = np.frombuffer(raw[i * cw * ch * 3:(i + 1) * cw * ch * 3], np.uint8).reshape(ch, cw, 3).copy()
            cv2.putText(im, f"{s + i / 4:.2f}", (4, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            tiles.append(im)
        rows.append(np.hstack(tiles[:8] + [np.zeros_like(tiles[0])] * (8 - len(tiles[:8]))))
    cv2.imwrite(str(out / "badges.jpg"), np.vstack(rows))
    print(f"✓ {out}/badges.jpg (rows = the times given, 4 frames/s from t−1 s)")


# ------------------------------------------------------------------ plan
def build_pieces(E):
    """Ordered pieces: (kind, a, b, speed, highlight index, events)."""
    pieces = []
    if not E.get("full_highlights", True) and E.get("hook"):
        hk = E["hook"]; pieces.append(dict(kind="hook", a=hk["a"], b=hk["b"], speed=1.0, hi=-1,
                                           events=[{"t": hk.get("punch", (hk["a"] + hk["b"]) / 2), "big": True}]))
    for i, H in enumerate(E["highlights"]):
        sp = H.get("speed", 1.0); ev = H.get("events", []); sm = H.get("slowmo")
        if sm:
            cuts = [(H["a"], sm["a"], sp), (sm["a"], sm["b"], 0.5), (sm["b"], H["b"], sp)]
        else:
            cuts = [(H["a"], H["b"], sp)]
        for (x, y, s) in cuts:
            if y - x > 0.05:
                pieces.append(dict(kind="hl", a=x, b=y, speed=s, hi=i, events=[e for e in ev if x - 1.2 <= e["t"] <= y + 0.3]))
    if E.get("outro"):
        o = E["outro"]; pieces.append(dict(kind="outro", a=o["a"], b=o["b"], speed=1.0, hi=len(E["highlights"]), events=[]))
    # transitions after each highlight (and after the hook)
    for k in range(len(pieces) - 1):
        if pieces[k]["hi"] != pieces[k + 1]["hi"]:
            pieces[k]["trans_out"] = True; pieces[k + 1]["trans_in"] = True
    t = 0.0
    for p in pieces:
        p["dur"] = (p["b"] - p["a"]) / p["speed"]; p["out_start"] = t; t += p["dur"]
    return pieces, t


# ------------------------------------------------------------------ camera, glow, transitions
def camera_at(T, src_t, events, trans_in, trans_out, local_out_t, dur):
    """Zoom and pan for one output frame. T = film time (for drift), src_t = source time (for events)."""
    z = 1.04 + 0.025 * np.sin(2 * np.pi * T / 7.0)                     # always-moving camera: breathing zoom
    px = 0.012 * np.sin(2 * np.pi * T / 9.0)                             # and slow drift
    py = 0.008 * np.sin(2 * np.pi * T / 11.0 + 1.0)
    flash = 0.0; shake = (0.0, 0.0); boost = 0.0
    for e in events:
        d = src_t - e["t"]; big = e.get("big", False)
        zin = ease((d + 0.9) / 0.8) if d < 0 else 1.0                    # ease in over 0.8 s before the hit
        zout = 1 - ease((d - 0.15) / 0.9) if d > 0.15 else 1.0           # hold, then ease out over 0.9 s
        z += (0.16 if big else 0.10) * min(zin, zout)
        if d >= 0:
            z += (0.12 if big else 0.07) * min(1, d / 0.05) * np.exp(-d * 7)        # punch
            if big:
                s = 9 * np.exp(-d * 9); shake = (s * np.sin(d * 95), s * 0.7 * np.cos(d * 83))
                flash = max(flash, 0.35 * np.exp(-d * 16))
            boost = max(boost, np.exp(-d * 3))
    if trans_in and local_out_t < 0.3:
        k = 1 - local_out_t / 0.3; z += 0.35 * k * k; flash = max(flash, 0.55 * k)
    if trans_out and dur - local_out_t < 0.3:
        k = 1 - (dur - local_out_t) / 0.3; z += 0.30 * k * k; flash = max(flash, 0.45 * k)
    return z, px, py, shake, flash, boost


def glow_layer(frame, mask, color, strength):
    """Aura around the character: outside the body only, plus a thin bright rim. The character stays untouched."""
    import cv2
    m = np.clip(mask.astype(np.float32) / 255.0, 0, 1)
    body = cv2.GaussianBlur(m, (0, 0), 1.2)
    aura = cv2.GaussianBlur(cv2.dilate(m, np.ones((5, 5), np.uint8), iterations=2), (0, 0), 7)
    rim = np.clip(cv2.dilate(m, np.ones((3, 3), np.uint8)) - cv2.erode(m, np.ones((3, 3), np.uint8)), 0, 1)
    g = np.clip(aura * (1 - body) * 0.85 + rim * (1 - body * 0.6) * 0.7, 0, 1) * min(1.0, strength)
    return np.clip(frame.astype(np.float32) + g[..., None] * color[None, None, :] * 0.9, 0, 255)


class MaskTrack:
    def __init__(self, path, src_w, src_h):
        d = np.load(path); self.t = d["times"]; self.m = d["masks"]; self.w, self.h = src_w, src_h

    def at(self, t):
        import cv2
        i = int(np.searchsorted(self.t, t)); i0, i1 = max(0, i - 1), min(len(self.t) - 1, i)
        if i0 == i1 or self.t[i1] == self.t[i0]:
            m = self.m[i0]
        else:
            u = (t - self.t[i0]) / (self.t[i1] - self.t[i0]); m = (self.m[i0] * (1 - u) + self.m[i1] * u)
        return cv2.resize(m.astype(np.float32), (self.w, self.h), interpolation=cv2.INTER_LINEAR)


# ------------------------------------------------------------------ render
def render_piece(E, p, idx, src, work, out_w, out_h, glowcfg, track, anchor, preview):
    import cv2
    w, h = probe(src)
    vf = []
    if p["speed"] < 1:
        vf.append(f"minterpolate=fps={int(round(FPS / p['speed']))}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1")
    vf.append(f"setpts=PTS/{p['speed']}")
    vf.append(f"fps={FPS}")
    dec = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{p['a']:.3f}", "-to", f"{p['b']:.3f}", "-i", src, "-vf", ",".join(vf),
                            "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    vpath = work / f"p{idx:02d}.mkv"
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{out_w}x{out_h}", "-r", str(FPS),
                            "-i", "-", "-c:v", "libx264", "-preset", "veryfast" if preview else "medium", "-crf", "24" if preview else "17",
                            "-pix_fmt", "yuv420p", str(vpath)], stdin=subprocess.PIPE)
    color = hex_bgr(glowcfg.get("color", "#3fe8ff")) if glowcfg else None
    ax, ay = anchor
    vertical = E.get("aspect", "16:9") == "9:16"
    # base crop of the source: 16:9 → centred 16:9 window; 9:16 → centred 4:3 band
    cw = min(w, int(h * (4 / 3 if vertical else 16 / 9))); ch = h
    band_w, band_h = (out_w, int(out_w * 3 / 4)) if vertical else (out_w, out_h)
    nfr = int(round(p["dur"] * FPS)); k = 0
    while k < nfr:
        buf = dec.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        f = np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.float32)
        lt = k / FPS; src_t = p["a"] + lt * p["speed"]; T = p["out_start"] + lt
        z, px, py, (sx, sy), flash, boost = camera_at(T, src_t, p["events"], p.get("trans_in"), p.get("trans_out"), lt, p["dur"])
        if track is not None and p["kind"] != "outro":
            f = glow_layer(f, track.at(src_t), color, 0.6 + 0.4 * boost)
        # zoom about the player (anchor), within the base crop
        cx0 = (w - cw) / 2
        zx = cx0 + (ax * w - cx0) * 0.6 + cw / 2 * 0.4  # bias the zoom centre towards the player
        zy = ay * h * 0.6 + h / 2 * 0.4
        win_w, win_h = cw / z, ch / z
        x0 = np.clip(zx - win_w / 2 + px * cw + sx, cx0, cx0 + cw - win_w); y0 = np.clip(zy - win_h / 2 + py * ch + sy, 0, ch - win_h)
        M = np.array([[band_w / win_w, 0, -x0 * band_w / win_w], [0, band_h / win_h, -y0 * band_h / win_h]], np.float32)
        band = cv2.warpAffine(f, M, (band_w, band_h), flags=cv2.INTER_LINEAR)
        if flash > 0:
            bloom = cv2.GaussianBlur(band, (0, 0), 14)
            band = np.clip(band + flash * 255 * 0.6 + bloom * flash * 0.5, 0, 255)
        band = np.clip((band - 128) * 1.06 + 128, 0, 255)
        if vertical:
            bg = cv2.resize(f, (int(out_h * w / h), out_h)); bx = (bg.shape[1] - out_w) // 2
            bg = cv2.GaussianBlur(bg[:, bx:bx + out_w], (0, 0), 25) * 0.62
            y = (out_h - band_h) // 2; bg[y:y + band_h] = band; frame = bg
        else:
            frame = band
        if p["kind"] == "outro" and p["dur"] - lt < 0.7:
            frame = frame * ((p["dur"] - lt) / 0.7)
        enc.stdin.write(np.clip(frame, 0, 255).astype(np.uint8).tobytes()); k += 1
    dec.kill(); dec.wait(); dec.stdout.close(); enc.stdin.close(); enc.wait()
    # audio for the piece
    af = ["pan=stereo|c0=c0|c1=c0"] if E.get("_mono") else ["aresample=48000"]
    if p["speed"] == 0.5:
        af += ["asetrate=24000", "aresample=48000", "lowpass=f=3500", "volume=1.6"]
    elif p["speed"] != 1:
        af.append(f"atempo={p['speed']}")
    if p["kind"] == "outro":
        af.append(f"afade=t=out:st={max(0, p['dur'] - 0.7):.3f}:d=0.7")
    apath = work / f"p{idx:02d}.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{p['a']:.3f}", "-to", f"{p['b']:.3f}", "-i", src, "-vn", "-af", ",".join(af),
                    "-ac", "2", "-ar", str(SR), "-t", f"{p['dur']:.3f}", str(apath)], check=True)
    return vpath, apath, k


def sfx_track(pieces, total, path):
    import soundfile as sf
    rng = np.random.default_rng(7); buf = np.zeros(int(SR * (total + 1)))

    def put(sig, at):
        i = max(0, int(at * SR)); j = min(len(buf), i + len(sig)); buf[i:j] += sig[: j - i]

    def impact(big):
        n = int(SR * (0.9 if big else 0.5)); t = np.arange(n) / SR
        f = (60 if big else 85) * np.exp(-t * 3) + 35
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * (5 if big else 9)) + rng.normal(0, 1, n) * np.exp(-t * 60) * 0.5) * (0.9 if big else 0.55)

    def whoosh(d=0.45):
        n = int(SR * d); x = rng.normal(0, 1, n); y = np.zeros(n); acc = 0.0; c = np.linspace(0.02, 0.35, n)
        for i in range(n):
            acc += c[i] * (x[i] - acc); y[i] = acc
        return y * np.sin(np.pi * np.arange(n) / n) ** 1.5 * 1.4

    def riser(d=1.6):
        n = int(SR * d); t = np.arange(n) / SR; f = 200 + 1400 * (t / d) ** 2
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + rng.normal(0, 1, n) * 0.12) * (t / d) ** 2

    bigs = []
    for p in pieces:
        for e in p["events"]:
            if p["a"] <= e["t"] <= p["b"]:
                at = p["out_start"] + (e["t"] - p["a"]) / p["speed"]; put(impact(e.get("big", False)), at)
                if e.get("big"):
                    bigs.append(at)
        if p.get("trans_in"):
            put(whoosh(), p["out_start"] - 0.25)
    if bigs:
        put(riser(), bigs[-1] - 1.6)
    buf = buf[: int(SR * total)]; buf = buf / max(1e-6, np.abs(buf).max()) * 0.8
    sf.write(path, np.stack([buf, buf], 1), SR)


def cmd_render(a):
    ej = Path(a.edit).resolve(); E = json.loads(ej.read_text()); base = ej.parent
    src = str((base / E["source"]).resolve()); out = (base / E.get("out", "out/highlight.mp4")).resolve()
    if a.preview:
        out = out.with_name(out.stem + "-preview.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)
    work = out.parent / (out.stem + "_work"); work.mkdir(exist_ok=True)
    ch = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=channels", "-of", "csv=p=0", src],
                        capture_output=True, text=True).stdout.strip()
    E["_mono"] = ch == "1"
    vertical = E.get("aspect", "16:9") == "9:16"
    out_w, out_h = ((360, 640) if vertical else (640, 360)) if a.preview else ((1080, 1920) if vertical else (1920, 1080))
    pieces, total = build_pieces(E)
    for p in pieces:
        print(f"  {p['kind']:<5} hl{p['hi']:<2} {p['a']:6.2f}–{p['b']:6.2f} ×{p['speed']:<4} → {p['out_start']:6.2f}–{p['out_start'] + p['dur']:6.2f}"
              + ("  ↦trans" if p.get("trans_out") else ""))
    if not E.get("full_highlights", True) and not E.get("hook"):
        print("  ! not a full-highlight video but no hook given: add \"hook\" (best moment, ~1.2 s)", file=sys.stderr)
    # character glow
    glowcfg, track, anchor = E.get("glow"), None, (0.5, 0.6)
    w, h = probe(src)
    if glowcfg:
        if not glowcfg.get("anchor"):
            idir = work / "identify"
            r = subprocess.run([str(VENV_VISION), str(HERE / "charglow.py"), "identify", src, "--a", str(E["highlights"][0]["a"]),
                                "--b", str(E["highlights"][-1]["b"]), "--out", str(idir)], capture_output=True, text=True)
            res = json.loads((idir / "identify.json").read_text())
            if r.returncode != 0 or res["decision"] == "ask":
                print(f"? could not identify the player's character with confidence.\n  Show {idir/'identify.jpg'} to the user, ask which "
                      f"number is their character, then set \"glow\": {{\"anchor\": [cx, cy]}} from {idir/'identify.json'} (or remove glow).")
                sys.exit(3)
            glowcfg["anchor"] = res["anchor"]; print(f"  glow: character identified at {res['anchor']}")
        anchor = tuple(glowcfg["anchor"])
        mpath = work / "masks.npz"
        if not mpath.exists():
            spans = sorted((p["a"], p["b"]) for p in pieces if p["kind"] != "outro")
            merged = []
            for x, y in spans:
                if merged and x <= merged[-1][1] + 0.3:
                    merged[-1][1] = max(merged[-1][1], y)
                else:
                    merged.append([x, y])
            parts = []
            for j, (x, y) in enumerate(merged):
                pp = work / f"masks_{j}.npz"
                cmd = [str(VENV_VISION), str(HERE / "charglow.py"), "track", src, "--a", str(x), "--b", str(y),
                       "--anchor", f"{anchor[0]},{anchor[1]}", "--kfps", "6" if a.preview else "8", "--out", str(pp)]
                if glowcfg.get("approved"):
                    cmd.append("--accept")
                r = subprocess.run(cmd)
                if r.returncode == 4:
                    print(f"? the character outline is uncertain in highlight {j}. Show {pp.with_suffix('')}.check.jpg to the user.\n"
                          f"  If the outline is on their character, set \"glow\": {{\"approved\": true, …}} and render again;\n"
                          f"  if it is on someone else, run charglow.py identify again and ask which character is theirs.")
                    sys.exit(3)
                r.check_returncode()
                parts.append(np.load(pp))
            np.savez_compressed(mpath, times=np.concatenate([q["times"] for q in parts]), masks=np.concatenate([q["masks"] for q in parts]),
                                found=np.concatenate([q["found"] for q in parts]), src_size=parts[0]["src_size"])
        track = MaskTrack(mpath, w, h)
    vids, auds = [], []
    for i, p in enumerate(pieces):
        v, au, n = render_piece(E, p, i, src, work, out_w, out_h, glowcfg, track, anchor, a.preview)
        vids.append(v); auds.append(au); print(f"  ✓ piece {i} ({n} frames)")
    (work / "v.txt").write_text("".join(f"file '{v}'\n" for v in vids))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "v.txt"), "-c", "copy", str(work / "video.mkv")], check=True)
    (work / "a.txt").write_text("".join(f"file '{x}'\n" for x in auds))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(work / "a.txt"), "-c", "copy", str(work / "game.wav")], check=True)
    sfx_track(pieces, total, work / "sfx.wav")
    subprocess.run([sys.executable if Path(sys.executable).exists() else "python3", str(HERE / "voice.py"), "mix", "--voice", str(work / "game.wav"),
                    "--sfx", str(work / "sfx.wav"), "--out", str(work / "mix.wav"), "--lufs", str(E.get("loudness", -12))], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(work / "video.mkv"), "-i", str(work / "mix.wav"), "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", str(out)], check=True)
    print(f"✓ {out}  {total:.2f} s · {len(pieces)} pieces · glow {'on' if track else 'off'} · hook {'on' if pieces[0]['kind'] == 'hook' else 'off'}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("scan"); s.add_argument("video"); s.add_argument("--a", type=float, default=0); s.add_argument("--b", type=float, required=True); s.add_argument("--out")
    b = sp.add_parser("badges"); b.add_argument("video"); b.add_argument("--t", required=True); b.add_argument("--out")
    r = sp.add_parser("render"); r.add_argument("edit"); r.add_argument("--preview", action="store_true")
    a = ap.parse_args()
    {"scan": cmd_scan, "badges": cmd_badges, "render": cmd_render}[a.cmd](a)


if __name__ == "__main__":
    main()
