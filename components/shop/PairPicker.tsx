'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {checkoutLink} from '@/lib/checkout-link'
import {money,productFor,totals,type Product} from '@/lib/catalog'
import ShopImage from './ShopImage'

export default function PairPicker({p}:{p:Product}){
  const other=productFor(p.finish.toLowerCase()+'-'+(p.kind==='set'?'single':'set'))!
  const router=useRouter(),[choice,setChoice]=useState([p.sku,other.sku])
  const pair=[p,other],selected=pair.filter(item=>choice.includes(item.sku))
  const lines=selected.map(item=>({sku:item.sku,quantity:1}))
  const {sale,regular}=totals(lines)
  return <section id="shop-together" className="pdp-pair" aria-labelledby="pair-title">
    <header className="pair-heading"><h2 id="pair-title">Shop together</h2>
      <p>Choose a complete set, a single stand, or both in {p.finish.toLowerCase()}.</p></header>
    <div className="pair-items" role="group" aria-label="Choose your pieces">{pair.map(item=><label key={item.sku} data-selected={choice.includes(item.sku)}>
      <span className="pair-thumb studio-window"><ShopImage asset={item.sku} sizes="88px" maxWidth={192} alt=""/></span>
      <span className="pair-copy"><small>{item.finish} finish</small><b>{item.name}</b>
        <span className="pair-price"><strong>{money(item.price)}</strong> <del>{money(item.original)}</del></span></span>
      <input type="checkbox" aria-label={item.finish+' '+item.name} checked={choice.includes(item.sku)} onChange={e=>setChoice(e.target.checked?[...choice,item.sku]:choice.filter(s=>s!==item.sku))}/>
    </label>)}</div>
    <div className="pair-check"><div aria-live="polite" aria-atomic="true"><small>Selected total · {lines.length} {lines.length===1?'item':'items'}</small>
      <div className="pair-amount"><b>{money(sale)}</b>{lines.length>0&&<del>{money(regular)}</del>}</div>
      <span className="pair-saving">{lines.length?'You save '+money(regular-sale):'Choose an item to continue'}</span></div>
      <button className="shop-btn" aria-haspopup="dialog" disabled={!lines.length} onClick={()=>router.push(checkoutLink(lines),{scroll:false})}>Buy selected with COD</button></div>
  </section>
}
