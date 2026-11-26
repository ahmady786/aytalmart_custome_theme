import React from 'react'
export const cfg=JSON.parse(document.getElementById('ao-context')!.textContent!)
export function resolveUrl(path:string){if(!path?.startsWith('/')||path.startsWith('//'))return path;
  const [,p,tail]=path.match(/^([^?#]*)(.*)$/)!;return (cfg.urls[p]||cfg.home.replace(/\/$/,'')+p)+tail}
export default function Link({href,prefetch,scroll,children,...props}:any){return <a href={resolveUrl(href)} {...props}>{children}</a>}
export function BrandImage({src,unoptimized,...attrs}:any){return <img src={cfg.logo||cfg.base+src} {...attrs}/>}
export const usePathname=()=>cfg.route;
export const useRouter=()=>({push(path:string){if(path.startsWith('/checkout?') && cfg.route!=='/checkout'){history.pushState({aoModal:true},'',resolveUrl(path));dispatchEvent(new Event('ao-modal'))}else location.assign(resolveUrl(path))},back:()=>history.back()})
export function notFound():never{throw Error('This page is unavailable')}
export function permanentRedirect(path:string):never{location.replace(resolveUrl(path));throw Error('Redirecting')}
async function post(url:string,body:Record<string,string>){const r=await fetch(url,{method:'POST',credentials:'same-origin',referrer:location.origin+'/',referrerPolicy:'same-origin',cache:'no-store',body:new URLSearchParams(body)});const v=await r.json();if(!r.ok||v.success===false)throw Error(typeof v.data==='string'?v.data:'Could not reach the store.');return v}
export async function submitWoo(items:any[],customer:Record<string,string>,total:number){
  const boot=(await post(cfg.boot,{})).data;const prep=(await post(cfg.ajax,{nonce:boot.nonce,items:JSON.stringify(items)})).data;
  return placePrepared(prep,customer,total,items)
}
export const cartSource=cfg.cart?{
  quote:cfg.cart,
  async change(hash:string,key:string,quantity:number){const quote=await cartAction({mode:'quantity',hash,key,quantity:String(quantity)});window.dispatchEvent(new CustomEvent('ao-cart-updated',{detail:quote}));return quote},
  async place(quote:{hash:string,total:number},customer:Record<string,string>){return placePrepared(await cartAction({mode:'prepare',hash:quote.hash}),customer,quote.total)}
}:undefined
export const drawerCart=cfg.cartView?{read:async()=>(await post(cfg.cartView,{})).data,write:cartAction}:undefined
async function cartAction(fields:Record<string,string>){const boot=(await post(cfg.boot,{})).data;return (await post(cfg.cartEndpoint,{...fields,nonce:boot.nonce})).data}
async function placePrepared(prep:any,customer:Record<string,string>,total:number,buyItems?:any[]){
  if(Math.abs(prep.total-total)>.01)throw Error('The price has changed. Refresh this page before ordering.');
  const body:any={billing_first_name:customer.name,billing_last_name:'',billing_country:'PK',billing_address_1:customer.address,billing_city:customer.city,billing_phone:customer.phone,billing_email:customer.email,payment_method:'cod',ao_direct:'1',ao_total:String(total),'woocommerce-process-checkout-nonce':prep.nonce};
  if(buyItems)body.ao_buy_items=JSON.stringify(buyItems);
  Object.entries(prep.shipping).forEach(([i,v])=>body['shipping_method['+i+']']=v);
  const result=await post(cfg.checkout,body);if(result.result!=='success'){const msg=new DOMParser().parseFromString(result.messages||'Please check your details.','text/html');throw Error(msg.body.textContent?.trim()||'Please check your details.');}
  const dest=new URL(result.redirect,location.href);if(dest.origin!==location.origin)throw Error('Unexpected order confirmation address.');return dest.href;
}
export async function help(fields:Record<string,string>){try{const b=(await post(cfg.boot,{})).data;return {ok:true,message:(await post(cfg.help,{...fields,nonce:b.nonce})).data}}catch(e){return {ok:false,message:(e as Error).message}}}
