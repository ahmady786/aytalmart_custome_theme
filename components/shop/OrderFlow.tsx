'use client'
import {useEffect,useId,useRef,useState,type ComponentPropsWithoutRef,type FormEvent} from 'react'
import Link from 'next/link'
import {money,priceLines,productFor,standOptionLabel,totals,type CartLine} from '@/lib/catalog'
import {brand} from '@/lib/shop-brand'
import {checkoutLink} from '@/lib/checkout-link'
import ShopImage from './ShopImage'
import {useBag} from './Bag'

export type CartQuote={hash:string;lines:{key:string;name:string;image:string;detail:string;quantity:number;max:number;lineTotal:number}[];subtotal:number;packSavings:number;discount:number;fees:{label:string;value:number}[];tax:number;shipping:number;total:number}
export type CartSource={quote:CartQuote;change:(hash:string,key:string,quantity:number)=>Promise<CartQuote>;place:(quote:CartQuote,customer:Record<string,string>)=>Promise<string>}
export default function OrderFlow({selection,cart}:{selection?:CartLine[];cart?:CartSource}){
  // Old bookmarked checkouts may still have saved items. A Buy click never uses them.
  const saved=useBag(),[direct,setDirect]=useState(selection??[])
  const [quote,setQuote]=useState(cart?.quote)
  useEffect(()=>{if(!cart)return;const sync=(e:Event)=>setQuote((e as CustomEvent<CartQuote>).detail)
    window.addEventListener('ao-cart-updated',sync);return()=>window.removeEventListener('ao-cart-updated',sync)},[cart])
  const items=cart?[]:selection===undefined?saved.items:direct
  const [busy,setBusy]=useState(false),[error,setError]=useState('')
  const sending=useRef(false),retry=useRef({signature:'',id:''})
  const amount=quote?{sale:quote.total,packSavings:quote.packSavings}:totals(items)
  const values=priceLines(items)
  const rows=quote?quote.lines.map(l=>({...l,asset:'',label:l.name})):items.map(({sku,quantity},i)=>{
    const p=productFor(sku)!;return {key:sku,quantity,max:20,name:p.name,label:p.finish+' '+p.name,detail:p.finish+' · '+standOptionLabel[p.kind],asset:sku+'-photo',image:'',lineTotal:values[i].total}
  })
  const shipping=quote?.shipping?money(quote.shipping):'Free'
  const [adjusting,setAdjusting]=useState(false)
  async function change(sku:string,n:number){
    if(sending.current||n<1)return
    if(cart&&quote){
      sending.current=true;setAdjusting(true);setBusy(true);setError('')
      try{setQuote(await cart.change(quote.hash,sku,n))}catch(err){setError(err instanceof Error?err.message:'Could not update quantity.')}
      finally{sending.current=false;setBusy(false);setAdjusting(false)}return
    }
    if(n>20)return
    if(selection===undefined)saved.update(sku,n)
    else {
      const next=direct.map(l=>l.sku===sku?{sku,quantity:n}:l)
      setDirect(next)
      history.replaceState(history.state,'',checkoutLink(next))
    }
  }
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault()
    if(sending.current||!rows.length)return
    const form=new FormData(e.currentTarget)
    const customer=Object.fromEntries(['name','address','phone','city','email'].map(k=>[k,String(form.get(k)||'').trim()]))
    const signature=JSON.stringify({items,customer})
    if(signature!==retry.current.signature)retry.current={signature,id:crypto.randomUUID()}
    sending.current=true;setBusy(true);setError('')
    try{
      if(cart&&quote){window.location.replace(await cart.place(quote,customer));return}
      const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:retry.current.id,items,customer})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error||'Your order could not be saved. Please retry.')
      if(selection===undefined)saved.clear()
      // Leave the intercepted dialog and replace checkout, so Back cannot resubmit it.
      window.location.replace('/order-success/'+encodeURIComponent(data.ref))
    }catch(err){sending.current=false;setBusy(false);setError(err instanceof Error?err.message:'Could not reach the store. Please retry.')}
  }
  if(!cart&&selection===undefined&&!saved.ready)return <p className="cod-result">Loading checkout…</p>
  if(!rows.length)return <section className="cod-result"><h2>Choose a product to start checkout.</h2><Link className="shop-btn" href="/collection">Shop the collection →</Link></section>
  const orderText='Assalam o alaikum, I would like to order: '+rows.map(l=>l.quantity+' × '+l.label).join('; ')+'. Total '+money(amount.sale)+', shipping: '+shipping+', cash on delivery.'
  return <form className="cod-form" onSubmit={submit} aria-busy={busy}>
    <section className="cod-shipping"><p className="shop-kicker">Delivery details</p><h3>Enter your shipping address</h3>
      <fieldset disabled={busy} className="cod-fields"><legend className="sr-only">Shipping address</legend>
        <DeliveryField label="Full name" hint="پورا نام" name="name" required minLength={2} maxLength={80} autoComplete="name" placeholder="Full name"/>
        <DeliveryField label="Delivery address" hint="مکمل پتہ" name="address" required minLength={5} maxLength={350} autoComplete="street-address" placeholder="House, street, area or landmark"/>
        <DeliveryField label="Phone number" hint="رابطہ نمبر" name="phone" type="tel" required minLength={7} maxLength={24} autoComplete="tel" placeholder="03XX XXXXXXX"/>
        <DeliveryField label="City" hint="شہر کا نام" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" placeholder="City"/>
        <DeliveryField label="Email (optional)" hint="اختیاری ای میل" name="email" type="email" maxLength={254} autoComplete="email" placeholder="you@example.com"/>
      </fieldset>
      <p className="cod-section-label">Shipping method</p><div className="cod-method"><span>◉ &nbsp; Home delivery</span><b>{shipping}</b></div>
    </section>
    <section className="cod-review" aria-label="Order summary">
      {rows.map(({key,asset,image,name,label,detail,lineTotal,quantity,max})=>{
        return <div key={key} className="cod-item">{asset?<ShopImage asset={asset} alt={label} sizes="64px" maxWidth={192}/>:<img width={64} height={64} src={image} alt={label}/>}
          <div><b>{name}</b><small>{detail}</small><strong>{money(lineTotal)}</strong>
            <div className="cod-qty" role="group" aria-label={label+' quantity'}><button type="button" disabled={busy||quantity<=1} aria-label={'Decrease '+label+' quantity'} onClick={()=>change(key,quantity-1)}>−</button>
              <output>{quantity}</output><button type="button" disabled={busy||(max>=0&&quantity>=max)} aria-label={'Increase '+label+' quantity'} onClick={()=>change(key,quantity+1)}>+</button></div>
          </div></div>
      })}
      <dl className="cod-totals"><dt>Subtotal</dt><dd>{money(quote?.subtotal??amount.sale+amount.packSavings)}</dd>
        {amount.packSavings>0&&<><dt>Multi-buy savings</dt><dd>−{money(amount.packSavings)}</dd></>}
        {!!quote?.discount&&<><dt>Coupon savings</dt><dd>−{money(quote.discount)}</dd></>}
        {quote?.fees.map((f,i)=><Fee key={i} label={f.label} value={f.value}/>)}
        {!!quote?.tax&&<Fee label="Tax" value={quote.tax}/>}
        <dt>Shipping</dt><dd>{shipping}</dd><dt className="cod-total">Total</dt><dd className="cod-total" aria-live="polite">{money(amount.sale)}</dd></dl>
      {error&&<p role="alert" className="cod-error">{error}</p>}
      <button className="shop-btn cod-submit" type="submit" disabled={busy}>{adjusting?'Updating quantity…':busy?'Saving order…':'Complete order — '+money(amount.sale)}</button>
      {!busy&&<a className="cod-whatsapp" href={brand.whatsapp+'?text='+encodeURIComponent(orderText)} target="_blank" rel="noopener noreferrer">Buy on WhatsApp ↗</a>}
    </section>
  </form>
}
function Fee({label,value}:{label:string;value:number}){return <><dt>{label}</dt><dd>{money(value)}</dd></>}
function DeliveryField({label,hint,...input}:ComponentPropsWithoutRef<'input'> & {label:string;hint:string}){
  const id=useId()
  return <div className="cod-field">
    <div className="cod-field-copy">
      <label htmlFor={id}>{label}</label>
      <span className="cod-field-hint" id={id+'-hint'} lang="ur" dir="rtl">{hint}</span>
    </div>
    <input {...input} id={id} aria-describedby={id+'-hint'}/>
  </div>
}
