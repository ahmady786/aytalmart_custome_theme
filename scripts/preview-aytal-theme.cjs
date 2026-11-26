// Browse the compiled WP child theme without connecting to a live shop or accepting customer data.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path')
const root=path.resolve(__dirname,'..'),dist=path.join(root,'wordpress','aytal-original','dist')
const snapshot=require('../lib/aytal-content.json'),port=Number(process.argv[2]||3210),home='http://127.0.0.1:'+port
const kinds={set:['Quran & Janamaz Stand Set',2999],single:['Quran Stand',2199]}
const catalog=Object.entries(kinds).flatMap(([kind,[name,price]])=>['Gold','White','Silver','Black'].map(finish=>({sku:finish.toLowerCase()+'-'+kind,kind,name,price,original:kind==='set'?3500:4000,finish,available:true,sales:0})))
const pages=new Set(snapshot.pages.map(p=>p.slug))
const valid=new Set(['/', '/collection','/collections','/collections/all','/guide','/blogs/news','/checkout',...Array.from(pages,s=>'/pages/'+s),...[...catalog.map(p=>p.sku),...snapshot.products.map(p=>p.slug)].map(s=>'/products/'+s),...snapshot.collections.map(p=>'/collections/'+p.slug)])
const types={'.webp':'image/webp','.avif':'image/avif','.png':'image/png','.css':'text/css','.js':'text/javascript'}
valid.add('/my-account');valid.add('/cart')
const shell=fs.readFileSync(path.join(dist,'hero-shell.html'),'utf8').replaceAll('__AO_ASSETS__','/theme').replaceAll('__AO_SHOP__','/collection')
const config={home,base:'/theme',urls:{'/bag':home+'/checkout'},catalog,images:{},frames:{},pages:[],categories:[],extra:[],boot:'/preview-only',help:'/preview-only',ajax:'/preview-only',checkout:'/preview-only',activity:'/activity'}
const titles={'/':'AYTAL MART','/guide':'Stand guide','/collection':'Quran stands','/collections':'Collections','/checkout':'Cash on Delivery'}
http.createServer((req,res)=>{
 const send=(status,type,body)=>{res.writeHead(status,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body)}
 let url;try{url=new URL(req.url,home)}catch{return send(400,'text/plain','Bad URL')}
 const route=url.pathname.replace(/\/$/,'')||'/'
 if(route==='/activity'&&req.method==='POST')return send(200,'application/json','{"viewers":0,"sold":0}')
 if(req.method!=='GET'&&req.method!=='HEAD')return send(409,'application/json',JSON.stringify({success:false,data:'This is a local theme preview. No order or message has been sent.'}))
 if(route==='/favicon.ico')return send(204,'image/x-icon','')
 if(route.startsWith('/theme/')){
  const rel=route.slice(7);if(!/^(?:[a-z0-9_-]+\/)*[a-z0-9_.-]+$/i.test(rel))return send(404,'text/plain','Not found')
  const type=types[path.extname(rel)];if(!type)return send(404,'text/plain','Not found')
  const file=path.join(dist,rel);if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(404,'text/plain','Not found')
  res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','Content-Length':fs.statSync(file).size});return req.method==='HEAD'?res.end():fs.createReadStream(file).pipe(res)
 }
 if(!valid.has(route))return send(404,'text/plain','Page not found')
 const ctx=JSON.stringify({...config,route}).replaceAll('<','\\u003c')
 send(200,'text/html; charset=utf-8','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>'+(titles[route]||'AYTAL MART')+' · Local preview</title><link rel="stylesheet" href="/theme/store.css"></head><body class="ao-original-store"><div id="ao-store">'+(route==='/'?shell:'')+'</div><script id="ao-context" type="application/json">'+ctx+'</script><script defer src="/theme/store.js"></script></body></html>')
}).listen(port,'127.0.0.1',()=>console.log('AYTAL MART theme preview: '+home))
