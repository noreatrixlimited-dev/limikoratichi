#!/usr/bin/env python3
"""YouTube thumbnails from gameplay (or any frame): character cut-out with a sticker outline, colour grade, 3D text.
Runs in ~/.cache/limiko-voice/venv-vision (scripts/vision-setup.sh).

    thumbnail.py make --video raw.mp4 --t 37.25 --title "QUADRA|TAKEDOWN!" [--tag "CLUTCH BOOYAH"] [--out thumb.jpg]
                      [--anchor 0.46,0.65] [--layout right|left|center] [--grade leak|none] [--style sticker|neon|aura]
                      [--lang en|te] [--size 1280x720] [--pop 1.35] [--glow "#ffb347"] [--accent "#ffd23f"]
    thumbnail.py make --image frame.png …                (a still instead of a video frame)
    thumbnail.py variants … --titles "A|B;C|D;E|F"        (one thumbnail per title, for A/B testing)

--title: lines separated by "|". Line 1 is white, the rest use the accent colour (like the reference thumbnail).
--tag: a small skewed label above the title. Keep the whole text to 0–4 words (shared/packaging.md).
The character is cut out with SAM 2 (prompted by the identified player, see charglow.py), enlarged ("pop") so it
stands in front of the background, outlined, and lit by the same grade as the video (gameedit.py "grade").
"""
import argparse, os, subprocess, sys, warnings
from pathlib import Path
import numpy as np

warnings.filterwarnings("ignore")
os.environ.setdefault("TRANSFORMERS_VERBOSITY", "error")
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
FONTS = {
    "en": "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf",
    "en_tag": "/usr/share/fonts/opentype/inter/Inter-BlackItalic.otf",
    "te": str(HERE.parent / "frames" / "fonts" / "noto-sans-telugu-telugu-900-normal.woff2"),
}


def hex_rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def grab(video, t):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-ss", f"{t:.3f}", "-frames:v", "1", "-f", "image2pipe",
                          "-vcodec", "png", "-"], capture_output=True, check=True).stdout
    import cv2
    return cv2.cvtColor(cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)


def cutout_mask(rgb, anchor):
    """Precise mask of the character: SAM 2 on this one frame, prompted with the DETR box near the anchor."""
    import torch
    from transformers import Sam2VideoModel, Sam2VideoProcessor
    import charglow
    h, w = rgb.shape[:2]
    pr = charglow.prompt_from_detr(rgb, anchor)
    name = "facebook/sam2.1-hiera-small"          # one frame only, so use the more accurate model
    model = Sam2VideoModel.from_pretrained(name).eval(); proc = Sam2VideoProcessor.from_pretrained(name)
    sess = proc.init_video_session(video=[rgb], inference_device="cpu", dtype=torch.float32)
    if pr:
        proc.add_inputs_to_inference_session(inference_session=sess, frame_idx=0, obj_ids=1, input_boxes=[[pr[0]]])
    else:
        proc.add_inputs_to_inference_session(inference_session=sess, frame_idx=0, obj_ids=1,
                                             input_points=[[[[anchor[0] * w, anchor[1] * h]]]], input_labels=[[[1]]])
    with torch.no_grad():
        out = model(inference_session=sess, frame_idx=0)
    m = proc.post_process_masks([out.pred_masks], original_sizes=[[h, w]], binarize=False)[0][0, 0].numpy()
    m = 1 / (1 + np.exp(-m)) if m.min() < 0 else m                       # logits → probability
    return np.clip(m, 0, 1).astype(np.float32), bool(pr)


