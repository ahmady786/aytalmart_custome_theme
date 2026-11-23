import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
export const runtime='nodejs'
const reply=(message:string,status=200)=>NextResponse.json({message},{status,headers:{'Cache-Control':'no-store'}})
export async function POST(req:Request){
  const body=await req.json().catch(()=>null)
  const ref=typeof body?.ref==='string'?body.ref.trim().toLowerCase():''
  const phone=typeof body?.phone==='string'?body.phone.trim():''
  if(!/^ps-[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(ref)||!/^[-+()\s\d]{7,24}$/.test(phone)||phone.replace(/\D/g,'').length<7)return reply('Check the PS reference and phone number from checkout.',400)
  const missing=()=>reply('No matching request found. Check both details and try again.',404)
  try{
    const order=JSON.parse(await readFile(path.join(process.cwd(),'.shop-orders','PS-'+ref.slice(3)+'.json'),'utf8'))
    if(order.customer.phone.replace(/\D/g,'')!==phone.replace(/\D/g,''))return missing()
    const statuses:Record<string,string>={requested:'Request received. Delivery and payment are pending confirmation.',confirmed:'Your order has been confirmed.',shipped:'Your order has been marked as shipped.',delivered:'Your order has been marked as delivered.',cancelled:'Your order was cancelled.'}
    return reply(statuses[order.status]||'Request found. Please contact the store for its latest status.')
  }catch(e){return (e as NodeJS.ErrnoException).code==='ENOENT'?missing():reply('Order lookup is temporarily unavailable.',503)}
}
