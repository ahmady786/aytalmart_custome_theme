import Link from 'next/link'
import {cookies} from 'next/headers'
import ShopImage from '@/components/shop/ShopImage'
import {checkoutLink} from '@/lib/checkout-link'
import {money,productFor,standOptionLabel} from '@/lib/catalog'
import {readReceipt,receiptCookie} from '@/lib/order-receipt-server'
import './receipt.css'

export const dynamic='force-dynamic'
export const runtime='nodejs'
export const metadata={title:'Order receipt',referrer:'no-referrer' as const,robots:{index:false,follow:false}}
const date=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Karachi'})
const time=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Karachi'})

export default async function ReceiptPage({params}:{params:{ref:string}}){
  const order=await readReceipt(params.ref,cookies().get(receiptCookie)?.value)
  if(!order)return <section className="order-receipt"><div className="receipt-card receipt-unavailable">
    <h1>This receipt is private</h1><p>Open it in the browser you used at checkout. You can also check your order using your reference and phone number.</p>
    <Link className="shop-btn" href="/pages/track-your-order">Check order status →</Link></div></section>
  const {ref,customer,items,subtotal}=order,placed=new Date(order.createdAt)
  const saving=items.reduce((s,item)=>s+(item.packSavings??0),0)
  return <article className="order-receipt" aria-label="Order receipt">
    <header className="receipt-head"><Link className="receipt-back" href="/collection" aria-label="Back to collection">←</Link>
      <div><p className="shop-kicker">Order placed successfully</p><h1>Order #{ref.slice(3,11).toUpperCase()}</h1><p>Placed {date.format(placed)}</p></div>
      <Link prefetch={false} className="receipt-again" href={checkoutLink(items)}>Buy again</Link></header>
    <section className="receipt-card"><div className="receipt-balance"><strong>{money(subtotal)} PKR</strong><span>Cash on delivery</span></div>
      <p>No payment was taken at checkout. Pay the courier when your order arrives.</p></section>
    <section className="receipt-card"><h2><span className="receipt-check" aria-hidden="true">✓</span> Order received</h2>
      <p>Thank you, {customer.name}. We’ve received your order and will confirm it before dispatch.</p>
      <time dateTime={order.createdAt}>{date.format(placed)} at {time.format(placed)} PKT</time></section>
    <section className="receipt-card" aria-label="Items and totals">
      {items.map(i=>{const product=productFor(i.sku);return <div className="receipt-item" key={i.sku}>
        <div className="receipt-thumb">{product&&<ShopImage asset={i.sku+'-photo'} sizes="58px" maxWidth={192} alt=""/>}<span aria-label={'Quantity '+i.quantity}>{i.quantity}</span></div>
        <div><strong>{i.name}</strong><small>{[i.finish,product&&standOptionLabel[product.kind]].filter(Boolean).join(' / ')}</small></div>
        <b>{money(i.lineTotal??i.unitPrice*i.quantity)}</b></div>})}
      <dl className="receipt-totals"><dt>Subtotal</dt><dd>{money(subtotal+saving)}</dd>
        {saving>0&&<><dt>Multi-buy savings</dt><dd>−{money(saving)}</dd></>}
        <dt>Shipping</dt><dd>Free</dd><dt className="grand">Total</dt><dd className="grand"><small>PKR</small> {money(subtotal)}</dd></dl>
    </section>
    <dl className="receipt-card receipt-info"><div><dt>Contact</dt><dd>{customer.email||customer.phone}</dd></div>
      <div><dt>Ship to</dt><dd>{customer.name}<br/>{customer.address}<br/>{customer.city}, Pakistan<br/>{customer.phone}</dd></div>
      <div><dt>Method</dt><dd>Free home delivery</dd></div>
      <div><dt>Payment</dt><dd>Cash on Delivery (COD)<small>{money(subtotal)} PKR · Unpaid at checkout</small></dd></div>
    </dl>
    <footer className="receipt-track"><div>Tracking reference <b data-order-ref>{ref}</b></div>
      <Link prefetch={false} href="/pages/track-your-order">Check order status →</Link></footer>
  </article>
}