def sticker_rgba(rgb, m, style, glow_hex, scale):
    """Character + outline + glow as an RGBA layer, scaled up by `scale`."""
    import cv2
    import gameedit as G
    h, w = rgb.shape[:2]
    big = lambda a, interp=cv2.INTER_CUBIC: cv2.resize(a, (int(w * scale), int(h * scale)), interpolation=interp)
    rgb_b = big(rgb.astype(np.float32)); m_b = np.clip(big(m), 0, 1)
    blur = cv2.GaussianBlur(rgb_b, (0, 0), 1.6); rgb_b = np.clip(rgb_b * 1.9 - blur * 0.9, 0, 255)   # sharpen the upscale
    H = rgb_b.shape[0]
    sw = max(3, int(round(H * 0.008))); gr = max(6, int(round(H * 0.04)))
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * sw + 1, 2 * sw + 1))
    body = cv2.GaussianBlur(m_b, (0, 0), 0.9)
    ring = np.clip(cv2.GaussianBlur(cv2.dilate(m_b, k), (0, 0), 1.0) - body, 0, 1)
    glow = np.clip(cv2.GaussianBlur(cv2.dilate(m_b, k), (0, 0), gr) * 1.4, 0, 1) * (1 - body)
    gc = np.array(hex_rgb(glow_hex), np.float32)
    stroke = gc if style == "neon" else np.array([255, 255, 255], np.float32)
    # colour: body pixels, then the outline, then the glow (as its own alpha)
    color = rgb_b * body[..., None] + stroke[None, None, :] * ring[..., None] + gc[None, None, :] * glow[..., None]
    alpha = np.clip(body + ring + glow * (0.9 if style != "aura" else 0.6), 0, 1)
    color = np.where(alpha[..., None] > 1e-4, color / np.maximum(alpha[..., None], 1e-4), 0)
    return np.dstack([np.clip(color, 0, 255), alpha * 255]).astype(np.uint8), m_b


