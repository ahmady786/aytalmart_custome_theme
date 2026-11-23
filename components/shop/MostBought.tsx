import Link from 'next/link'
import {unstable_cache} from 'next/cache'
import path from 'node:path'
import {productFor,products} from '@/lib/catalog'
import {purchasedUnits} from '@/lib/shop-activity-server'
import {ProductCard} from './Collection'

const known=new Set(products.map(p=>p.sku))
const recentSales=unstable_cache(()=>purchasedUnits(path.join(process.cwd(),'.shop-orders'),known,Date.now()),['shop-purchased-units-30d-v1'],{revalidate:300})
const picks=['gold-set','black-single','white-set','silver-single','silver-set','white-single','black-set','gold-single']
export default async function MostBought({exclude}:{exclude?:string}){
  const units:Record<string,number>=await recentSales().catch(()=>({}))
  const available=picks.filter(sku=>sku!==exclude)
  const ids=available.filter(sku=>units[sku]>0).sort((a,b)=>units[b]-units[a]).slice(0,4)
  const ranked=ids.length
  for(const sku of available){
    if(ids.length===4)break
    if(!ids.some(other=>productFor(other)!.finish===productFor(sku)!.finish))ids.push(sku)
  }
  return <section id="most-bought" className="shop-section most-bought" aria-labelledby="most-bought-title">
    <header><h2 id="most-bought-title">{ranked===4?'Bestsellers':'More stands'}</h2>
      <Link className="text-link" prefetch={false} href="/collection">View collection →</Link></header>
    <div className="sku-grid">{ids.map(sku=><ProductCard key={sku} p={productFor(sku)!}/>)}</div>
  </section>
}
