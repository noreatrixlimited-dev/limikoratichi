#!/usr/bin/env python3
"""Contact sheet for one category: out/<cat>/*.png -> out/<cat>-sheet.jpg, plus small JPG copies."""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

d = Path(sys.argv[1])
items = json.loads((d / "index.json").read_text())
items = [i for i in items if (d / f"{i['id']}.png").exists()]
if not items:
    sys.exit(0)
tw, th, cols, pad, lab = 400, 225, 3, 14, 30
rows = (len(items) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (tw + pad) + pad, rows * (th + lab + pad) + pad + 50), "#111")
dr = ImageDraw.Draw(sheet)
try:
    f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
    big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
except OSError:
    f = big = ImageFont.load_default()
dr.text((pad, 14), f"{d.name.upper()} · {len(items)} styles", fill="#fff", font=big)
for k, it in enumerate(items):
    im = Image.open(d / f"{it['id']}.png").convert("RGB")
    im.save(d / f"{it['id']}.jpg", quality=86)
    x = pad + (k % cols) * (tw + pad)
    y = 50 + pad + (k // cols) * (th + lab + pad)
    sheet.paste(im.resize((tw, th), Image.LANCZOS), (x, y + lab))
    tag = "3D" if it["dim"] == "3d" else "2D"
    dr.text((x, y + 6), f"{it['id']}", fill="#fff", font=f)
    dr.rectangle([x + tw - 34, y + 4, x + tw, y + 24], fill="#e8553a" if tag == "3D" else "#3a7be8")
    dr.text((x + tw - 28, y + 6), tag, fill="#fff", font=f)
sheet.save(d.parent / f"{d.name}-sheet.jpg", quality=88)
print(f"sheet: {d.parent / (d.name + '-sheet.jpg')}")
