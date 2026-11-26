"""Package the custom theme with only the allowlisted storefront materials. No env/order data."""
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
theme = root / 'wordpress/aytal-mart'
images = root / 'public/shop'
manifest = json.loads((root / 'lib/shop-image-manifest.json').read_text(encoding='utf8'))
copy = json.loads((root / 'lib/aytal-content.json').read_text(encoding='utf8'))
blob = {}
catalog = {}
angles = {'gold-set':[1464,1466], 'gold-single':[1453,1461], 'silver-set':[1474,1486],
          'silver-single':[1470,1479], 'black-set':[1512,1513], 'black-single':[1517,1518], 'white-set':[1443,1446]}
def media(key, width, name):
    m = manifest[key]
    filename = m['webp'][m['widths'].index(min(width,max(m['widths'])))]
    blob[name] = images / 'optimized' / filename
    return name
for kind in ('set','single'):
    for finish in ('Gold','White','Silver','Black'):
        sku = finish.lower()+'-'+kind
        gallery = [media(key,800,key+'.webp') for key in (sku,sku+'-photo')]
        for idx in angles.get(sku,[]):
            name='photo-'+str(idx)+'.webp';blob[name]=images/'angles'/(str(idx)+'-960.webp');gallery.append(name)
        desc = next(p['html'] for p in copy['products'] if p['slug']=='aytal-quran-and-janamaz-stand') if kind=='set' else '<p>Wall-mounted Quran holder in 1 mm CNC-cut, double powder-coated iron. Five hooks for tasbeeh. The Quran holder is 16.11 inches long by 9.27 inches wide, with a 2.50-inch holding depth. The Janamaz rail is not included.</p>'
        catalog[sku] = dict(finish=finish,kind=kind,media=gallery,price=2999 if kind=='set' else 2199,
            name=finish+' '+('Quran & Janamaz Stand Set' if kind=='set' else 'Quran Stand'),description=desc,
            summary='Quran holder with five tasbeeh hooks'+(' and a matching Janamaz rail.' if kind=='set' else '. Holder only, without Janamaz rail.'))
for i,key in enumerate(('hero-01-complete-sets','hero-02-quran-stands','hero-03-golden-gallery'),1):
    media(key,1600,'hero-'+str(i)+'.webp')
blob['aytal-mart.png']=root/'public/brand/aytal-mart.png'
out=root/'wordpress'/('aytal-mart-parent-2.0.8.zip' if '--release-208' in sys.argv else 'aytal-mart-upload.zip')
with ZipFile(out,'w',ZIP_DEFLATED) as z:
    for p in sorted(theme.glob('**/*')):
        if p.is_file() and p.suffix in ('.php','.json','.html','.css','.js'):
            z.write(p,'aytal-mart/'+p.relative_to(theme).as_posix())
    z.writestr('aytal-mart/starter/catalog.json',json.dumps(dict(catalog=catalog,pages=copy['pages']),ensure_ascii=False))
    for name,src in blob.items():
        assert src.is_file() and re.fullmatch(r'[a-z0-9-]+\.(png|webp)',name)
        z.write(src,'aytal-mart/starter/'+name)
with ZipFile(out) as z:
    assert z.testzip() is None and all('..' not in p and p.startswith('aytal-mart/') for p in z.namelist())
    data=json.loads(z.read('aytal-mart/starter/catalog.json')); assert len(data['catalog'])==8 and len(data['pages'])==10
    for sku,p in data['catalog'].items():
        assert p['price']==(2999 if sku.endswith('-set') else 2199)
        assert all('aytal-mart/starter/'+n in z.namelist() for n in p['media'])
print(f'{out}: {out.stat().st_size:,} bytes; 8 SKUs, 10 pages, 3 hero slides, {len(blob)} media files.')
