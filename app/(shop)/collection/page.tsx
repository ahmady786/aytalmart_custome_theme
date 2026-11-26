import { Filters, ProductGrid } from '@/components/shop/Collection'
import { finishes,standOptionLabel } from '@/lib/catalog'
import {shopMeta} from '@/lib/shop-seo'
export const metadata=shopMeta('/collection','Shop prayer stands by finish','Compare Gold, White, Silver and Black wall-mounted Quran holders and complete janamaz sets. Filter by finish and stand type.')
export default function Collection({searchParams}:{searchParams:{type?:string;finish?:string}}){
  const kind = searchParams.type === 'single' || searchParams.type === 'set' ? searchParams.type : undefined
  const finish = finishes.find(f => f === searchParams.finish)
  const title=[finish,kind?standOptionLabel[kind]:'All stands'].filter(Boolean).join(' · ')
  return <section className="shop-section"><h1>{title}</h1>
    <Filters kind={kind} finish={finish}/><ProductGrid kind={kind} finish={finish}/></section>
}
