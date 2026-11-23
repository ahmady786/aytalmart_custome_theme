import Link from 'next/link'
import {notFound, permanentRedirect} from 'next/navigation'
import data from '@/lib/aytal-content.json'
import CustomerCare from '@/components/shop/CustomerCare'
import StoreCopy from '@/components/shop/StoreCopy'
import {shopMeta,excerpt} from '@/lib/shop-seo'

const aliases:Record<string,string>={about:'about-aytal-mart',contact:'contact-aytal-mart'}
export const dynamicParams=false
export const generateStaticParams=()=>[...data.pages.map(p=>p.slug),...Object.keys(aliases)].map(slug=>({slug}))
export function generateMetadata({params}:{params:{slug:string}}){
  const page=data.pages.find(p=>p.slug===(aliases[params.slug]||params.slug))
  return page?shopMeta('/pages/'+page.slug,page.title,excerpt(page.html,page.title)):{}
}
export default function InfoPage({params}:{params:{slug:string}}){
  if(aliases[params.slug])permanentRedirect('/pages/'+aliases[params.slug])
  const page=data.pages.find(p=>p.slug===params.slug)
  if(!page)notFound()
  const contact=page.slug==='contact-aytal-mart',tracking=page.slug==='track-your-order'
  if(contact||tracking)return <CustomerCare tracking={tracking} customHtml={(page as typeof page & {customCopy?:boolean}).customCopy?page.html:undefined}/>
  const html=page.slug==='faq'?page.html.replace(/Golden\s*—\s*Glossy Finish<\/strong>\s*<br\s*\/?>\s*<strong>Black\s*—\s*Matte Finish/i,'Gold, White, Silver and Black'):page.html
  return <section className="shop-section info-wrap"><h1>{page.title}</h1>
    <div className="info-columns"><div className="info-content"><StoreCopy html={html}/></div>
    <nav className="help-aside" aria-label="Customer care">{[['FAQs','/pages/faq'],['Track Order','/pages/track-your-order'],['Contact us','/pages/contact-aytal-mart']].filter(([,h])=>h!=='/pages/'+page.slug).map(([t,h])=><Link href={h} key={h}>{t} →</Link>)}</nav></div></section>
}
