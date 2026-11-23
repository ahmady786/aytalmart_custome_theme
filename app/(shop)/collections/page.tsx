import Link from 'next/link'
import { CollectionPair, FinishLinks } from '@/components/shop/Discovery'
import data from '@/lib/aytal-content.json'
import {shopMeta} from '@/lib/shop-seo'
export const metadata=shopMeta('/collections','Shop by collection','Explore single Quran stands, complete prayer sets and the Aytal Mart metal collections. Choose by type or finish.')
export default function Collections(){
  const more=data.collections.filter(c=>!['complete-sets','quran-stands'].includes(c.slug)&&(c.products.length>0||Number((c as {count?:number}).count)>0))
  return <section className="shop-section discovery"><h1>Collections</h1><CollectionPair/>
    <div className="section-title finish-heading"><h2>Shop by finish</h2><Link className="text-link" href="/collections/all">All products →</Link></div><FinishLinks/>
    {more.length>0&&<><div className="section-title finish-heading"><h2>More collections</h2></div><div className="journal-list">{more.map(c=><Link key={c.slug} href={'/collections/'+c.slug}><h3>{c.title}</h3><span className="text-link">Explore →</span></Link>)}</div></>}</section>
}
