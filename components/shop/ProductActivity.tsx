'use client'
import {useEffect,useState} from 'react'

type Counts={viewers:number|null;sold:number|null}
let tabId:string|undefined
function sessionId(){
  if(!tabId){
    const key='aytal:activity-session'
    try{tabId=sessionStorage.getItem(key)||crypto.randomUUID();sessionStorage.setItem(key,tabId)}
    catch{tabId=crypto.randomUUID()}
  }
  return tabId
}
function previewCounts(product:string,now:number):Counts{
  const slot=Math.floor(now/9000),offset=Array.from(product).reduce((h,c)=>h*31+c.charCodeAt(0)>>>0,1)%1000
  const local=now+5*3600_000,day=Math.floor(local/86400_000)
  return {viewers:Math.round(79+24*Math.sin((slot+offset)/12)+5*Math.cos((slot+offset)/3)),
    sold:Math.floor((local%86400_000)/86400_000*(28+day%27))}
}

export default function ProductActivity({product}:{product:string}){
  const [state,setState]=useState<({demo:boolean}&Counts)|null>(null)
  useEffect(()=>{
    const demo=['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('activity')!=='live'
    const controller=new AbortController()
    let busy=false
    async function update(){
      if(document.hidden||busy)return
      if(demo){setState({demo,...previewCounts(product,Date.now())});return}
      busy=true
      try{
        const res=await fetch('/api/shop/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({session:sessionId(),product}),signal:controller.signal})
        if(!res.ok)throw new Error()
        const data:Counts=await res.json()
        if(!controller.signal.aborted)setState({demo,...data})
      }catch{if(!controller.signal.aborted)setState(null)}finally{busy=false}
    }
    void update()
    const id=window.setInterval(update,demo?9000:25000)
    document.addEventListener('visibilitychange',update)
    return ()=>{controller.abort();clearInterval(id);document.removeEventListener('visibilitychange',update)}
  },[product])
  return <div id="product-activity" className="buy-activity-slot">{state&&(state.viewers!==null||state.sold!==null)&&<div className="buy-activity" title={state.demo?'Simulated local preview; these are not customer counts.':undefined} aria-label={state.demo?'Local preview, simulated activity':'Product activity'} aria-live="off">
    {state.viewers!==null&&<span className="activity-viewers"><i aria-hidden="true"/><b>{state.viewers>=100?'100+':state.viewers}</b> viewing now</span>}
    {state.sold!==null&&<span className="activity-sold" title="Complete sets ordered across the store today (Pakistan time), excluding pending and cancelled orders."><b>{state.sold}</b> {state.sold===1?'set':'sets'} sold today</span>}
  </div>}</div>
}
