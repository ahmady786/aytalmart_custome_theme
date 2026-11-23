"""Compare served codec pixels with the same uncompressed Lanczos resize.
Requires Pillow and numpy. SSIM here is mean luminance SSIM over 8x8 blocks.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageOps

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'lib/shop-image-manifest.json').read_text())
def blocks(im):
    a=np.array(im.convert('L'),dtype=np.float32)
    h,w=(v//8*8 for v in a.shape)
    return a[:h,:w].reshape(h//8,8,w//8,8).transpose(0,2,1,3).reshape(-1,64)
def score(ref,encoded):
    x,y=blocks(ref),blocks(encoded)
    a,b=x.mean(1),y.mean(1)
    cov=((x-a[:,None])*(y-b[:,None])).mean(1)
    return float(np.mean(((2*a*b+6.5025)*(2*cov+58.5225))/((a*a+b*b+6.5025)*(x.var(1)+y.var(1)+58.5225))))
for fmt in ('avif','webp'):
    results=[]
    for key,row in data.items():
        source=root/('design/hero/three-final/'+key[5:]+'.jpg' if key.startswith('hero-') else 'public/shop/'+key+'.jpg')
        with Image.open(source) as original:
            im=ImageOps.exif_transpose(original).convert('RGB')
            n=row['widths'].index(800)
            with Image.open(root/'public/shop/optimized'/row[fmt][n]) as target:
                ref=im.resize((800,round(im.height*800/im.width)),Image.Resampling.LANCZOS)
                assert ref.size==target.size
                results.append((score(ref,target),key))
    print(fmt,'800px /',len(results),'assets: minimum SSIM',min(results),'mean',sum(s for s,_ in results)/len(results))
