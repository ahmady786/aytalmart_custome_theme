'use client'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useEffect,useRef,useState} from 'react'
import {finishes,money,offerPrice,swatches,type Product} from '@/lib/catalog'
import {checkoutLink} from '@/lib/checkout-link'
import ProductGallery from './ProductGallery'
import DeliveryEstimate from './DeliveryEstimate'
import PairPicker from './PairPicker'
import ParcelNote from './ParcelNote'
import ProductActivity from './ProductActivity'

export default function ProductDetail({p,title}:{p:Product;title?:string}){
  const router=useRouter()
  const [quantity,setQuantity]=useState(1)
  const buyButton=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    const button=buyButton.current
    if(!button||typeof IntersectionObserver==='undefined')return
    const observer=new IntersectionObserver(([entry])=>{
      button.toggleAttribute('data-in-view',entry.intersectionRatio>=0.6)
    },{threshold:[0,0.6]})
    observer.observe(button)
    return ()=>observer.disconnect()
  },[])
  const itemName=p.finish+' '+p.name
  return <section className="detail-wrap pdp">
    <nav aria-label="Breadcrumb" className="pdp-crumb"><Link href="/">Home</Link><span>/</span><Link prefetch={false} href="/collection">Collection</Link><span>/</span><b>{p.finish} {p.kind==='set'?'set':'stand'}</b></nav>
    <div className="detail-grid"><ProductGallery p={p}/>
      <div className="detail-copy purchase-panel">
        <h1>{title||itemName}</h1><div className="prices large"><del>{money(p.original)}</del><strong>{money(p.price)}</strong><span className="pdp-discount">Sale</span></div>
        <ProductActivity key={p.sku} product={p.sku}/>
        <p className="buy-label">Select colour: <strong>{p.finish}</strong></p>
        <div className="buy-swatches" role="group" aria-label="Choose finish">{finishes.map(f=><Link prefetch={false} scroll={false} key={f} aria-label={f} title={f} aria-current={f===p.finish?'page':undefined} href={'/products/'+f.toLowerCase()+'-'+p.kind}><i style={{backgroundColor:swatches[f]}}/></Link>)}</div>
        <p className="buy-label">Choose your stand</p>
        <div className="buy-options" role="group" aria-label="Choose stand type">{(['set','single'] as const).map(k=><Link key={k} prefetch={false} scroll={false} href={'/products/'+p.finish.toLowerCase()+'-'+k} aria-current={k===p.kind?'page':undefined}>{k==='set'?'With janamaz stand':'Without janamaz stand'}</Link>)}</div>
        <fieldset className="pack-offers"><legend>Choose your offer</legend>
          {[1,2].map(n=>{
            const {saving,total}=offerPrice(p,n)
            return <label key={n} className="pack-card" data-selected={quantity===n}>
              <input type="radio" name="pack" checked={quantity===n} onChange={()=>setQuantity(n)}/>
              <span className="pack-choice"><b>Buy {n}</b><small>{saving?money(saving)+' OFF':'Standard price'}</small></span>
              <span className="pack-price"><strong>{money(total)}</strong><del>{money(p.original*n)}</del></span>
              {n===2&&<span className="pack-ribbon">Most Popular</span>}
            </label>
          })}
        </fieldset>
        <button id="buy-cod" ref={buyButton} className="buy-cod" aria-haspopup="dialog" onClick={()=>router.push(checkoutLink([{sku:p.sku,quantity}]),{scroll:false})}><span className="buy-cod-face">
          <svg width="21" height="21" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h3l2.2 11h11.5L22 6H6M8 17h11"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>
          Buy with Cash on Delivery</span></button>
        <ParcelNote/>
        <p className="buy-description"><strong>Wall-mounted Islamic design.</strong> A Quran pocket with cutout Arabic calligraphy and five hooks for your tasbeeh.{p.kind==='set'?' Includes a matching rail for your janamaz.':''}</p>
        <details open><summary>What you receive</summary><p>{p.kind==='set'?'One Quran holder, one matching janamaz rail, five integrated hooks, seven screws and seven wall plugs.':'One Quran stand with five integrated hooks.'} The Quran, tasbeeh and prayer mat shown are display accessories.</p></details>
        <DeliveryEstimate/>
        <details><summary>Placement &amp; fit</summary><p>Leave space above the pocket to lift your Quran out. {p.kind==='set'?'The rail mounts separately so you can allow room for your folded mat. ':''}</p><Link prefetch={false} className="text-link" href="/pages/care-installation-guide">Care &amp; installation →</Link></details>
      </div>
    </div>
    <PairPicker p={p}/>
  </section>
}
