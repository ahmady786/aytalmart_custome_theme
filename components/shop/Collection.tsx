import Link from 'next/link'
import ShopImage from './ShopImage'
import { finishes, kinds, money, products, type Kind, type Product } from '@/lib/catalog'
export function ProductCard({p,badge}:{p:Product;badge?:string}){
  return <Link prefetch={false} className="sku-card" href={'/products/'+p.sku}>
    <div className="sku-art studio-window"><ShopImage asset={p.sku} alt={p.finish+' '+p.name+' studio view'} sizes="(max-width: 900px) 45vw, (max-width:1536px) 22vw, 330px"/></div>
    {badge&&<span className="merch-badge">{badge}</span>}
    <div className="sku-info"><small>{p.finish}</small><h3>{p.name}</h3>
      <div className="prices"><strong>{money(p.price)}</strong> <del>{money(p.original)}</del></div></div>
  </Link>
}
export function ProductGrid({kind,finish}:{kind?:string;finish?:string}) {
  const list = products.filter(p => (!kind || kind === p.kind) && (!finish || finish === p.finish))
  return <div className="sku-grid">{list.map(p=><ProductCard key={p.sku} p={p}/>)}</div>
}
export function Filters({kind,finish}:{kind?:Kind;finish?:string}) {
  const href=(k?:string,f?:string)=>{
    const q=new URLSearchParams()
    if(k) q.set('type',k)
    if(f) q.set('finish',f)
    return '/collection'+(q.size?'?'+q:'')
  }
  return <div className="filters"><nav aria-label="Filter by product">
    {[undefined,'set','single'].map(k=><Link prefetch={false} key={k||'all'} aria-current={kind===k?'true':undefined} href={href(k,finish)}>{!k?'All stands':k==='set'?'Full sets':kinds.single.name+' only'}</Link>)}
  </nav><nav aria-label="Filter by finish">{[undefined,...finishes].map(f=><Link prefetch={false} key={f||'all'} aria-current={finish===f?'true':undefined} href={href(kind,f)}>{f||'All finishes'}</Link>)}</nav></div>
}
