#!/usr/bin/env python3
"""Find and track the player's own character in gameplay footage, for the character glow.

    charglow.py identify <video> --a A --b B [--n 8] --out DIR
        Samples N frames between A and B (seconds), finds every person, and picks the player's character
        (third-person games: the steady figure near the lower centre). Writes DIR/identify.json and
        DIR/identify.jpg (all candidates numbered; the pick outlined in cyan).
        Exit 0 = confident pick. Exit 3 = not sure: show identify.jpg to the user and ask which number is theirs,
        then re-run with --pick N (or give --anchor cx,cy yourself).

    charglow.py track <video> --a A --b B --anchor CX,CY [--kfps 8] [--engine sam2|detr] [--accept] --out masks.npz
        Masks of that character over time. Default engine SAM 2.1 (video object tracking: prompted once at the
        character, then follows that same object frame to frame; tight outlines incl. limbs). Quality checks flag
        frames where the outline jumps in size or position: those frames get no glow. Exit 4 = too many uncertain
        frames: show the check sheet (masks.check.jpg) to the user and re-run with --accept if they approve.

    charglow.py check <masks.npz> <video> --out check.jpg
        Contact sheet of the tracked outline every 0.5 s (red label = uncertain frame) for the user to approve.

Models (Apache-2.0, run in ~/.cache/limiko-voice/venv-vision, see scripts/vision-setup.sh):
    identify: facebook/detr-resnet-50-panoptic (finds every person; picks the player)
    track:    facebook/sam2.1-hiera-tiny (default; --sam2 small for difficult footage), via transformers ≥ 4.57
CPU speed: SAM 2 tiny ≈ 3–4 s per tracked frame incl. loading (8 per second of video); small is slower.
"""
import argparse, json, os, subprocess, sys, warnings
from pathlib import Path
import numpy as np

warnings.filterwarnings("ignore")                 # library warnings (e.g. DETR's harmless backbone-loading notices)
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
os.environ.setdefault("TQDM_DISABLE", "1")

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


def prompt_from_detr(rgb, anchor):
    """Box + point around the person nearest the anchor in this frame (stronger SAM 2 prompt than a point)."""
    try:
        ps = Finder().people(rgb)
    except Exception:
        return None
    h, w = rgb.shape[:2]
    best = min(ps, key=lambda p: np.hypot(p["cx"] - anchor[0], p["cy"] - anchor[1]), default=None)
    if best is None or np.hypot(best["cx"] - anchor[0], best["cy"] - anchor[1]) > 0.15:
        return None
    ys, xs = np.nonzero(best["mask"])
    return [float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max())], (best["cx"], best["cy"])


