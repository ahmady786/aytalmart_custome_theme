import {createHmac,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto'
import {link,readFile,unlink,writeFile} from 'node:fs/promises'
import path from 'node:path'
import type {CartLine} from './catalog'

export const receiptCookie='aytal_receipt'
export const receiptLifetime=60*60*24
export const orderDir=path.join(process.cwd(),'.shop-orders')
const keyFile=path.join(orderDir,'.receipt-key')
const refPattern=/^PS-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
type StoredOrder={
  ref:string;createdAt:string;status:string;subtotal:number
  customer:{name:string;address:string;city:string;phone:string;email?:string}
  items:(CartLine&{name:string;finish:string;unitPrice:number;packSavings?:number;lineTotal?:number})[]
}
async function signingKey(){
  try{return await readFile(keyFile)}catch(err){if((err as NodeJS.ErrnoException).code!=='ENOENT')throw err}
  // Publish the complete key atomically, including when two first orders arrive together.
  const tmp=path.join(orderDir,randomUUID()+'.tmp')
  await writeFile(tmp,randomBytes(32),{flag:'wx',mode:0o600})
  try{await link(tmp,keyFile)}catch(err){if((err as NodeJS.ErrnoException).code!=='EEXIST')throw err}
  finally{await unlink(tmp)}
  return readFile(keyFile)
}
function sign(key:Buffer,ref:string,expires:string){
  return createHmac('sha256',key).update(ref+':'+expires).digest('hex')
}
export async function createReceiptGrant(ref:string){
  const expires=String(Math.floor(Date.now()/1000)+receiptLifetime)
  return expires+'.'+sign(await signingKey(),ref,expires)
}
export async function readReceipt(ref:string,grant?:string):Promise<StoredOrder|null>{
  const parts=/^(\d{10})\.([a-f0-9]{64})$/.exec(grant||'')
  if(!refPattern.test(ref)||!parts||Number(parts[1])<=Date.now()/1000)return null
  try{
    const expected=sign(await readFile(keyFile),ref,parts[1])
    if(!timingSafeEqual(Buffer.from(parts[2],'hex'),Buffer.from(expected,'hex')))return null
    return JSON.parse(await readFile(path.join(orderDir,ref+'.json'),'utf8'))
  }catch(err){if((err as NodeJS.ErrnoException).code==='ENOENT')return null;throw err}
}
