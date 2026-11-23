import {opendir, readFile, stat} from 'node:fs/promises'
import path from 'node:path'

const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Karachi',year:'numeric',month:'2-digit',day:'2-digit'})
export const shopDay=(time:number)=>dayFormatter.format(time)
const saleStates=new Set(['confirmed','shipped','delivered'])
const orderFile=/^PS-[a-f\d-]{36}\.json$/i

// Return only catalog IDs and units; pending COD requests are not purchases.
export async function purchasedUnits(dir:string,known:ReadonlySet<string>,now:number){
  const units:Record<string,number>={},cutoff=now-30*86400_000
  let files
  try{files=await opendir(dir)}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return units;throw error}
  for await(const entry of files){
    if(!entry.isFile()||!orderFile.test(entry.name))continue
    const file=path.join(dir,entry.name)
    try{
      if((await stat(file)).mtimeMs<cutoff)continue
      const order=JSON.parse(await readFile(file,'utf8')),placed=Date.parse(order.createdAt)
      if(!saleStates.has(order.status)||!Number.isFinite(placed)||placed<cutoff||placed>now||!Array.isArray(order.items))continue
      for(const line of order.items)if(line&&known.has(line.sku)&&Number.isSafeInteger(line.quantity)&&line.quantity>0)
        units[line.sku]=(units[line.sku]??0)+line.quantity
    }catch(error){if(!(error instanceof SyntaxError)&&(error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
  }
  return units
}

// Today is the Pakistan order date. Count complete set units, not order records.
export async function countTodaysSets(dir:string,setSkus:ReadonlySet<string>,now:number){
  const day=shopDay(now)
  let total=0
  let files
  try{files=await opendir(dir)}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return 0;throw error}
  for await(const entry of files){
    if(!entry.isFile()||!orderFile.test(entry.name))continue
    const file=path.join(dir,entry.name)
    if((await stat(file)).mtimeMs<now-86400000)continue
    const order=JSON.parse(await readFile(file,'utf8'))
    const placed=Date.parse(order.createdAt)
    if(!saleStates.has(order.status)||!Number.isFinite(placed)||shopDay(placed)!==day)continue
    for(const item of order.items)if(setSkus.has(item.sku)&&Number.isSafeInteger(item.quantity)&&item.quantity>0)total+=item.quantity
  }
  return total
}

// Anonymous, short-lived tab presence on the same Node instance as the file-backed store.
const active=new Map<string,{product:string;seen:number}>()
export function viewersFor(id:string,product:string,now:number){
  let count=0
  active.forEach((view,key)=>{
    if(now-view.seen>=60_000)active.delete(key)
    else if(key!==id&&view.product===product)count++
  })
  if(!active.has(id)&&active.size>=5000)return null
  active.set(id,{product,seen:now})
  return count+1
}
