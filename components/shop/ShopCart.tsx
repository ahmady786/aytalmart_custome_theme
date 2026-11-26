'use client'
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {priceLines,productFor,standOptionLabel,type CartLine} from '@/lib/catalog'
import type {CartQuote} from './OrderFlow'

export type CartTransport={read:()=>Promise<CartQuote>;write:(fields:Record<string,string>)=>Promise<CartQuote>}
type ContextValue={lines:CartQuote['lines'];open:boolean;busy:boolean;error:string;show:()=>void;close:()=>void;add:(sku:string,n:number)=>void;change:(key:string,n:number)=>void;ready:boolean}
const CartContext=createContext<ContextValue|null>(null)
export function useShopCart(){const cart=useContext(CartContext);if(!cart)throw Error('Missing cart provider');return cart}
export default function ShopCartProvider({children,items,update,ready,transport}:{children:ReactNode;items:CartLine[];update:(key:string,n:number)=>void;ready:boolean;transport?:CartTransport}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[quote,setQuote]=useState<CartQuote|null>(null)
 const writing=useRef(false),sequence=useRef(0)
 const refresh=useCallback(async()=>{
  if(!transport||writing.current)return
  const id=++sequence.current
  try{const next=await transport.read();if(id===sequence.current){setQuote(next);setError('')}}
  catch{if(id===sequence.current)setError('Could not load your cart. Please reopen it to retry.')}
 },[transport])
 useEffect(()=>{
  const sync=(e:Event)=>{++sequence.current;setQuote((e as CustomEvent<CartQuote>).detail)}
  const visible=()=>{if(!document.hidden)void refresh()}
  const restored=(e:PageTransitionEvent)=>{if(e.persisted)void refresh()}
  void refresh();window.addEventListener('ao-cart-updated',sync);window.addEventListener('pageshow',restored);document.addEventListener('visibilitychange',visible)
  return ()=>{++sequence.current;window.removeEventListener('ao-cart-updated',sync);window.removeEventListener('pageshow',restored);document.removeEventListener('visibilitychange',visible)}
 },[refresh])
 async function write(mode:'add'|'quantity',key:string,n:number){
  if(writing.current)return
  if(mode==='add')setOpen(true)
  setError('')
  if(!Number.isInteger(n)||n<0)return
  if(!transport){
   const total=(mode==='add'?(items.find(i=>i.sku===key)?.quantity||0):0)+n
   if(total>20){setError('Maximum 20 per stand.');return}update(key,total);return
  }
  writing.current=true;++sequence.current;setBusy(true)
  try{
   const old=quote??await transport.read()
   const next=await transport.write({mode,hash:old.hash,[mode==='add'?'sku':'key']:key,quantity:String(n)})
   window.dispatchEvent(new CustomEvent('ao-cart-updated',{detail:next}))
  }catch(e){setError(e instanceof Error?e.message:'Cart could not be updated.');try{setQuote(await transport.read())}catch{/* keep last good snapshot */}}
  finally{writing.current=false;setBusy(false)}
 }
 const values=priceLines(items)
 const lines=transport?(quote?.lines||[]):items.flatMap((i,index)=>{const p=productFor(i.sku);return p?[{key:i.sku,name:p.name,detail:p.finish+' · '+standOptionLabel[p.kind],quantity:i.quantity,max:20,image:'',lineTotal:values[index].total}]:[]})
 return <CartContext.Provider value={{lines,open,busy,error,ready:transport?!!quote:ready,show:()=>{setOpen(true);void refresh()},close:()=>setOpen(false),add:(sku,n)=>void write('add',sku,n),change:(key,n)=>void write('quantity',key,n)}}>{children}</CartContext.Provider>
}
