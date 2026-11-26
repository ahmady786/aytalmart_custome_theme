// Static GitHub Pages export. Copy only public CSS, images and client-side routes.
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..')
module.exports=function(output){
 const prefix='/aytalmart_custome_theme',base=prefix+'/theme',dist=path.join(root,'wordpress/aytal-original/dist')
 const data=require('../lib/aytal-content.json'),rates=require('../lib/stand-rates.json')
 const catalog=['set','single'].flatMap(kind=>['Gold','White','Silver','Black'].map(finish=>({kind,sku:finish.toLowerCase()+'-'+kind,finish,name:kind==='set'?'Quran & Janamaz Stand Set':'Quran Stand',...rates[kind],available:true,sales:0})))
 const routes=new Set(['/','/collection','/collections','/collections/all','/guide','/blogs/news','/checkout','/cart','/my-account',...catalog.map(p=>'/products/'+p.sku),...data.products.map(p=>'/products/'+p.slug),...data.collections.map(c=>'/collections/'+c.slug),...data.pages.map(p=>'/pages/'+p.slug)])
 for(const dir of ['brand','shop'])fs.cpSync(path.join(dist,dir),path.join(output,'theme',dir),{recursive:true,filter:f=>fs.statSync(f).isDirectory()||/\.(png|avif|webp)$/.test(f)})
 fs.copyFileSync(path.join(dist,'store.css'),path.join(output,'theme/store.css'))
 const shell=fs.readFileSync(path.join(dist,'hero-shell.html'),'utf8').replaceAll('__AO_ASSETS__',base).replaceAll('__AO_SHOP__',prefix+'/collection/').replace(/href="\/(?!aytalmart_custome_theme)/g,'href="'+prefix+'/')
 const urls=Object.fromEntries([...routes].map(r=>[r,prefix+(r==='/'?'/':r+'/')]))
 for(const route of routes){
  if(!/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*)?$/.test(route))throw Error('Unexpected route: '+route)
  const ctx={home:prefix,base,route,urls,catalog,images:{},frames:{},pages:[],categories:[],extra:[]}
  const html='<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="connect-src \'none\'; form-action \'none\'; object-src \'none\'; base-uri \'none\'"><title>AYTAL MART · Theme preview</title><link rel="stylesheet" href="'+base+'/store.css"></head><body class="ao-original-store"><aside style="text-align:center;background:#fff4d8;color:#48311b;padding:4px;font:13px/1.5 system-ui">AYTAL MART theme preview · No orders or payments</aside><div id="ao-store">'+(route==='/'?shell:'')+'</div><script id="ao-context" type="application/json">'+JSON.stringify(ctx).replaceAll('<','\\u003c')+'</script><script defer src="'+base+'/store.js"></script></body></html>'
  const dest=path.join(output,route.slice(1));fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'index.html'),html)
 }
 fs.writeFileSync(path.join(output,'.nojekyll'),'');fs.writeFileSync(path.join(output,'404.html'),'<!doctype html><title>Page not found · AYTAL MART</title><h1>Page not found</h1><a href="'+prefix+'/">Back to AYTAL MART</a>')
 console.log('Read-only public preview:',routes.size,'static routes')
}
