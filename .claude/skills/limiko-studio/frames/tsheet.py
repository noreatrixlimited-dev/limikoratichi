#!/usr/bin/env python3
"""Contact sheet of transition previews: tsheet.py <dir with x_<Name>.png> <out.jpg>"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

d, out = Path(sys.argv[1]), Path(sys.argv[2])
fs = sorted(d.glob("x_*.png"))
w, h = Image.open(fs[0]).size
cols = 10; lab = 18; rows = (len(fs) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w, rows * (h + lab)), "#111")
dr = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 12)
except OSError:
    font = ImageFont.load_default()
for i, f in enumerate(fs):
    x, y = (i % cols) * w, (i // cols) * (h + lab)
    sheet.paste(Image.open(f).convert("RGB"), (x, y + lab))
    dr.text((x + 4, y + 2), f.stem[2:], fill="white", font=font)
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out, quality=80)
print(f"✓ {out}  ({len(fs)} transitions at mid-point)")
