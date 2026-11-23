'use client'
import {useState,type FormEvent} from 'react'
export default function HelpForm({mode}:{mode:'contact'|'track'}){
  const tracking=mode==='track'
  const [busy,setBusy]=useState(false)
  const [result,setResult]=useState<{ok:boolean;text:string}|null>(null)
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(busy)return
    const form=e.currentTarget
    setBusy(true);setResult(null)
    try{
      const response=await fetch(tracking?'/api/orders/status':'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))})
      const data=await response.json()
      setResult({ok:response.ok,text:data.message||'Please try again.'});if(response.ok&&!tracking)form.reset()
    }catch{setResult({ok:false,text:'Could not reach the store. Please try again.'})}finally{setBusy(false)}
  }
  return <form className="order-form support-form" onSubmit={submit}>
    {tracking?<><label>Order number<input name="ref" required maxLength={39} autoCapitalize="none" spellCheck={false}/></label><label>Phone used at checkout<input name="phone" type="tel" required minLength={7} maxLength={24} autoComplete="tel"/></label></>:
    <><label>Your email<input name="email" type="email" autoComplete="email" maxLength={254} required/></label><label>Your message<textarea name="message" rows={5} minLength={10} maxLength={1800} required/></label></>}
    <button className="shop-btn" disabled={busy}>{busy?'Please wait…':tracking?'Check status':'Send message'}</button>
    <div aria-live="polite">{result&&<p className={result.ok?'support-success':'support-error'}>{result.text}</p>}</div>
  </form>
}
