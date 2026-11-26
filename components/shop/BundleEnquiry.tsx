'use client'
import {useState} from 'react'
import DeliveryEstimate from './DeliveryEstimate'
import {productFor,swatches,kinds,money,type Finish} from '@/lib/catalog'
import {checkoutLink} from '@/lib/checkout-link'
import ProductGallery from './ProductGallery'
import ParcelNote from './ParcelNote'
import ProductActivity from './ProductActivity'
import Link from 'next/link'

export default function BundleEnquiry({title,black}:{title:string;black:boolean}){
  const [finish,setFinish]=useState<Finish>(black?'Black':'Gold')
  const p=productFor(finish.toLowerCase()+'-set'),canOrder=p&&(!('available' in p)||p.available!==false)
  return <section className="detail-wrap pdp"><nav className="pdp-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/collection">Collection</Link><span>/</span>Double set</nav>
    <div className="detail-grid"><div>{p&&<ProductGallery key={finish} p={p}/>}<p className="bundle-photo-note">Photos show one complete set. This bundle includes two.</p></div>
    <div className="detail-copy purchase-panel bundle-enquiry"><h1>{title}</h1>{p&&<ProductActivity product={p.sku}/>}<p className="buy-label">Select colour: <strong>{finish}</strong></p>
    <div className="buy-swatches" role="group" aria-label="Bundle finish">{(['Gold','Black'] as const).map(f=><button type="button" title={f} aria-label={f} key={f} aria-pressed={f===finish} onClick={()=>setFinish(f)}><i style={{backgroundColor:swatches[f]}}/></button>)}</div>
    <div className="pdp-offer"><b>Two complete sets · {money(kinds.set.pair)}</b><span>Bundle reference price: <del>{money(kinds.set.pairReference)}</del></span></div>
    {p&&canOrder?<Link className="shop-btn" href={checkoutLink([{sku:p.sku,quantity:2}])}>Buy both with Cash on Delivery →</Link>:<Link className="shop-btn" href="/pages/contact-aytal-mart#store-enquiry">Ask about availability →</Link>}
    <ParcelNote/><DeliveryEstimate/></div></div></section>
}
