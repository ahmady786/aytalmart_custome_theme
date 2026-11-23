import Link from 'next/link'
import {shopMeta} from '@/lib/shop-seo'
export const metadata=shopMeta('/blogs/news','AYTAL MART journal','Practical notes on choosing a Quran holder and planning wall space for your prayer mat and tasbeeh.')
export default function Journal(){
  return <section className="shop-section info-wrap"><h1>Guides for your prayer space</h1>
    <div className="journal-list">{[['01','Choosing between a single stand and a full set','Compare the Quran pocket, tasbeeh hooks and janamaz rail.','/guide'],['02','Planning the space between your stands','Allow room for prayer beads, your folded mat and lifting the Quran.','/pages/care-installation-guide']].map(([n,t,d,url])=><Link href={url} key={n}><h2>{t}</h2><p>{d}</p><span className="text-link">Read the guide →</span></Link>)}</div></section>
}
