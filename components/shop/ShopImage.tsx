import manifest from '@/lib/shop-image-manifest.json'
import mobile from '@/lib/shop-mobile-heroes.json'

export const phoneMedia='(max-width:740px), (max-width:950px) and (max-height:520px) and (orientation:landscape)'
type Props={asset:string;alt:string;sizes:string;eager?:boolean;maxWidth?:number;mobileAsset?:string}
const prefix='/shop/optimized/'
export function fullSize(asset:string){
  const entry=manifest[asset as keyof typeof manifest]
  return prefix+entry.webp[entry.webp.length-1]
}
/** Static responsive sources: no per-request encoder, uncropped masters, reserved geometry. */
export default function ShopImage({asset,alt,sizes,eager=false,maxWidth=1920,mobileAsset}:Props){
  const entry=manifest[asset as keyof typeof manifest]
  const portrait=mobile[mobileAsset as keyof typeof mobile]
  const mobileSources=portrait&&(['avif','webp'] as const).map(fmt=><source key={fmt} media={phoneMedia} width={portrait.width} height={portrait.height} type={'image/'+fmt} srcSet={portrait[fmt].map((f,i)=>prefix+f+' '+portrait.widths[i]+'w').join(', ')} sizes="(max-width:540px) 100vw, 540px"/>)
  const count=Math.max(1,entry.widths.filter(w=>w<=maxWidth).length)
  const srcSet=(format:'avif'|'webp')=>entry[format].slice(0,count).map((file,i)=>prefix+file+' '+entry.widths[i]+'w').join(', ')
  return <picture className="shop-picture">
    {mobileSources}
    <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes}/>
    {/* eslint-disable-next-line @next/next/no-img-element -- Pre-encoded, responsive WebP fallback to AVIF. */}
    <img src={prefix+entry.webp[Math.min(count-1,2)]} srcSet={srcSet('webp')} sizes={sizes} alt={alt}
      width={entry.width} height={entry.height} loading={eager?'eager':'lazy'} decoding="async" fetchPriority={eager?'high':undefined}/>
  </picture>
}
