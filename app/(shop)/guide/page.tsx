import Link from 'next/link'
import ShopImage from '@/components/shop/ShopImage'
import {kinds, money, type Kind} from '@/lib/catalog'
import {shopMeta} from '@/lib/shop-seo'
export const metadata=shopMeta('/guide','Quran stand buying guide','Compare the single Quran holder and the complete two-piece set, including hooks, rail, finishes and prices.')
export default function Guide(){
  return <section className="shop-section stand-guide"><h1>Stand guide</h1>
    <p className="guide-intro">Both holders have five tasbeeh hooks. Choose the complete set if you also want a rail for your janamaz.</p>
    <div className="stand-options">{(['set','single'] as Kind[]).map(k=><article key={k}>
      <div className="stand-photo"><ShopImage asset={'gold-'+k+'-photo'} sizes="(max-width:450px) 34vw, (max-width:740px) 30vw, 190px" maxWidth={640} alt={k==='set'?'Gold Quran holder above its matching janamaz rail':'Single gold wall-mounted Quran holder'}/></div>
      <div className="stand-option-copy"><h2>{kinds[k].name}</h2><p>{k==='set'?'Quran holder and matching janamaz rail.':'Quran holder only, without the rail.'}</p>
      <strong>{money(kinds[k].price)}</strong><Link className="shop-btn" href={'/collection?type='+k}>{k==='set'?'Shop sets':'Shop single stands'} →</Link></div>
    </article>)}</div><Link className="text-link guide-care" href="/pages/care-installation-guide">Care &amp; installation guide →</Link></section>
}
