import CheckoutDialog from '@/components/shop/CheckoutDialog'
import OrderFlow from '@/components/shop/OrderFlow'
import {checkoutItems} from '@/lib/checkout-link'

export default function QuickCheckout({searchParams}:{searchParams:{items?:string|string[]}}){
  return <CheckoutDialog><OrderFlow key={JSON.stringify(searchParams.items)||'saved'} selection={searchParams.items===undefined?undefined:checkoutItems(searchParams.items)}/></CheckoutDialog>
}
