import Link from 'next/link'
import {brand} from '@/lib/shop-brand'
import HelpForm from './HelpForm'
import StoreCopy from './StoreCopy'

export default function CustomerCare({tracking,customHtml}:{tracking:boolean;customHtml?:string}){
  return <section className="shop-section care-page">
    <h1>{tracking?'Track your order':'Contact AYTAL MART'}</h1>
    <div className={'care-layout'+(tracking?' care-tracking':'')}>
      {tracking?<><section className="care-card"><h2>Check order status</h2>
        <p>Enter the order number from your confirmation and the phone number you used at checkout.</p>
        <HelpForm mode="track"/></section>
        <aside className="care-side">{customHtml?<StoreCopy html={customHtml}/>:<><h2>Track a dispatched parcel</h2><p>If you have a PostEx tracking number, use it to see your delivery updates.</p><a className="text-link" href="https://postex.pk/tracking">Track with PostEx ↗</a></>}
        <p className="care-foot"><Link href="/pages/contact-aytal-mart">Contact AYTAL MART →</Link></p></aside></>:
      <><section className="care-side">{customHtml?<StoreCopy html={customHtml}/>:<><h2>Customer support</h2>
        <a className="shop-btn" href={brand.whatsapp}>Chat on WhatsApp ↗</a>
        <dl><dt>Phone</dt><dd><a href={brand.tel}>{brand.phone}</a></dd>
        <dt>Email</dt><dd><a href={'mailto:'+brand.support}>{brand.support}</a></dd>
        <dt>General enquiries</dt><dd><a href={'mailto:'+brand.email}>{brand.email}</a></dd>
        <dt>Warehouse</dt><dd>{brand.warehouse}</dd></dl></>}</section>
        <section id="store-enquiry" className="care-card"><h2>Send a message</h2><HelpForm mode="contact"/></section></>}
    </div></section>
}
