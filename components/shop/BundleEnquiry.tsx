'use client'
import {useState} from 'react'
import DeliveryEstimate from './DeliveryEstimate'
import {productFor,swatches,type Finish} from '@/lib/catalog'
import ProductGallery from './ProductGallery'
import ParcelNote from './ParcelNote'
import ProductActivity from './ProductActivity'
import Link from 'next/link'

export default function BundleEnquiry({title,black}:{title:string;black:boolean}){
  const [finish,setFinish]=useState<Finish>(black?'Black':'Gold')
  return <section className="detail-wrap pdp"><nav className="pdp-crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/collection">Collection</Link><span>/</span>Double set</nav>
    <div className="detail-grid"><div><ProductGallery key={finish} p={productFor(finish.toLowerCase()+'-set')!}/><p className="bundle-photo-note">Photos show one complete set. This bundle includes two.</p></div>
    <div className="detail-copy purchase-panel bundle-enquiry"><h1>{title}</h1><ProductActivity product="double-set"/><p className="buy-label">Select colour: <strong>{finish}</strong></p>
    <div className="buy-swatches" role="group" aria-label="Bundle finish">{(['Gold','Black'] as const).map(f=><button type="button" title={f} aria-label={f} key={f} aria-pressed={f===finish} onClick={()=>setFinish(f)}><i style={{backgroundColor:swatches[f]}}/></button>)}</div>
    <div className="pdp-offer"><b>Two complete sets</b><span>Confirm bundle pricing and availability with our team.</span></div>
    <Link className="shop-btn" href="/pages/contact-aytal-mart#store-enquiry">Contact the store about this bundle →</Link>
    <ParcelNote/><DeliveryEstimate/></div></div></section>
}