def text_layer(W, H, title, tag, lang, accent_hex, area):
    """3D title (extruded, thick outline, gradient) + skewed tag banner, fitted into area=(x0,y0,x1,y1)."""
    from PIL import Image, ImageDraw, ImageFont
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    x0, y0, x1, y1 = area; aw = x1 - x0
    eng = ImageFont.Layout.RAQM
    lines = [l.strip() for l in title.split("|") if l.strip()]
    acc = hex_rgb(accent_hex)
    # mixed-script text: Telugu runs use the Telugu font, everything else (digits, "!", English words) uses Inter
    def runs(text):
        out = []
        for ch in text:
            te = "\u0c00" <= ch <= "\u0c7f" or (ch in "\u200c\u200d") or (ch == " " and out and out[-1][1] and lang == "te")
            if out and out[-1][1] == te:
                out[-1][0] += ch
            else:
                out.append([ch, te])
        return out

    def fonts(size, tag=False):
        lat = ImageFont.truetype(FONTS["en_tag"] if tag else FONTS["en"], size, layout_engine=eng)
        tel = ImageFont.truetype(FONTS["te"], size, layout_engine=eng)
        return lat, tel

    def width(text, ff):
        return sum(ff[1 if te else 0].getlength(t) for t, te in runs(text))

    def draw_line(d, x, base, text, ff, **kw):                        # x = left, base = baseline
        for t, te in runs(text):
            d.text((x, base), t, font=ff[1 if te else 0], anchor="ls", **kw); x += ff[1 if te else 0].getlength(t)

    # fit: largest size whose widest line fits the area width
    size = int(H * 0.26)
    while size > 20:
        ff = fonts(size)
        if max(width(l, ff) for l in lines) + size * 0.2 <= aw * 0.96 and size * 1.05 * len(lines) <= (y1 - y0) * 0.86:
            break
        size -= 4
    ff = fonts(size)
    tag_h = 0
    if tag:
        tff = fonts(max(18, int(size * 0.30)), tag=True)
        th = int(tff[0].size * 1.0); tw = int(width(tag, tff))
        pad = int(th * 0.45); bw, bh = tw + pad * 3, th + pad * 2
        banner = Image.new("RGBA", (bw + 30, bh + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(banner)
        d.polygon([(14, 4), (bw + 24, 4), (bw + 10, bh + 4), (0, bh + 4)], fill=(15, 15, 18, 235))
        d.polygon([(14, 4), (bw + 24, 4), (bw + 21, 10), (12, 10)], fill=(*acc, 255))
        draw_line(d, pad * 1.5 + 6, 4 + pad + th * 0.82, tag, tff, fill=(255, 255, 255, 255),
                  stroke_width=max(1, int(th * 0.06)), stroke_fill=(0, 0, 0, 255))
        cx = (x0 + x1) // 2 - banner.width // 2
        layer.alpha_composite(banner, (max(0, cx), y0)); tag_h = banner.height + int(size * 0.05)
    y = y0 + tag_h
    asc = max(ff[0].getmetrics()[0], ff[1].getmetrics()[0] if lang == "te" else 0)
    lh = int(size * (1.25 if lang == "te" else 0.98))
    depth = max(4, int(size * 0.07)); sw = max(3, int(size * 0.075))
    for i, line in enumerate(lines):
        lw = width(line, ff); lx = (x0 + x1) / 2 - lw / 2; base = y + asc * (0.82 if lang == "te" else 0.95)
        top, bottom = ((255, 255, 255), (214, 218, 228)) if i == 0 else (tuple(min(255, c + 30) for c in acc), tuple(int(c * 0.78) for c in acc))
        side = (60, 62, 70) if i == 0 else tuple(int(c * 0.42) for c in acc)
        d = ImageDraw.Draw(layer)
        for k in range(depth, 0, -1):                                    # extrusion (3D depth), down-right
            draw_line(d, lx + k, base + k, line, ff, fill=(*side, 255), stroke_width=sw, stroke_fill=(0, 0, 0, 255))
        draw_line(d, lx, base, line, ff, fill=(0, 0, 0, 255), stroke_width=sw, stroke_fill=(0, 0, 0, 255))
        face = Image.new("L", (W, H), 0); draw_line(ImageDraw.Draw(face), lx, base, line, ff, fill=255)
        fb = face.getbbox() or (0, y, W, y + lh); fy0, fy1 = fb[1], fb[3]
        g = np.zeros((H, W, 4), np.uint8); t = np.clip((np.arange(H) - fy0) / max(1, fy1 - fy0), 0, 1)[:, None]
        for c in range(3):
            g[..., c] = (top[c] * (1 - t) + bottom[c] * t).astype(np.uint8)
        g[..., 3] = 255
        layer.paste(Image.fromarray(g, "RGBA"), (0, 0), face)
        hl = Image.new("L", (W, H), 0); ImageDraw.Draw(hl).rectangle([0, fy0, W, fy0 + (fy1 - fy0) * 0.38], fill=70)
        hl = Image.fromarray((np.asarray(hl, np.float32) * (np.asarray(face, np.float32) / 255)).astype(np.uint8))
        layer.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), hl)
        y += lh
    return layer.rotate(3, resample=Image.BICUBIC, center=((x0 + x1) // 2, (y0 + y) // 2))


def make(a, title=None, out=None):
    import cv2
    from PIL import Image
    import gameedit as G
    W, H = map(int, a.size.lower().split("x"))
    rgb = grab(a.video, a.t) if a.video else cv2.cvtColor(cv2.imread(a.image), cv2.COLOR_BGR2RGB)
    h, w = rgb.shape[:2]
    anchor = tuple(map(float, a.anchor.split(","))) if a.anchor else None
    if anchor is None:
        import charglow
        best = min(charglow.Finder().people(rgb), key=lambda p: -charglow.third_person_score(p), default=None)
        if best is None:
            sys.exit("? no character found in this frame: pick another time, or give --anchor cx,cy (ask the user which character)")
        anchor = (best["cx"], best["cy"])
    m, boxed = cutout_mask(rgb, anchor)
    if m.mean() < 0.002:
        sys.exit("? the cut-out is empty: try another frame, or give --anchor on the character")
    # background: crop to the thumbnail aspect around the character, grade it, push it back a little
    ys, xs = np.nonzero(m > 0.5); cx, cy = xs.mean(), ys.mean()
    ar = W / H; bw = min(w, int(h * ar)); bh = int(bw / ar)
    char_x = {"right": 0.30, "left": 0.70, "center": 0.5}[a.layout]
    bx = int(np.clip(cx - bw * char_x, 0, w - bw)); by = int(np.clip(cy - bh * 0.55, 0, h - bh))
    bg = cv2.resize(rgb[by:by + bh, bx:bx + bw].astype(np.float32), (W, H), interpolation=cv2.INTER_CUBIC)
    bg = cv2.GaussianBlur(bg, (0, 0), 1.6) * 0.92
    if a.grade != "none":                                                 # thumbnails get a stronger grade than video
        bg = G.grade_frame(bg[..., ::-1].copy(), a.grade, a.grade_strength)[..., ::-1]   # grade_frame works in BGR
    bg = np.clip((bg - 128) * 1.12 + 128, 0, 255)                         # extra punch
    # character: enlarged sticker in front, feet towards the bottom edge
    s = W / bw * a.pop
    st, m_big = sticker_rgba(rgb, m, a.style, a.glow, s)
    sy, sx = np.nonzero(m_big > 0.5)
    tx = int(W * char_x - sx.mean()); ty = int(H * 1.04 - sy.max())
    canvas = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).convert("RGBA")
    # soft shadow behind the character
    sh = Image.fromarray((np.asarray(st)[..., 3] * 0.55).astype(np.uint8))
    shadow = Image.new("RGBA", st.shape[1::-1], (0, 0, 0, 255)); shadow.putalpha(sh)
    from PIL import ImageFilter
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(H * 0.012)), (tx + int(H * 0.012), ty + int(H * 0.012)))
    stimg = Image.fromarray(st, "RGBA")
    if a.grade != "none":                                                 # light the character with the same grade, gently
        c = np.asarray(stimg).astype(np.float32); rgbg = G.grade_frame(c[..., 2::-1].copy(), a.grade, 1.0)[..., ::-1]
        c[..., :3] = c[..., :3] * 0.55 + rgbg * 0.45; stimg = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8), "RGBA")
    canvas.alpha_composite(stimg, (tx, ty))
    # text area on the free side
    area = {"right": (int(W * 0.50), int(H * 0.10), int(W * 0.98), int(H * 0.92)),
            "left": (int(W * 0.02), int(H * 0.10), int(W * 0.50), int(H * 0.92)),
            "center": (int(W * 0.06), int(H * 0.04), int(W * 0.94), int(H * 0.46))}[a.layout]
    canvas.alpha_composite(text_layer(W, H, title or a.title, a.tag, a.lang, a.accent, area))
    out = Path(out or a.out); out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, quality=92)
    print(f"✓ {out}  ({W}×{H}, character {'boxed' if boxed else 'point'}-prompted at {anchor[0]:.2f},{anchor[1]:.2f}, layout {a.layout}, grade {a.grade})")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("cmd", choices=["make", "variants"])
    ap.add_argument("--video"); ap.add_argument("--image"); ap.add_argument("--t", type=float, default=0)
    ap.add_argument("--title", default="CLUTCH|BOOYAH!"); ap.add_argument("--titles"); ap.add_argument("--tag")
    ap.add_argument("--anchor"); ap.add_argument("--layout", choices=["right", "left", "center"], default="right")
    ap.add_argument("--grade", default="leak"); ap.add_argument("--style", choices=["sticker", "neon", "aura"], default="sticker")
    ap.add_argument("--lang", choices=["en", "te"], default="en"); ap.add_argument("--size", default="1280x720")
    ap.add_argument("--pop", type=float, default=1.6); ap.add_argument("--grade-strength", type=float, default=1.7); ap.add_argument("--glow", default="#ffb347"); ap.add_argument("--accent", default="#ffd23f")
    ap.add_argument("--out", default="thumbnail.jpg")
    a = ap.parse_args()
    if not (a.video or a.image):
        sys.exit("give --video (with --t) or --image")
    if a.cmd == "make":
        make(a)
    else:
        for i, t in enumerate((a.titles or a.title).split(";")):
            make(a, t, str(Path(a.out).with_name(f"{Path(a.out).stem}_{i + 1}{Path(a.out).suffix}")))


if __name__ == "__main__":
    main()
