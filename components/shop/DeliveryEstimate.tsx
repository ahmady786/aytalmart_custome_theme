'use client'
import {useId,useState} from 'react'
import Link from 'next/link'
const regions={'Lahore':'1–2 days','Punjab outside Lahore':'2–3 days','Other provinces':'4–6 days'}
export default function DeliveryEstimate(){
  const id=useId(),[region,setRegion]=useState<keyof typeof regions>('Lahore')
  return <details className="delivery-estimate"><summary>Delivery &amp; parcel opening</summary>
    <p>Free home delivery across Pakistan. Pay cash on delivery. Parcel opening is allowed.</p>
    <label htmlFor={id}>Estimate for your area</label><select id={id} value={region} onChange={e=>setRegion(e.target.value as keyof typeof regions)}>{Object.keys(regions).map(r=><option key={r}>{r}</option>)}</select>
    <p aria-live="polite">Estimated delivery: <b>{regions[region]}</b> after dispatch. Processing usually takes one business day after confirmation.</p>
    <Link prefetch={false} className="text-link" href="/pages/shipping-policy">Read shipping policy →</Link>
  </details>
}