def track_sam2(a):
    import cv2, torch
    from transformers import Sam2VideoModel, Sam2VideoProcessor
    w, h = probe(a.video)
    times, rgbs = frames_range(a.video, a.a, a.b, a.kfps)
    TW = 640; TH = int(round(TW * h / w / 2) * 2)
    small = [cv2.resize(f, (TW, TH), interpolation=cv2.INTER_AREA) for f in rgbs]
    ax, ay = map(float, a.anchor.split(","))
    pr = prompt_from_detr(rgbs[0], (ax, ay))
    name = f"facebook/sam2.1-hiera-{a.sam2}"
    model = Sam2VideoModel.from_pretrained(name).eval(); proc = Sam2VideoProcessor.from_pretrained(name)
    sess = proc.init_video_session(video=small, inference_device="cpu", dtype=torch.float32)
    sx, sy = TW / w, TH / h
    if pr:
        (x0, y0, x1, y1), (cx, cy) = pr
        proc.add_inputs_to_inference_session(inference_session=sess, frame_idx=0, obj_ids=1,
                                             input_boxes=[[[x0 * sx, y0 * sy, x1 * sx, y1 * sy]]])
        how = "box from the identified character"
    else:
        proc.add_inputs_to_inference_session(inference_session=sess, frame_idx=0, obj_ids=1,
                                             input_points=[[[[ax * TW, ay * TH]]]], input_labels=[[[1]]])
        how = "point at the anchor"
    masks = {}
    with torch.no_grad():
        model(inference_session=sess, frame_idx=0)
        for out in model.propagate_in_video_iterator(sess):
            m = proc.post_process_masks([out.pred_masks], original_sizes=[[TH, TW]], binarize=True)[0]
            masks[out.frame_idx] = m[0, 0].numpy().astype(np.uint8)
    mh = int(round(MASK_W * h / w))
    seq = [masks.get(i, np.zeros((TH, TW), np.uint8)) for i in range(len(small))]
    # quality checks: size and position must change smoothly
    areas = np.array([m.sum() for m in seq], float); med = np.median(areas[areas > 0]) if (areas > 0).any() else 0
    cents = [np.argwhere(m).mean(0)[::-1] / [TW, TH] if m.any() else None for m in seq]
    ok, prev = [], None
    for i, m in enumerate(seq):
        good = med > 0 and 0.4 * med <= areas[i] <= 2.5 * med and cents[i] is not None
        if good and prev is not None and np.hypot(*(cents[i] - prev)) > 0.12:
            good = False
        if good:
            prev = cents[i]
        ok.append(bool(good))
    out = [cv2.resize(m * 255 if k else np.zeros_like(m), (MASK_W, mh), interpolation=cv2.INTER_LINEAR) for m, k in zip(seq, ok)]
    np.savez_compressed(a.out, times=np.array(times), masks=np.array(out), found=np.array(ok), src_size=np.array([w, h]))
    bad = 1 - np.mean(ok)
    print(f"✓ {a.out}: SAM 2 ({a.sam2}) prompted with {how}; {sum(ok)}/{len(ok)} frames passed checks ({a.kfps}/s, {a.a:.2f}–{a.b:.2f}s)")
    if bad > 0.15 and not a.accept:
        sheet = str(Path(a.out).with_suffix("")) + ".check.jpg"
        check_sheet(a.out, a.video, sheet)
        print(f"? {bad:.0%} of frames are uncertain. Show {sheet} to the user; if the outline is on their character, re-run with --accept.")
        sys.exit(4)


def check_sheet(masks_path, video, out):
    import cv2
    d = np.load(masks_path); times, masks, found = d["times"], d["masks"], d["found"]
    step = max(1, int(round(len(times) / max(1, (times[-1] - times[0]) / 0.5))))
    idx = list(range(0, len(times), step))[:24]
    _, rgbs = frames_range(video, float(times[0]), float(times[-1]), 1.0 / max(1e-6, times[1] - times[0]) if len(times) > 1 else 1)
    tiles = []
    for i in idx:
        if i >= len(rgbs):
            break
        img = cv2.cvtColor(rgbs[i], cv2.COLOR_RGB2BGR)
        m = cv2.resize(masks[i], (img.shape[1], img.shape[0])) > 127
        c, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(img, c, -1, (255, 230, 60), 3)
        lab = f"{times[i]:.1f}s" + ("" if found[i] else " UNSURE")
        cv2.putText(img, lab, (12, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 0), 6)
        cv2.putText(img, lab, (12, 40), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255) if found[i] else (60, 60, 255), 2)
        tiles.append(cv2.resize(img, (480, int(480 * img.shape[0] / img.shape[1]))))
    while len(tiles) % 4:
        tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(out, np.vstack([np.hstack(tiles[k:k + 4]) for k in range(0, len(tiles), 4)]))
    print(f"✓ check sheet {out}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["identify", "track", "check"])
    ap.add_argument("video")
    ap.add_argument("video2", nargs="?")
    ap.add_argument("--a", type=float)
    ap.add_argument("--b", type=float)
    ap.add_argument("--engine", choices=["sam2", "detr"], default="sam2")
    ap.add_argument("--sam2", choices=["small", "tiny"], default="tiny")
    ap.add_argument("--accept", action="store_true")
    ap.add_argument("--n", type=int, default=8)
    ap.add_argument("--kfps", type=float, default=8)
    ap.add_argument("--anchor")
    ap.add_argument("--pick", type=int)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    if a.cmd == "check":                       # charglow.py check masks.npz video.mp4 --out check.jpg
        return check_sheet(a.video, a.video2, a.out)
    if a.cmd == "identify":
        return identify(a)
    return track_sam2(a) if a.engine == "sam2" else track(a)


if __name__ == "__main__":
    main()
