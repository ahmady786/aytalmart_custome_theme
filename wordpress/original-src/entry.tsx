import React,{useState,useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import Layout from '../../app/(shop)/layout'
import Home from '../../app/(shop)/page'
import Guide from '../../app/(shop)/guide/page'
import Archive from '../../app/(shop)/collection/page'
import Collections from '../../app/(shop)/collections/page'
import Category from '../../app/(shop)/collections/[slug]/page'
import Journal from '../../app/(shop)/blogs/news/page'
import Info from '../../app/(shop)/pages/[slug]/page'
import Product from '../../app/(shop)/products/[sku]/page'
import Receipt from '../../app/(shop)/order-success/[ref]/page'
import Checkout from '../../app/(shop)/checkout/page'
import CartPage from '../../app/(shop)/cart/page'
import CustomerAccount from '../../components/shop/CustomerAccount'
import Dialog from '../../components/shop/CheckoutDialog'
import Flow from '../../components/shop/OrderFlow'
import {checkoutItems} from '../../lib/checkout-link'
import {cfg,cartSource} from './platform'
function Content(){const r=cfg.route,p=r.split('/').filter(Boolean),query=Object.fromEntries(new URLSearchParams(location.search));let view;
  if(r==='/cart')view=<CartPage/>;else if(r==='/my-account')view=<CustomerAccount native={!!cfg.cartView}/>;else if(r==='/')view=<Home/>;else if(r==='/guide')view=<Guide/>;else if(r==='/collection')view=<Archive searchParams={query}/>;else if(r==='/collections')view=<Collections/>;else if(p[0]==='collections')view=<Category params={{slug:p[1]}}/>;
  else if(p[0]==='products')view=<Product params={{sku:p[1]}}/>;else if(p[0]==='pages')view=<Info params={{slug:p[1]}}/>;else if(r==='/blogs/news')view=<Journal/>;else if(r==='/checkout')view=cartSource?<section className="cod-standalone"><h1>Cash on Delivery</h1><Flow cart={cartSource}/></section>:<Checkout searchParams={query}/>;else if(r==='/receipt')view=<Receipt params={{ref:cfg.receipt.ref}}/>;
  return <>{view}{(r==='/collection'||r==='/collections/all'||p[0]==='collections')&&cfg.extra?.length>0&&<section className="shop-section"><div className="sku-grid">{cfg.extra.filter((v:any)=>!p[1]||p[1]==='all'||v.categories.includes(p[1])).map((v:any)=><a className="sku-card" href={v.url} key={v.url}><div className="sku-art">{v.image&&<img src={v.image} alt={v.name}/>}</div><div className="sku-info"><h3>{v.name}</h3><strong dangerouslySetInnerHTML={{__html:v.price}}/></div></a>)}</div></section>}</>}
function Store(){const [selection,set]=useState<string|null>(null);
 useEffect(()=>{const sync=()=>set(history.state?.aoModal?new URLSearchParams(location.search).get('items'):null);sync();addEventListener('ao-modal',sync);addEventListener('popstate',sync);return()=>{removeEventListener('ao-modal',sync);removeEventListener('popstate',sync)}},[]);
 return <Layout quick={selection!==null?<Dialog><Flow key={selection} selection={checkoutItems(selection)}/></Dialog>:null}><Content/></Layout>}
createRoot(document.getElementById('ao-store')!).render(<Store/>);
