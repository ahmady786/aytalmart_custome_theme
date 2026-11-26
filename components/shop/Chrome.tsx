'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {useEffect,useRef,useState} from 'react'
import {useShopCart} from './ShopCart'
import CartDrawer,{UtilityIcon} from './CartDrawer'
import { BrandLogo, DeliveryStrip } from './Brand'
import {phoneMedia} from './ShopImage'
const destinations=[
  ['Home','/'],['Collections','/collections'],['Stand guide','/guide'],['Contact','/pages/contact-aytal-mart'],
] as const

export function ShopHeader() {
  const cart=useShopCart()
  const path=usePathname()
  const units=cart.lines.reduce((n,l)=>n+l.quantity,0)
  const [open,setOpen]=useState(false)
  const mast=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    if(!open)return
    const outside=(e:PointerEvent)=>{if(!mast.current?.contains(e.target as Node))setOpen(false)}
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus()}}
    const size=matchMedia(phoneMedia),close=()=>{if(!size.matches)setOpen(false)}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);size.addEventListener('change',close)
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);size.removeEventListener('change',close)}
  },[open])
  return <>
    <a href="#shop-main" className="shop-skip">Skip to content</a>
    <DeliveryStrip/>
    <header ref={mast} className="store-mast" onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget as Node))setOpen(false)}}><div className="mast-inner">
      <BrandLogo/>
      <button ref={trigger} type="button" className="mast-toggle" aria-expanded={open} aria-controls="mast-navigation" aria-label={open?'Close menu':'Open menu'} onClick={()=>setOpen(v=>!v)}><svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d={open?'M5 5l14 14M19 5L5 19':'M3 5h18M3 12h18M3 19h18'}/></svg></button>
      <nav id="mast-navigation" aria-label="Store" className="mast-menu" data-open={open} onClick={()=>setOpen(false)}>{destinations.map(([label,href])=>{
        const section=href==='/collections' && (path==='/collection'||path.startsWith('/collections/')||path.startsWith('/products/'))
        return <Link key={href} prefetch={false} href={href} aria-current={path===href?'page':section?'location':undefined}>{label}</Link>
      })}<Link className="mast-phone-link" href="/pages/track-your-order">Track Order</Link><Link className="mast-phone-link" href="/my-account">My Account</Link></nav>
      <div className="mast-tools"><Link className="mast-account" prefetch={false} href="/my-account"><UtilityIcon account/> My Account</Link><button type="button" className="mast-cart" aria-haspopup="dialog" aria-label={'Open cart'+(cart.ready?', '+units+' items':'')} onClick={()=>{setOpen(false);cart.show()}}><UtilityIcon/><span>Cart</span><b aria-hidden="true">{cart.ready?units:'–'}</b></button></div>
    </div>
    </header>
    <CartDrawer/>
  </>
}
