import OrderFlow from '@/components/shop/OrderFlow'
import {checkoutItems} from '@/lib/checkout-link'
export const metadata={title:'Checkout',robots:{index:false,follow:false}}
export default function CheckoutPage({searchParams}:{searchParams:{items?:string|string[]}}){
  return <section className="cod-standalone"><h1>Cash on Delivery</h1><OrderFlow key={JSON.stringify(searchParams.items)||'saved'} selection={searchParams.items===undefined?undefined:checkoutItems(searchParams.items)}/></section>
}
