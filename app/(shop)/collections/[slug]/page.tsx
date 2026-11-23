import Link from 'next/link'
import {notFound} from 'next/navigation'
import data from '@/lib/aytal-content.json'
import StoreCopy from '@/components/shop/StoreCopy'
import {ProductGrid} from '@/components/shop/Collection'
import {shopMeta,excerpt} from '@/lib/shop-seo'
export const dynamicParams=false
export const generateStaticParams=()=>['all',...data.collections.map(c=>c.slug)].map(slug=>({slug}))
export function generateMetadata({params}:{params:{slug:string}}){const c=data.collections.find(x=>x.slug===params.slug);return shopMeta('/collections/'+params.slug,c?.title||'All products',excerpt(c?.html||'','Explore the complete Aytal Mart catalogue of prayer stands, janamaz sets and metal collections in Pakistan.'))}
export default function StoreCollection({params}:{params:{slug:string}}){
  const all=params.slug==='all',c=data.collections.find(c=>c.slug===params.slug)
  if(!c&&!all)notFound()
  const products=all?data.products:data.products.filter(p=>c?.products.includes(p.slug))
  return <section className="shop-section"><h1>{c?.title||'All products'}</h1>
    {c&&<StoreCopy html={c.html}/>}
    {(all||c?.slug==='islamic-collection')&&<><div className="section-title"><h2>The finish collection</h2></div><ProductGrid/></>}
    {products.length>0?<><div className="section-title finish-heading"><h2>Related products</h2></div><div className="journal-list">{products.map(p=><Link key={p.slug} href={'/products/'+p.slug}><h3>{p.title}</h3><span className="text-link">Product details →</span></Link>)}</div></>:<p className="service-note">No products are listed in this collection yet. <Link href="/collections">Browse other collections →</Link></p>}</section>
}
