// Builds a second, reversible child theme from the approved sources. Never packages the project root.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..'),at=(...p)=>path.join(root,...p)
const tools=at('tmp/aytal-parity-tools/node_modules'),esbuild=require(path.join(tools,'esbuild'))
const dest=at('wordpress/aytal-original/dist'),ui=at('wordpress/original-src/platform.tsx'),src=at('wordpress/original-src'),read=f=>fs.readFileSync(f,'utf8')
const entries=new Set(), files=new Set()
const transform=(s,b,a)=>{if(!s.includes(b))throw Error('Approved source changed: '+b);return s.replace(b,a)}
const srcRoute=f=>f.replaceAll('\\','/')
const plugin={name:'wordpress-host-adapters',setup(b){
 b.onResolve({filter:/^next\/link$|^next\/navigation$/},()=>({path:ui}))
 b.onResolve({filter:/^next\/image$/},()=>({path:'image',namespace:'wp'}))
 b.onLoad({filter:/.*/,namespace:'wp'},()=>({contents:'export {BrandImage as default} from '+JSON.stringify(ui),resolveDir:src,loader:'ts'}))
 b.onResolve({filter:/\.css$/},a=>({path:a.path,namespace:'style'}));b.onLoad({filter:/.*/,namespace:'style'},()=>({contents:''}))
 b.onLoad({filter:/aytal-content\.json$/},a=>({contents:'import {cfg} from '+JSON.stringify(ui)+';const snapshot='+read(a.path)+';for(const p of cfg.pages){const i=snapshot.pages.findIndex(s=>s.slug===p.slug);if(i>=0)snapshot.pages[i]=p;else snapshot.pages.push(p)};for(const c of cfg.categories){const orig=snapshot.collections.find(s=>s.slug===c.slug);if(orig){orig.title=c.title;orig.count=c.count;if(c.html)orig.html=c.html}else snapshot.collections.push(c)}export default snapshot;',loader:'js',resolveDir:root}))
 b.onLoad({filter:/\.(tsx|ts)$/},a=>{
  let s=read(a.path),p=srcRoute(a.path);if(p.includes('/original-src/'))return;
  files.add(p.slice(srcRoute(root).length+1));const use='import {cfg as hostData,resolveUrl,submitWoo,help as sendHelp} from '+JSON.stringify(ui)+';\n';
  if(p.endsWith('/lib/catalog.ts')){
   s=s.replace(/export const products = [\s\S]*?export type Product =/,'export const products = hostData.catalog.slice().sort((a,b)=>Number(a.kind==="single")-Number(b.kind==="single"));for(const k of ["set","single"]){const ref=products.find(p=>p.kind===k&&p.finish==="Gold")||products.find(p=>p.kind===k);if(ref)Object.assign(kinds[k],{price:ref.price,original:ref.original})} export type Product =')
  }else if(p.endsWith('/ShopImage.tsx')){
   s=transform(s,"const prefix='/shop/optimized/'","const prefix=hostData.base+'/shop/optimized/'");
   s=transform(s,'const mobileSources=portrait&&','const custom=mobileAsset&&hostData.images[mobileAsset];const mobileSources=custom?<source media={phoneMedia} width={custom.width} height={custom.height} sizes="(max-width:540px) 100vw, 540px" srcSet={custom.srcset||custom.url}/>:portrait&&')
   s=transform(s,'  const count=', '  const override=hostData.images[asset];if(override)return <picture className="shop-picture">{mobileSources}<img src={override.url} srcSet={override.srcset||undefined} sizes={sizes} alt={alt} width={override.width} height={override.height} loading={eager?"eager":"lazy"}/></picture>;\n  const count=')
   s=transform(s,'  return prefix+entry.webp','  if(hostData.images[asset])return hostData.images[asset].url;\n  return prefix+entry.webp')
  }else if(p.endsWith('/ProductGallery.tsx')){
   s=transform(s,"const base='/shop/angles/'","const base=hostData.base+'/shop/angles/'");
   s=transform(s,'const frames=galleryFor(p),','const original=galleryFor(p), fromWp=hostData.frames[p.sku],frames=fromWp?.length ? fromWp.map((frame,i)=>({...frame,label:original[i]?.label||("View "+(i+1))})).concat(p.sku==="white-single"&&fromWp.length===2?[{...fromWp[1],detail:true,label:"Calligraphy detail"}]:[]) : original,')
  }else if(p.endsWith('/OrderFlow.tsx')){
   s=s.replace(/const res=await fetch\('\/api\/orders'[\s\S]*?window.location.replace\([^\n]+\)/,'const destination=await submitWoo(items,customer,amount.sale);if(selection===undefined)saved.clear();window.location.replace(destination)')
   s=transform(s,'{!busy&&<a className="cod-whatsapp"', '<p className="ao-terms"><a href={resolveUrl("/pages/terms-of-service")} target="_blank" rel="noopener">View store terms ↗</a></p>{!busy&&<a className="cod-whatsapp"')
   s=transform(s,"history.replaceState(history.state,'',checkoutLink(next))","history.replaceState(history.state,'',resolveUrl(checkoutLink(next)))")
  }else if(p.endsWith('/HelpForm.tsx')){
   s=s.replace(/const response=await fetch\(tracking[\s\S]*?form.reset\(\)/,'const data=await sendHelp(Object.fromEntries(new FormData(form)));setResult({ok:data.ok,text:data.message});if(data.ok&&!tracking)form.reset()').replace('placeholder="PS-…"','placeholder="Order number"')
  }else if(p.endsWith('/ProductActivity.tsx')){
   s=transform(s,"fetch('/api/shop/activity'","fetch(hostData.activity")
  }else if(p.endsWith('/PairPicker.tsx')){
   s=transform(s,'[p.sku,other.sku]','[p.sku,other?.sku].filter(Boolean)')
   s=transform(s,'const pair=[p,other],','if(!other)return null;const pair=[p,other],')
  }else if(p.endsWith('/ProductDetail.tsx')){
   s=transform(s,'<button id="buy-cod"','<button disabled={p.available===false} id="buy-cod"')
   s=transform(s,'Buy with Cash on Delivery</span>','{p.available===false?"Out of stock":"Buy with Cash on Delivery"}</span>')
  }else if(p.endsWith('/MostBought.tsx')){
   s=s.replace(/import \{unstable_cache\}[^\n]+\n|import path from [^\n]+\n|import \{purchasedUnits\}[^\n]+\n|const recentSales=[^\n]+\n/g,'').replace('default async function','default function');
   s=s.replace(/await recentSales\(\).catch\([^\n]+/,'Object.fromEntries(hostData.catalog.map(p=>[p.sku,p.sales]))').replace("const available=picks.filter(sku=>sku!==exclude)","const available=picks.filter(sku=>sku!==exclude&&productFor(sku))").replace('from the last 30 days','in this store')
  }else if(p.endsWith('/products/[sku]/page.tsx')){
   s=s.replace(/<script type="application\/ld\+json"[\s\S]*?\}\}\/>/,'')
   s=transform(s,"{p.kind==='set'?<StoreCopy","{hostData.description?<StoreCopy html={hostData.description}/>:p.kind==='set'?<StoreCopy")
   s=transform(s,'<ProductReviews/>','<ProductReviews reviews={hostData.reviews||[]}/>')
  }else if(p.endsWith('/order-success/[ref]/page.tsx')){
   s=s.replace(/import \{cookies\}[^\n]+\n|import \{readReceipt,receiptCookie\}[^\n]+\n/g,'').replace('default async function','default function').replace(/await readReceipt\([^\n]+/,'hostData.receipt').replace('ref.slice(3,11).toUpperCase()','ref')
  }else if(p.endsWith('/collections/[slug]/page.tsx')){
   s=transform(s,"{(all||c?.slug==='islamic-collection')", "{(c?.slug==='complete-sets'||c?.slug==='quran-stands')&&<ProductGrid kind={c.slug==='complete-sets'?'set':'single'}/>}\n    {(all||c?.slug==='islamic-collection')")
   s=s.replace(':<p className="service-note">',':(c?.slug==="complete-sets"||c?.slug==="quran-stands"||hostData.extra.some(x=>x.categories.includes(c?.slug)))?null:<p className="service-note">')
  }
  return {contents:use+s,loader:p.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(a.path)}
 });
}}
async function main(){
 fs.mkdirSync(dest,{recursive:true})
 await esbuild.build({entryPoints:[at('wordpress/original-src/entry.tsx')],bundle:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},target:['es2020'],outfile:path.join(dest,'store.js'),plugins:[plugin],tsconfig:at('tsconfig.json')})
 const shop=at('app/(shop)'),css=['shop.css','store-chrome.css','product-display.css','cod-checkout.css','products/[sku]/buy-panel.css','products/[sku]/reviews.css','order-success/[ref]/receipt.css','customer-care.css'].map(f=>read(path.join(shop,f))).join('\n')
 const out=await require('postcss')([require('tailwindcss')({content:[{raw:'',extension:'html'}],corePlugins:{preflight:true}}),require('autoprefixer')]).process(css,{from:undefined})
 fs.writeFileSync(path.join(dest,'store.css'),out.css+'\n.ao-terms{display:block;font-size:12px;margin:.7rem 0}.ao-terms a{text-decoration:underline}.ao-original-store{background:#fcf7ed}.ao-original-store .prayer-shop a:not(.wp-element-button){color:inherit}body.ao-original-store{font-family:Inter,"Segoe UI",sans-serif;}')
 fs.writeFileSync(path.join(dest,'hero-shell.html'),await require('./build-hero-shell.cjs')(esbuild,root))
 const cp=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to)}
 const manifest={...require(at('lib/shop-image-manifest.json')),...require(at('lib/shop-mobile-heroes.json'))};for(const e of Object.values(manifest))for(const f of [...e.webp,...e.avif])cp(at('public/shop/optimized',f),path.join(dest,'shop/optimized',f))
 const old=require(at('lib/aytal-content.json'));for(const [key,list] of [['slugs',old.products],['categories',old.collections]])fs.writeFileSync(path.join(dest,'legacy-'+key+'.json'),JSON.stringify(list.map(x=>x.slug)))
 for(const f of fs.readdirSync(at('public/shop/angles')).filter(f=>/^\d+-(112|480|960)\.webp$/.test(f)))cp(at('public/shop/angles',f),path.join(dest,'shop/angles',f))
 for(const f of ['aytal-mart.png','aytal-mark.png'])cp(at('public/brand',f),path.join(dest,'brand',f))
 fs.writeFileSync(path.join(dest,'source-list.json'),JSON.stringify([...files].sort(),null,2));console.log(files.size,'approved source modules,',fs.statSync(path.join(dest,'store.js')).size,'JS bytes')
}
main().catch(e=>{console.error(e);process.exitCode=1})
