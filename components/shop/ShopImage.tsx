import manifest from '@/lib/shop-image-manifest.json'
import mobile from '@/lib/shop-mobile-heroes.json'

export const phoneMedia='(max-width:639px) and (orientation:portrait), (max-width:479px)'
export const tabletMedia='(min-width:480px) and (max-width:1099px) and (min-height:540px), (min-width:640px) and (max-width:1199px) and (orientation:portrait)'
type Props={asset:string;alt:string;sizes:string;eager?:boolean;maxWidth?:number;mobileAsset?:string}
const prefix='/shop/optimized/'
export function fullSize(asset:string){
  const entry=manifest[asset as keyof typeof manifest]
  return prefix+entry.webp[entry.webp.length-1]
}
/** Static responsive sources: no per-request encoder, uncropped masters, reserved geometry. */
export default function ShopImage({asset,alt,sizes,eager=false,maxWidth=1920,mobileAsset}:Props){
  const variants=mobile as Record<string,(typeof mobile)[keyof typeof mobile]>
  const entry=(mobileAsset && variants['wide-'+asset]) || manifest[asset as keyof typeof manifest]
  const regionalSource=(id:string,media:string)=>{
    const art=variants[id]
    if(!art)return null
    return (['avif','webp'] as const).map(fmt=><source key={id+fmt} media={media} width={art.width} height={art.height} type={'image/'+fmt} srcSet={art[fmt].map((f,i)=>prefix+f+' '+art.widths[i]+'w').join(', ')} sizes="100vw"/>)
  }
  const mobileSources=mobileAsset && [regionalSource(mobileAsset,phoneMedia),regionalSource('tablet-'+asset,tabletMedia)]
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
