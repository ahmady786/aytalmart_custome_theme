import {NextResponse} from 'next/server'
import {mkdir,writeFile} from 'node:fs/promises'
import {randomUUID} from 'node:crypto'
import path from 'node:path'
export const runtime='nodejs'
const reply=(message:string,status:number)=>NextResponse.json({message},{status})
export async function POST(req:Request){
  if(req.headers.get('sec-fetch-site')==='cross-site')return reply('Submit your enquiry from the contact page.',403)
  if(!req.headers.get('content-type')?.includes('application/json'))return reply('Expected a contact form.',415)
  if(Number(req.headers.get('content-length'))>12000)return reply('Message too long.',413)
  const body=await req.json().catch(()=>null)
  const email=typeof body?.email==='string'?body.email.trim():''
  const message=typeof body?.message==='string'?body.message.trim():''
  if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||message.length<10||message.length>1800)return reply('Check your email and enter a message of 10–1,800 characters.',400)
  const id=randomUUID()
  try{
    const dir=path.join(process.cwd(),'.shop-enquiries')
    await mkdir(dir,{recursive:true,mode:0o700})
    await writeFile(path.join(dir,id+'.json'),JSON.stringify({id,email,message,createdAt:new Date().toISOString()}),{flag:'wx',mode:0o600})
    return reply('Your enquiry has been recorded. Reference: '+id,201)
  }catch{return reply('Could not save your enquiry. Please try again.',503)}
}
