import type {Metadata} from 'next'
export const siteOrigin='https://aytalmart.com'
export const homeTitle='Quran & Janamaz Stands in Pakistan | Aytal Mart'
export const homeDescription='Shop wall-mounted Quran stands and matching janamaz sets in Gold, White, Silver and Black from Aytal Mart. Free delivery across Pakistan and Cash on Delivery.'
export function excerpt(html:string,fallback:string){
  const text=html.replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()
  return !text?fallback:text.length<=155?text:text.slice(0,152).replace(/\s+\S*$/,'')+'…'
}
export function shopMeta(path:string,title:string,description:string,image='/shop/gold-set.jpg'):Metadata{
  const url=new URL(path,siteOrigin).href, imageUrl=new URL(image,siteOrigin).href
  const branded=title.replace(/aytal mart/gi,'AYTAL MART')
  return {title:{absolute:branded.endsWith('AYTAL MART')?branded:branded+' | AYTAL MART'},description,alternates:{canonical:url},
    openGraph:{type:'website',siteName:'AYTAL MART',locale:'en_PK',url,title:branded,description,images:[{url:imageUrl,alt:branded}]},
    twitter:{card:'summary_large_image',title,description,images:[imageUrl]}}
}
