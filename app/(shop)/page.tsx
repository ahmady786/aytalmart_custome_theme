import Link from 'next/link'
import HeroCarousel from '@/components/shop/HeroCarousel'
import { ProductGrid } from '@/components/shop/Collection'
import { CollectionPair, FinishLinks } from '@/components/shop/Discovery'
import {questions} from '@/lib/shop-info'
import {shopMeta,homeTitle,homeDescription} from '@/lib/shop-seo'
export const metadata=shopMeta('/',homeTitle,homeDescription)
export default function Home() {
  return <>
    <HeroCarousel/>
    <section className="shop-section discovery" id="collection"><div className="section-title"><h2>Shop by stand type</h2>
      <Link prefetch={false} className="text-link" href="/collections">All collections ↗</Link></div><CollectionPair/></section>
    <section className="finish-band"><div className="shop-section"><div className="section-title"><h2>Shop by finish</h2></div><FinishLinks/></div></section>
    <section className="shop-section"><div className="section-title"><h2>Quran &amp; Janamaz sets</h2><Link prefetch={false} className="text-link" href="/collection">All stands ↗</Link></div><ProductGrid kind="set"/></section>
    <section className="help-band"><div className="shop-section home-help"><div><h2>The stand guide.</h2><p>Start with what you want to keep on your wall: your Quran and tasbeeh, or your folded janamaz too.</p><Link prefetch={false} className="text-link" href="/guide">Compare the two stands →</Link></div>
    <div className="question-list">{questions.slice(0,3).map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}<Link prefetch={false} className="text-link" href="/pages/faq">Read all FAQs ↗</Link></div></div></section>
  </>
}
