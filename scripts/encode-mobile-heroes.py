"""Export phone renditions from the approved product photography. No products or lettering are redrawn."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
out = root / 'public/shop/optimized'
manifest = {}
for slide in ('01-complete-sets', '02-quran-stands', '03-golden-gallery'):
    key = 'mobile-hero-' + slide
    if slide.startswith('03'):
        # This separate portrait photograph already has all four matching sets.
        picture = Image.open(root / 'public/shop/campaign/all-mobile.jpg').convert('RGB')
    else:
        # Reflow the approved 4-up banner into two rows of two. Remove the
        # desktop typography: the accessible mobile heading and prices are HTML.
        src = Image.open(root / f'design/hero/three-final/{slide}.jpg').convert('RGB')
        w, h = src.size
        y1, y2 = round(h * 68 / 392), round(h * 321 / 392)
        row = y2 - y1
        picture = Image.new('RGB', (w // 2, row * 2))
        for i in range(2):
            left = i * (w // 2)
            picture.paste(src.crop((left, y1, left + w // 2, y2)), (0, i * row))
    sizes = [420, 640, min(900, picture.width)]
    entry = dict(width=picture.width, height=picture.height, widths=sizes, avif=[], webp=[])
    for width in sizes:
        frame = picture.resize((width, round(picture.height * width / picture.width)), Image.Resampling.LANCZOS)
        for fmt, opts in [('avif', dict(quality=62, speed=7)), ('webp', dict(quality=83, method=5))]:
            buf = BytesIO()
            frame.save(buf, fmt.upper(), **opts)
            blob = buf.getvalue()
            name = f'{key}-{width}-{hashlib.sha256(blob).hexdigest()[:12]}.{fmt}'
            (out / name).write_bytes(blob)
            entry[fmt].append(name)
    manifest[key] = entry
(root / 'lib/shop-mobile-heroes.json').write_text(json.dumps(manifest, indent=1)+'\n', encoding='utf-8')
