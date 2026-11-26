'use client'
import {useState} from 'react'
import Link from 'next/link'
import {useRouter} from 'next/navigation'
import ShopImage from './ShopImage'
import {products,totals,money,finishes} from '@/lib/catalog'
import {checkoutLink} from '@/lib/checkout-link'
import rates from '@/lib/stand-rates.json'
const circles=[
 {label:'Complete sets',sku:'gold-set',filter:'type=set'},
 {label:'Quran stands',sku:'silver-single',filter:'type=single'},
 ...finishes.map(f=>({label:f+' finish',sku:f.toLowerCase()+'-set',filter:'finish='+f})),
]
export function CollectionCircles(){return <nav className="collection-rounds" aria-label="Browse collections">{circles.map(c=><Link key={c.filter} prefetch={false} href={'/collection?'+c.filter}><span><ShopImage asset={c.sku+'-photo'} sizes="(max-width:740px) 26vw, 138px" maxWidth={400} alt=""/></span><b>{c.label}</b></Link>)}</nav>}
export function SetDuo(){
 const choices=products.filter(p=>p.kind==='set'&&(!('available' in p)||p.available!==false))
 const [selection,set]=useState<string[]>([choices[0]?.sku,choices[1]?.sku||choices[0]?.sku]),router=useRouter()
 if(!choices.length)return null
 const picked=selection.map(s=>choices.find(p=>p.sku===s)||choices[0])
 const lines=picked[0].sku===picked[1].sku?[{sku:picked[0].sku,quantity:2}]:picked.map(p=>({sku:p.sku,quantity:1}))
 const amount=totals(lines)
 return <section className="shop-section duo-section" id="shop-together" aria-labelledby="duo-title"><div><p className="shop-kicker">The two-set offer</p><h2 id="duo-title">Shop together</h2><p>One for your prayer space, one to share. Pick two complete sets in matching or different finishes.</p></div>
 <div className="duo-choices">{picked.map((p,i)=><label key={i}><span className="studio-window"><ShopImage asset={p.sku} alt="" sizes="145px" maxWidth={320}/></span><b>Set {i+1}</b><select aria-label={'Set '+(i+1)+' finish'} value={p.sku} onChange={e=>set(selection.map((k,n)=>i===n?e.target.value:k))}>{choices.map(x=><option key={x.sku} value={x.sku}>{x.finish}</option>)}</select></label>)}</div>
 <div className="duo-buy"><small>Both complete sets</small><del aria-label="Previous bundle price">{money(rates.set.pairReference)}</del><strong>{money(amount.sale)}</strong><span>Separately {money(picked[0].price+picked[1].price)}</span><button className="shop-btn" type="button" aria-haspopup="dialog" onClick={()=>router.push(checkoutLink(lines),{scroll:false})}>Buy both with COD →</button></div></section>
}
