import ShopImage from './ShopImage'
import Link from 'next/link'
import { finishes, kinds, money, standOptionLabel, swatches } from '@/lib/catalog'

export function CollectionPair(){
  return <div className="collection-pair">{(['set','single'] as const).map((k,i)=><Link prefetch={false} className={'collection-tile tile-'+k} key={k} href={'/collection?type='+k}>
    <div className="tile-image"><ShopImage asset={(i?'silver-single':'gold-set')+'-photo'} alt={i?'Silver Quran holder with its five hooks':'Gold Quran holder and separate matching janamaz rail in use'} sizes="(max-width:760px) 41vw, (max-width:1536px) 21vw, 320px" maxWidth={800}/></div>
    <div className="tile-copy"><h3>{standOptionLabel[k]}</h3><p>{i?'Quran holder with five tasbeeh hooks.':'Quran holder with a matching janamaz rail.'}</p><b>{money(kinds[k].price)}</b><span>Explore collection →</span></div>
  </Link>)}</div>
}
export function FinishLinks(){
  return <div className="finish-list">{finishes.map(f=><Link prefetch={false} key={f} href={'/collection?finish='+f}><i style={{background:swatches[f]}} aria-hidden="true"/><span>{f}</span><small>Set &amp; single</small><b aria-hidden="true">↗</b></Link>)}</div>
}
