'use client'
import {useLayoutEffect,useRef,useState} from 'react'
export default function CustomerAccount({native=false}:{native?:boolean}){
 const holder=useRef<HTMLDivElement>(null),[section,setSection]=useState<'Orders'|'Addresses'|null>(null)
 useLayoutEffect(()=>{
  if(!native)return
  const node=document.getElementById('ao-native-account'),parent=node?.parentElement
  if(!node||!parent||!holder.current)return
  holder.current.appendChild(node)
  return ()=>{parent.appendChild(node)}
 },[native])
 return <section className="shop-section ao-account"><h1>My Account</h1>{native?<div ref={holder}/>:<div className="account-preview">
 <p>This is a local theme preview. Sign-in and registration are available on the WordPress store.</p>
 <nav aria-label="Preview account sections">{(['Orders','Addresses'] as const).map(k=><button type="button" key={k} aria-pressed={section===k} onClick={()=>setSection(k)}>{k}</button>)}</nav>
 {section&&<p role="status">{section==='Orders'?'Your WooCommerce order history appears here when signed in.':'Your saved billing and shipping addresses appear here when signed in.'}</p>}</div>}</section>
}
