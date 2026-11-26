import { NextResponse } from 'next/server'
import { mkdir, readFile, writeFile, link, unlink } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { priceLines, productFor, totals, validLines } from '@/lib/catalog'
import {createReceiptGrant,orderDir,receiptCookie,receiptLifetime} from '@/lib/order-receipt-server'
export const runtime='nodejs'
const fields=['name','phone','address','city'] as const
const limits={ name:[2,80], phone:[7,24], address:[5,350], city:[2,80] }
const fail=(error:string,status:number)=>NextResponse.json({error},{status})

export async function POST(req:Request){
  const origin=req.headers.get('origin')
  if(origin && origin!==new URL(req.url).origin && new URL(origin).host!==req.headers.get('host'))return fail('Invalid order origin.',403)
  const input=await req.json().catch(()=>null)
  if(!input || typeof input.id!=='string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(input.id) ||
    !validLines(input.items) || !input.items.length || !input.customer)return fail('Please check your items and delivery details.',400)
  const customer:Record<string,string>={}
  for(const key of fields){
    const value=input.customer[key]
    if(typeof value!=='string' || value.trim().length<limits[key][0] || value.trim().length>limits[key][1])return fail('Please check your '+key+'.',400)
    customer[key]=value.trim()
  }
  if(!/^[+\d\s()-]+$/.test(customer.phone) || customer.phone.replace(/\D/g,'').length<7)return fail('Enter a valid contact number.',400)
  if(input.customer.email!==undefined&&input.customer.email!==''){
    const email=input.customer.email
    if(typeof email!=='string'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return fail('Enter a valid email address or leave it blank.',400)
    customer.email=email.trim()
  }
  const values=priceLines(input.items)
  const lines=input.items.map((line:{sku:string;quantity:number},i:number)=>{
    const p=productFor(line.sku)!
    const offer=values[i]
    return {sku:p.sku,name:p.name,finish:p.finish,quantity:line.quantity,unitPrice:p.price,original:p.original,packSavings:offer.saving,lineTotal:offer.total}
  })
  const subtotal=totals(input.items).sale
  const ref='PS-'+input.id.toLowerCase()
  const order={ref,createdAt:new Date().toISOString(),status:'requested',currency:'PKR',customer,items:lines,subtotal}
  const dir=orderDir
  const filename=path.join(dir,ref+'.json')
  const temp=path.join(dir,randomUUID()+'.tmp')
  try{
    await mkdir(dir,{recursive:true,mode:0o700})
    const grant=await createReceiptGrant(ref)
    await writeFile(temp,JSON.stringify(order,null,2),{flag:'wx',mode:0o600})
    let savedTotal=subtotal
    try{await link(temp,filename)}catch(error){
      if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error
      const stored=JSON.parse(await readFile(filename,'utf8'))
      if(JSON.stringify(stored.customer)!==JSON.stringify(customer)||!validLines(stored.items)||stored.items.length!==lines.length||!stored.items.every((item:{sku:string;quantity:number},i:number)=>item.sku===lines[i].sku&&item.quantity===lines[i].quantity))return fail('Please refresh checkout and try again.',409)
      savedTotal=stored.subtotal
    }
    const receiptPath='/order-success/'+ref
    const response=NextResponse.json({ref,subtotal:savedTotal},{status:201,headers:{'Cache-Control':'private, no-store'}})
    const url=new URL(req.url)
    response.cookies.set(receiptCookie,grant,{httpOnly:true,sameSite:'lax',secure:url.protocol==='https:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname),maxAge:receiptLifetime,path:receiptPath})
    return response
  }catch{return fail('Your request could not be saved. Please retry.',503)}
  finally{await unlink(temp).catch(()=>{})}
}
