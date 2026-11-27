"""Encode the final art-directed photographs for delivery; never crop/stretch a slide.
Run after editing the approved PNG masters in design/hero/responsive (Pillow with AVIF)."""
from pathlib import Path
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/shop/optimized'
MASTERS = ROOT / 'design/hero/responsive'
SLIDES = ('01-complete-sets', '02-quran-stands', '03-golden-gallery')
LAYOUTS = {'phone': ('mobile', [420, 720, 960]), 'tablet': ('tablet', [768, 1080, 1536]),
           'wide': ('wide', [960, 1440, 1920])}

def encode(job):
    layout, slide = job
    label, targets = LAYOUTS[layout]
    key = f'{label}-hero-{slide}'
    with Image.open(MASTERS / f'{layout}-{slide}.png') as src:
        im = src.convert('RGB')
    widths = sorted({min(w, im.width) for w in targets})
    entry = dict(width=im.width, height=im.height, widths=widths, avif=[], webp=[])
    for w in widths:
        frame = im.resize((w, round(im.height*w/im.width)), Image.Resampling.LANCZOS)
        for ext, opts in [('avif', dict(quality=60,speed=7,max_threads=2)), ('webp', dict(quality=83,method=5))]:
            buf = BytesIO()
            frame.save(buf, ext.upper(), **opts)
            blob = buf.getvalue()
            name = f'{key}-{w}-{hashlib.sha256(blob).hexdigest()[:12]}.{ext}'
            (OUT / name).write_bytes(blob)
            entry[ext].append(name)
    return key, entry

if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    jobs = [(l,s) for l in LAYOUTS for s in SLIDES if l != 'wide' or s.startswith('03')]
    with ThreadPoolExecutor(max_workers=3) as pool:
        data = dict(pool.map(encode,jobs))
    (ROOT / 'lib/shop-mobile-heroes.json').write_bytes((json.dumps(data,indent=1)+'\n').encode())
    print('Encoded',len(data),'distinct art-directed hero compositions')
