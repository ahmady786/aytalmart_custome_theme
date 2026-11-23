import type {MetadataRoute} from 'next'
import {siteOrigin} from '@/lib/shop-seo'
import {products} from '@/lib/catalog'
import data from '@/lib/aytal-content.json'
export default function sitemap():MetadataRoute.Sitemap{
  const paths=['/','/collection','/collections','/collections/all','/guide','/blogs/news',...products.map(p=>'/products/'+p.sku),
    ...data.products.map(p=>'/products/'+p.slug),...data.collections.map(c=>'/collections/'+c.slug),...data.pages.map(p=>'/pages/'+p.slug)]
  return paths.map(path=>({url:new URL(path,siteOrigin).href}))
}
