import { notFound } from 'next/navigation'
import { productFor, products, money, shot } from '@/lib/catalog'
import {shopMeta,excerpt,siteOrigin} from '@/lib/shop-seo'
import ProductDetail from '@/components/shop/ProductDetail'
import BundleEnquiry from '@/components/shop/BundleEnquiry'
import MostBought from '@/components/shop/MostBought'
import ProductReviews from '@/components/shop/ProductReviews'
import data from '@/lib/aytal-content.json'
import StoreCopy from '@/components/shop/StoreCopy'
import './buy-panel.css'
import './reviews.css'
export const dynamicParams=false
export const revalidate=300
export const generateStaticParams=()=>[...products.map(p=>p.sku),...data.products.map(p=>p.slug)].map(sku=>({sku}))
export function generateMetadata({params}:{params:{sku:string}}){
  const p=productFor(params.sku)
  const listing=data.products.find(x=>x.slug===params.sku)
  return p?shopMeta('/products/'+p.sku,p.finish+' '+p.name,p.finish+' '+p.name+' for '+money(p.price)+'. Five tasbeeh hooks'+(p.kind==='set'?' and a matching janamaz rail':'')+'. Free delivery across Pakistan.', shot(p)):
    listing?shopMeta('/products/'+listing.slug,listing.title,excerpt(listing.html,listing.title)):{}
}
export default function ProductPage({params}:{params:{sku:string}}){
  const p=productFor(params.sku)
  if(p)return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Product',sku:p.sku,name:p.finish+' '+p.name,color:p.finish,brand:{'@type':'Brand',name:'Aytal Mart'},image:siteOrigin+shot(p),offers:{'@type':'Offer',url:siteOrigin+'/products/'+p.sku,price:p.price,priceCurrency:'PKR'}}).replace(/</g,'\\u003c')}}/><ProductDetail key={p.sku} p={p}/><section className="shop-section info-wrap product-story">
    {p.kind==='set'?<StoreCopy html={data.products.find(x=>x.slug==='aytal-quran-and-janamaz-stand')!.html}/>:<><h2>Quran holder specifications</h2><p>Made in Lahore from 1 mm iron sheet, CNC laser cut and double powder coated. The Quran holder measures 16.11 inches long by 9.27 inches wide, with a holding height of 2.50 inches. Five hooks sit beneath the pocket. The separate janamaz rail is not included with the single stand.</p></>}</section><ProductReviews/><MostBought exclude={p.sku}/></>
  const listing=data.products.find(x=>x.slug===params.sku)
  if(!listing)notFound()
  const double=listing.slug.includes('double-set')
  const currentSet=productFor('gold-set')
  return <>{double?<BundleEnquiry title={listing.title} black={listing.slug.startsWith('black-')}/>:currentSet?<ProductDetail key={listing.slug} p={currentSet} title={listing.title}/>:<section className="shop-section"><h1>{listing.title}</h1><p>This set is currently unavailable.</p></section>}
    <section className="shop-section info-wrap product-story"><StoreCopy html={listing.html}/></section><MostBought exclude={double?undefined:'gold-set'}/></>
}
