import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import { BagProvider } from '@/components/shop/Bag'
import { ShopHeader } from '@/components/shop/Chrome'
import { footerGroups } from '@/lib/shop-info'
import { siteOrigin,homeDescription } from '@/lib/shop-seo'
import { BrandLogo } from '@/components/shop/Brand'
import { brand } from '@/lib/shop-brand'
import './shop.css'
import './store-chrome.css'
import './product-display.css'
import './cod-checkout.css'
import './customer-care.css'
import './shop-cart.css'
export const viewport: Viewport = { themeColor: '#322419' }
export const metadata: Metadata = {
  metadataBase:new URL(siteOrigin),
  title: { default:brand.name, template:'%s | '+brand.name },
  description: homeDescription,
}
export default function ShopLayout({ children,quick }: { children: React.ReactNode;quick:React.ReactNode }) {
  return <div className="prayer-shop" id="store-top" tabIndex={-1}><BagProvider><ShopHeader/>
    <main id="shop-main">{children}</main>
    {quick}
    <footer className="store-footer"><div className="footer-shell">
      <div className="footer-intro"><BrandLogo stacked/><p className="footer-signature">Made in Lahore.</p>
      <Link className="footer-support" href="/pages/track-your-order">Track Order <span aria-hidden="true">→</span></Link></div>
      <div className="footer-directory"><section aria-label="Warehouse contact"><h2>Our warehouse</h2>
      <address className="footer-address"><span>{brand.warehouse}</span><a href={brand.tel}>{brand.phone}</a>
      <a href={'mailto:'+brand.support}>{brand.support}</a><a href={'mailto:'+brand.email}>{brand.email}</a><span>Support hours: 24/7</span></address></section>
      {footerGroups.map(g=><nav aria-label={g.title+' footer'} key={g.title}><h2>{g.title}</h2>{g.links.map(([title,url])=><Link key={url} href={url} prefetch={false}>{title}</Link>)}</nav>)}</div>
      <div className="footer-base"><small>© {new Date().getFullYear()} AYTAL MART</small><a href="#store-top">Back to top <span aria-hidden="true">↑</span></a></div>
      </div>
    </footer></BagProvider></div>
}
