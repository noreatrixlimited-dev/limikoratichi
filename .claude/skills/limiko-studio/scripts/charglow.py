#!/usr/bin/env python3
"""Find and track the player's own character in gameplay footage, for the character glow.

    charglow.py identify <video> --a A --b B [--n 8] --out DIR
        Samples N frames between A and B (seconds), finds every person, and picks the player's character
        (third-person games: the steady figure near the lower centre). Writes DIR/identify.json and
        DIR/identify.jpg (all candidates numbered; the pick outlined in cyan).
        Exit 0 = confident pick. Exit 3 = not sure: show identify.jpg to the user and ask which number is theirs,
        then re-run with --pick N (or give --anchor cx,cy yourself).

    charglow.py track <video> --a A --b B --anchor CX,CY [--kfps 6] --out masks.npz
        Per-keyframe masks of that character (follows it frame to frame). Used by gameedit.py.

Model: facebook/detr-resnet-50-panoptic (Apache-2.0), runs in ~/.cache/limiko-voice/venv-vision
(see scripts/vision-setup.sh). CPU: ~1–2 s per analysed frame at the reduced size used here.
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

MODEL = "facebook/detr-resnet-50-panoptic"
EDGE = 0.06          # ignore detections whose centre is this close to the frame edge (HUD portraits)
MAX_AREA = 0.30      # ignore "people" covering most of the frame (close-ups the model merges with the background)
MASK_W = 480         # stored mask width


def frames_at(video, times):
    """Exact-seek frames as RGB arrays."""
    out = []
    for t in times:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ss", f"{t:.3f}", "-frames:v", "1",
                              "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
        out.append(raw)
    w, h = probe(video)
    return [np.frombuffer(r, np.uint8).reshape(h, w, 3) for r in out]


def frames_range(video, a, b, fps):
    """All frames from a to b at `fps`, in one decoding pass (much faster than one seek per frame)."""
    w, h = probe(video)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.3f}", "-i", video, "-t", f"{b - a + 1e-3:.3f}",
                          "-vf", f"fps={fps}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    n = len(raw) // (w * h * 3)
    frames = [np.frombuffer(raw[i * w * h * 3:(i + 1) * w * h * 3], np.uint8).reshape(h, w, 3) for i in range(n)]
    return [a + i / fps for i in range(n)], frames


def probe(video):
    s = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", video], capture_output=True, text=True, check=True).stdout.strip()
    w, h = map(int, s.split(",")[:2])
    return w, h


class Finder:
    def __init__(self):
        import torch
        from transformers import DetrImageProcessor, DetrForSegmentation
        self.torch = torch
        self.proc = DetrImageProcessor.from_pretrained(MODEL, size={"shortest_edge": 448, "longest_edge": 1000})
        self.model = DetrForSegmentation.from_pretrained(MODEL).eval()

    def people(self, rgb):
        from PIL import Image
        h, w = rgb.shape[:2]
        with self.torch.no_grad():
            out = self.model(**self.proc(images=Image.fromarray(rgb), return_tensors="pt"))
        r = self.proc.post_process_panoptic_segmentation(out, threshold=0.6, target_sizes=[(h, w)], label_ids_to_fuse=set())[0]
        seg = r["segmentation"].numpy()
        found = []
        for s in r["segments_info"]:
            if self.model.config.id2label[s["label_id"]] != "person":
                continue
            m = seg == s["id"]
            ys, xs = np.nonzero(m)
            if not len(xs):
                continue
            cx, cy = xs.mean() / w, ys.mean() / h
            if min(cx, 1 - cx, cy, 1 - cy) < EDGE or len(xs) / (w * h) > MAX_AREA:
                continue
            found.append({"mask": m, "cx": float(cx), "cy": float(cy), "area": float(len(xs) / (w * h)), "score": float(s["score"])})
        return found


def third_person_score(p):
    """Likelihood of being the player in a third-person view: near lower centre, reasonably large."""
    d = np.hypot((p["cx"] - 0.47) / 0.18, (p["cy"] - 0.62) / 0.22)
    return float(np.exp(-d * d) * min(1.0, p["area"] / 0.008) * p["score"])


def identify(a):
    times = list(np.linspace(a.a, a.b, a.n))
    rgbs = frames_at(a.video, times)
    F = Finder()
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    per_frame, picks = [], []
    for t, rgb in zip(times, rgbs):
        ps = F.people(rgb)
        for p in ps:
            p["s"] = third_person_score(p)
        ps.sort(key=lambda p: -p["s"])
        per_frame.append((t, rgb, ps))
        if ps:
            picks.append((ps[0]["cx"], ps[0]["cy"], ps[0]["s"], ps[1]["s"] if len(ps) > 1 else 0.0))
    stats = {}
    if not picks:
        decision, anchor = "ask", None
    else:
        cxs, cys = np.array([p[0] for p in picks]), np.array([p[1] for p in picks])
        anchor = (float(np.median(cxs)), float(np.median(cys)))
        steady = float(np.mean(np.hypot(cxs - anchor[0], cys - anchor[1]) < 0.13))       # same place across frames (third-person camera sways)
        found = len(picks) / len(times)                                                  # visible in most frames
        margin = float(np.median([(b - c) / max(b, 1e-6) for _, _, b, c in picks]))      # clearly ahead of others
        stats = {"steady": round(steady, 2), "found": round(found, 2), "margin": round(margin, 2)}
        decision = "auto" if (steady >= 0.7 and found >= 0.6 and margin >= 0.35) else "ask"
    if a.pick is not None or a.anchor:
        decision = "user"
        if a.anchor:
            anchor = tuple(map(float, a.anchor.split(",")))
    # preview: up to 4 frames, numbered candidates
    import cv2
    tiles, numbering = [], []
    for k, (t, rgb, ps) in enumerate(per_frame[:: max(1, len(per_frame) // 4)][:4]):
        img = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR).copy()
        for j, p in enumerate(ps):
            cnts, _ = cv2.findContours(p["mask"].astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            col = (255, 230, 60) if j == 0 else (60, 60, 255)
            cv2.drawContours(img, cnts, -1, col, 3)
            x, y = int(p["cx"] * img.shape[1]), int(p["cy"] * img.shape[0])
            cv2.putText(img, str(j + 1), (x + 8, y), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 6)
            cv2.putText(img, str(j + 1), (x + 8, y), cv2.FONT_HERSHEY_SIMPLEX, 1.2, col, 2)
            numbering.append({"frame": k, "t": round(t, 2), "n": j + 1, "cx": round(p["cx"], 3), "cy": round(p["cy"], 3)})
        cv2.putText(img, f"{t:.1f}s", (12, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
        tiles.append(cv2.resize(img, (640, int(640 * img.shape[0] / img.shape[1]))))
    if tiles:
        while len(tiles) % 2:
            tiles.append(np.zeros_like(tiles[0]))
        grid = np.vstack([np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)])
        cv2.imwrite(str(out / "identify.jpg"), grid)
    if a.pick is not None:
        sel = [c for c in numbering if c["n"] == a.pick]
        if sel:
            anchor = (float(np.median([c["cx"] for c in sel])), float(np.median([c["cy"] for c in sel])))
    res = {"decision": decision, "anchor": anchor, "stats": stats, "picks": [[round(x, 3) for x in p] for p in picks], "candidates": numbering,
           "note": "cyan = auto pick (1). If decision is 'ask', show identify.jpg and ask the user which number is their character."}
    (out / "identify.json").write_text(json.dumps(res, indent=1))
    print(json.dumps({k: res[k] for k in ("decision", "anchor", "stats")}))
    sys.exit(0 if decision in ("auto", "user") else 3)


def track(a):
    import cv2
    w, h = probe(a.video)
    times, rgbs = frames_range(a.video, a.a, a.b, a.kfps)
    F = Finder()
    ax, ay = map(float, a.anchor.split(","))
    mh = int(round(MASK_W * h / w))
    masks, keep = [], []
    prev = (ax, ay)
    for t, rgb in zip(times, rgbs):
        ps = F.people(rgb)
        best, bd = None, 1e9
        for p in ps:
            d = np.hypot(p["cx"] - prev[0], p["cy"] - prev[1])
            if d < bd:
                best, bd = p, d
        if best is not None and bd < 0.15:
            masks.append(cv2.resize(best["mask"].astype(np.uint8) * 255, (MASK_W, mh), interpolation=cv2.INTER_AREA))
            prev = (0.7 * best["cx"] + 0.3 * ax, 0.7 * best["cy"] + 0.3 * ay)  # follow, but stay near the anchor
            keep.append(True)
        else:
            masks.append(np.zeros((mh, MASK_W), np.uint8)); keep.append(False)
    np.savez_compressed(a.out, times=np.array(times), masks=np.array(masks), found=np.array(keep), src_size=np.array([w, h]))
    print(f"✓ {a.out}: {sum(keep)}/{len(keep)} keyframes with the character ({a.kfps}/s, {a.a:.2f}–{a.b:.2f}s)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["identify", "track"])
    ap.add_argument("video")
    ap.add_argument("--a", type=float, required=True)
    ap.add_argument("--b", type=float, required=True)
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("--kfps", type=float, default=6)
    ap.add_argument("--anchor")
    ap.add_argument("--pick", type=int)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    (identify if a.cmd == "identify" else track)(a)


if __name__ == "__main__":
    main()
