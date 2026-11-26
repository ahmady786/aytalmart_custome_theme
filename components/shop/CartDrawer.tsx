'use client'
import Link from 'next/link'
import {useEffect,useRef} from 'react'
import {money,productFor} from '@/lib/catalog'
import {useShopCart} from './ShopCart'
import ShopImage from './ShopImage'
export function UtilityIcon({account=false}:{account?:boolean}){
 return <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{account?<><circle cx="12" cy="8" r="3.5"/><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"/></>:<><path d="M4 8h16l-1 13H5L4 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></>}</svg>
}
export default function CartDrawer(){
 const cart=useShopCart(),ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{if(!cart.open)return;const d=ref.current!,focus=document.activeElement,overflow=document.body.style.overflow
  d.showModal();document.body.style.overflow='hidden'
  return ()=>{d.close();document.body.style.overflow=overflow;if(focus instanceof HTMLElement&&focus.isConnected)focus.focus({preventScroll:true})}
 },[cart.open])
 if(!cart.open)return null
 return <dialog className="shop-cart-drawer" ref={ref} aria-labelledby="shop-cart-title" onCancel={e=>{e.preventDefault();cart.close()}} onClick={e=>{if(e.target===e.currentTarget&&e.clientX<e.currentTarget.getBoundingClientRect().left)cart.close()}}>
  <header><h2 id="shop-cart-title">Your cart</h2><button type="button" aria-label="Close cart" onClick={cart.close}>×</button></header>
  <CartContents drawer/>
 </dialog>
}
export function CartContents({drawer=false}:{drawer?:boolean}){
 const cart=useShopCart()
 return <div className="shop-cart-contents">
  {cart.error&&<p role="alert">{cart.error}</p>}
  {!cart.ready&&!cart.error&&<p role="status">Loading your cart…</p>}
  {cart.ready&&(!cart.lines.length?<div className="drawer-empty"><UtilityIcon/><p>Your cart is empty.</p><Link href="/collection" onClick={cart.close}>Explore stands →</Link></div>:<>
  <ul>{cart.lines.map(l=><li key={l.key}>{l.image?<img src={l.image} alt=""/>:productFor(l.key)?<ShopImage asset={l.key} sizes="62px" maxWidth={192} alt=""/>:null}
   <div><strong>{l.name}</strong><small>{l.detail}</small><b>{money(l.lineTotal)}</b>
   <div className="drawer-actions"><button disabled={cart.busy||l.quantity<=1} aria-label={'Decrease '+l.name} onClick={()=>cart.change(l.key,l.quantity-1)}>−</button><output>{l.quantity}</output><button disabled={cart.busy||(l.max>=0&&l.quantity>=l.max)} aria-label={'Increase '+l.name} onClick={()=>cart.change(l.key,l.quantity+1)}>+</button><button className="drawer-remove" disabled={cart.busy} aria-label={'Remove '+l.name} onClick={()=>cart.change(l.key,0)}>Remove</button></div></div>
  </li>)}</ul><footer><p><span>Subtotal</span><strong>{money(cart.lines.reduce((t,l)=>t+l.lineTotal,0))}</strong></p>{cart.busy?<button className="shop-btn" disabled>Updating…</button>:<Link className="shop-btn" onClick={cart.close} href="/checkout">Proceed to checkout →</Link>}</footer></>)}
 {drawer&&cart.lines.length>0&&<Link className="drawer-full" href="/cart" onClick={cart.close}>View full cart</Link>}
 </div>
}
