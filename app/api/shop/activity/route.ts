import path from 'node:path'
import {NextResponse} from 'next/server'
import {products} from '@/lib/catalog'
import {countTodaysSets,shopDay,viewersFor} from '@/lib/shop-activity-server'

export const runtime='nodejs'
const setSkus=new Set(products.filter(p=>p.kind==='set').map(p=>p.sku))
const productKeys=new Set([...products.map(p=>p.sku),'double-set'])
const dir=path.join(process.cwd(),'.shop-orders')
let cache:{day:string;until:number;result:Promise<number|null>}|undefined

export async function POST(req:Request){
  const reply=(value:object,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}})
  const origin=req.headers.get('origin')
  if(origin&&origin!==new URL(req.url).origin){
    try{if(new URL(origin).host!==req.headers.get('host'))return reply({error:'Invalid origin'},403)}
    catch{return reply({error:'Invalid origin'},403)}
  }
  const body=await req.json().catch(()=>null)
  if(!body||!productKeys.has(body.product)||typeof body.session!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(body.session))return reply({error:'Invalid activity'},400)
  const now=Date.now(),day=shopDay(now)
  if(!cache||now>=cache.until||cache.day!==day){
    cache={day,until:now+45_000,result:countTodaysSets(dir,setSkus,now).catch(()=>null)}
  }
  return reply({viewers:viewersFor(body.session,body.product,now),sold:await cache.result})
}
