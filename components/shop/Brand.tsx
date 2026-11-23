import Image from 'next/image'
import Link from 'next/link'
import {brand} from '@/lib/shop-brand'
export function BrandLogo({stacked=false}:{stacked?:boolean}){
  return <Link href="/" prefetch={false} aria-label={brand.name+' home'} className={'brand-lockup'+(stacked?' stacked':'')}>
    {stacked?<Image src="/brand/aytal-mart.png" unoptimized width={120} height={90} alt={brand.name}/>:
    <><Image src="/brand/aytal-mark.png" unoptimized width={40} height={32} alt=""/><span>{brand.name}</span></>}
  </Link>
}
const benefits=[
  ['Cash on Delivery','M3 6h18v12H3z M7 10h.01 M17 14h.01 M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0'],
  ['Free Home Delivery','M2 6h12v11H2z M14 10h4l4 4v3h-8 M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0 M20 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0'],
  ['Allow to Open','M3 9l9-5 9 5-9 5z M3 9v9l9 5 9-5V9 M12 14v9 M7 7l9 5'],
] as const
export function DeliveryStrip(){
  return <div className="offer-strip delivery-strip" aria-label="Delivery benefits">{benefits.map(([name,d])=><span key={name}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"><path d={d}/></svg>{name}</span>)}</div>
}
