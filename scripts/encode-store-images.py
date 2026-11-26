"""Pre-encode responsive, content-addressed delivery copies; never overwrite the artwork.
Run from any directory with Pillow >= 11.3 built with AVIF and WebP support.
"""
import hashlib
import json
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image, ImageOps, features

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/shop/optimized'
assert features.check('avif') and features.check('webp')
OUT.mkdir(exist_ok=True)

def encode(source):
    hero=source.parent.name=='three-final'
    campaign=source.parent.name=='campaign'
    key=('hero-' if hero else 'campaign-' if campaign else '')+source.stem
    with Image.open(source) as original:
        im=ImageOps.exif_transpose(original).convert('RGB')
        # The approved studio posters have a baked-in price footer. Deliver only
        # their photographic region; prices now belong to the commerce UI.
        if source.parent==ROOT/'public/shop' and key.endswith('-set'):
            im=im.crop((0,0,im.width,round(im.height*.886)))
        w,h=im.size
        widths=sorted({min(w,x) for x in ([480,800,1200,1600,1920] if hero or campaign else [96,192,320,400,640,800,1122,w])})
        output={}
        for size in widths:
            resized=im.resize((size,round(h*size/w)),Image.Resampling.LANCZOS)
            for ext,opts in [('avif',dict(quality=62 if hero or '-photo' not in key else 53,speed=7,max_threads=2)),('webp',dict(quality=82 if hero or '-photo' not in key else 77,method=5))]:
                from io import BytesIO
                buf=BytesIO()
                resized.save(buf,ext.upper(),**opts)
                blob=buf.getvalue()
                code=hashlib.sha256(blob).hexdigest()[:12]
                name=f'{key}-{size}-{code}.{ext}'
                out=OUT/name
                if not out.exists():out.write_bytes(blob)
                output.setdefault(ext,[]).append(name)
        return key,dict(width=w,height=h,widths=widths,**output)

sources=sorted((ROOT/'public/shop').glob('*.jpg'))+sorted((ROOT/'public/shop/campaign').glob('*.jpg'))+sorted((ROOT/'design/hero/three-final').glob('*.jpg'))
manifest=ROOT/'lib/shop-image-manifest.json'
hero_only='--hero-only' in sys.argv
if hero_only:sources=[p for p in sources if p.parent.name=='three-final']
set_only='--sets-only' in sys.argv
if set_only:sources=[p for p in sources if p.parent==ROOT/'public/shop' and p.stem.endswith('-set')]
result=json.loads(manifest.read_text()) if hero_only or set_only else {}
with ThreadPoolExecutor(max_workers=3) as pool:
    result.update(pool.map(encode,sources))
# Unused historic campaign artwork is encoded, but not shipped in client JS.
result={k:v for k,v in result.items() if not k.startswith('campaign-')}
(ROOT/'lib/shop-image-manifest.json').write_text(json.dumps(result,indent=1)+'\n',encoding='utf-8')
print(f'{len(sources)} masters encoded; {len(result)} active images in manifest.')
