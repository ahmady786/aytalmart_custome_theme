// Compare the original production HTML against the exact ZIP payload without touching a real cart.
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..'),dist=path.join(root,'wordpress/aytal-original/dist'),t=path.join(root,'tmp/aytal-parity-tools/node_modules'),{chromium}=require(path.join(t,'playwright-core')),{PNG}=require(path.join(t,'pngjs'))
const output=path.join(root,'tmp/aytal-parity');fs.mkdirSync(output,{recursive:true})
const catalog=['set','single'].flatMap(kind=>['Gold','White','Silver','Black'].map(finish=>({sku:finish.toLowerCase()+'-'+kind,kind,finish,name:kind==='set'?'Quran & Janamaz Stand Set':'Quran Stand',price:kind==='set'?2999:2199,original:4000,available:true,sales:0})))
function send(res,code,type,content){res.writeHead(code,{'Content-Type':type});res.end(content)}
const received=[];
const messages=[];
let basketQty=2;
function nativeBasket(){const a=basketQty,off=200*Math.floor(a/2),sub=(2999*a)+300;
 return {hash:'basket-'+a,lines:[{key:'woo-line-a',name:'Gold set',detail:'Gold',image:'/theme/brand/aytal-mark.png',quantity:a,max:4,lineTotal:2999*a-off-50},{key:'woo-variation-b',name:'Accessory',detail:'Large',image:'/theme/brand/aytal-mark.png',quantity:1,max:1,lineTotal:300}],subtotal:sub,packSavings:off,discount:50,fees:[],tax:0,shipping:0,total:sub-off-50}}
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,'http://localhost'),p=u.pathname,home='http://'+req.headers.host;
 if(p==='/activity')return send(res,200,'application/json',JSON.stringify({viewers:0,sold:0}));
 if(p==='/help'){let b='';for await(const c of req)b+=c;const f=Object.fromEntries(new URLSearchParams(b));messages.push(f);return send(res,200,'application/json',JSON.stringify({success:true,data:f.ref?'Processing':'Your enquiry has been received.'}))}
 if(p==='/cart'){return send(res,200,'text/html','<a href="/checkout">Proceed to checkout</a>')}
 if(p==='/cart-action'){let b='';for await(const c of req)b+=c;const f=Object.fromEntries(new URLSearchParams(b));received.push([p,f]);assert.equal(f.hash,nativeBasket().hash);
  if(f.mode==='quantity'){assert.equal(f.key,'woo-line-a');basketQty=Number(f.quantity);return send(res,200,'application/json',JSON.stringify({success:true,data:nativeBasket()}))}
  assert.equal(f.mode,'prepare');return send(res,200,'application/json',JSON.stringify({success:true,data:{total:nativeBasket().total,shipping:['free_shipping:1'],nonce:'cart-test'}}))}
 if(['/boot','/prepare','/native-checkout'].includes(p)){let body='';for await(const c of req)body+=c;received.push([p,Object.fromEntries(new URLSearchParams(body))]);return send(res,200,'application/json',JSON.stringify(p==='/boot'?{success:true,data:{nonce:'fixture'}}:p==='/prepare'?{success:true,data:{total:2999,shipping:['free_shipping:1'],nonce:'test-only'}}:{result:'success',redirect:home+'/receipt'}))}
 if(p.startsWith('/baseline/')){const f=p.endsWith('/home')?'index':'products/gold-set';return send(res,200,'text/html; charset=utf-8',fs.readFileSync(path.join(root,'.next/server/app',f+'.html'),'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''))}
 const mounts=[['/_next/static/',path.join(root,'.next/static')],['/theme/',dist],['/shop/',path.join(root,'public/shop')],['/brand/',path.join(root,'public/brand')]];for(const [prefix,dir] of mounts)if(p.startsWith(prefix)){
  const f=path.resolve(dir,p.slice(prefix.length));if(!f.startsWith(dir+path.sep)||!fs.existsSync(f))return send(res,404,'text/plain','Missing');
  return send(res,200,({css:'text/css',js:'text/javascript',webp:'image/webp',avif:'image/avif',png:'image/png',woff2:'font/woff2'})[f.split('.').pop()]||'application/octet-stream',fs.readFileSync(f))}
 if(p==='/favicon.ico')return send(res,204,'image/x-icon','')
 if(p==='/shell-fixture'){const first=fs.readFileSync(path.join(dist,'hero-shell.html'),'utf8').replaceAll('__AO_ASSETS__','/theme').replaceAll('__AO_SHOP__','/collection');return send(res,200,'text/html; charset=utf-8','<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme/store.css">'+first)}
 const config={base:'/theme',home,route:p,urls:{},catalog,pages:[],categories:[],images:{},frames:{},extra:[],activity:'/activity',boot:'/boot',ajax:'/prepare',checkout:'/native-checkout',receipt:{ref:'TEST-ONLY',createdAt:'2026-01-01T00:00:00Z',subtotal:2999,items:[{sku:'gold-set',quantity:1,name:catalog[0].name,finish:'Gold',lineTotal:2999}],customer:{name:'QA Example',email:'',phone:'03000000000',address:'Example street',city:'Lahore'}}};
 config.help='/help';
 if(u.searchParams.has('editor'))config.pages=[{slug:p.split('/').pop(),title:'Contact AYTAL MART',html:'<p>Updated warehouse address from the page editor</p>',customCopy:true}];
 if(u.searchParams.has('reviews'))config.reviews=[{id:1,name:'Test reviewer',rating:4,text:'Approved review fixture'}];
 if(u.searchParams.has('portrait'))config.images['mobile-hero-01-complete-sets']={url:'/theme/brand/aytal-mart.png',width:120,height:90};
 if(p==='/checkout'&&!u.searchParams.has('items'))Object.assign(config,{cart:nativeBasket(),cartEndpoint:'/cart-action'});
 return send(res,200,'text/html; charset=utf-8','<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/theme/store.css"></head><body class="ao-original-store"><div id="ao-store"></div><script id="ao-context" type="application/json">'+JSON.stringify(config)+'</script><script defer src="/theme/store.js"></script></body></html>')
})
async function run(){const parser=new (require(path.join(t,'php-parser')))({parser:{version:'8.3',suppressErrors:false}})
 for(const f of fs.readdirSync(path.dirname(dist)).filter(f=>f.endsWith('.php')))parser.parseCode(fs.readFileSync(path.join(path.dirname(dist),f),'utf8'),f)
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});const errors=[];
 try{for(const [mode,width,height] of [['desktop',1366,900],['mobile',390,844]]){let page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));for(const name of ['home','product']){const parts=[];
  for(const version of ['baseline','wordpress']){await page.goto(base+(version==='baseline'?'/baseline/'+name:name==='home'?'/':'/products/gold-set'));await page.locator(name==='home'?'.hero-stage':'#buy-cod').waitFor();await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>null)))});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Page overflow');
   const coords=await page.locator(name==='home'?'.hero-stage':'.detail-grid').boundingBox();const png=await page.screenshot({path:path.join(output,[mode,name,version].join('-')+'.png'),animations:'disabled'});parts.push({coords,img:PNG.sync.read(png)})}
  const [a,b]=parts;let d=0;for(let i=0;i<a.img.data.length;i+=4){if(Math.max(...[0,1,2].map(n=>Math.abs(a.img.data[i+n]-b.img.data[i+n])))>24)d++}
  console.log(mode,name,'reference',JSON.stringify(a.coords),'restored',JSON.stringify(b.coords),'pixels differing >24:',(100*d/(width*height)).toFixed(2)+'%');
  if(name==='home'){await page.getByRole('button',{name:'Next slide'}).click();assert(await page.locator('.hero-selectors button').nth(1).getAttribute('aria-current')==='true')}
  else{await page.getByRole('button',{name:'Next product photo'}).click();assert(await page.locator('.pdp-thumbs button').nth(1).getAttribute('aria-pressed')==='true');await page.locator('.pack-card').nth(1).click();await page.locator('#buy-cod').click();await page.locator('.cod-dialog[open]').waitFor();assert.equal(await page.locator('dd.cod-total').innerText(),'Rs 5,798');await page.locator('.cod-qty button').first().click();assert.equal(await page.locator('dd.cod-total').innerText(),'Rs 2,999');await page.keyboard.press('Escape');await page.locator('.cod-dialog[open]').waitFor({state:'detached'});assert(new URL(page.url()).pathname==='/products/gold-set')}
 }await page.close()}
 const pg=await browser.newPage();pg.on('pageerror',e=>errors.push(e.message));
 const content=require(path.join(root,'lib/aytal-content.json'));
 const paths=['/guide','/collection','/collections','/blogs/news',...catalog.map(x=>'/products/'+x.sku),...content.pages.map(x=>'/pages/'+x.slug),...content.collections.map(x=>'/collections/'+x.slug),...content.products.map(x=>'/products/'+x.slug)];
 for(const p of new Set(paths)){await pg.goto(base+p);await pg.locator('main h1,main h2').first().waitFor({timeout:4000})}
 await pg.goto(base+'/checkout?items=gold-set%3A1');for(const [name,v] of Object.entries({name:'QA Example',address:'Example street',phone:'03000000000',city:'Lahore'}))await pg.locator('[name='+name+']').fill(v);
 assert.equal(await pg.locator('.cod-form input[type=checkbox]').count(),0);assert.equal(await pg.getByRole('link',{name:/View store terms/}).count(),1);await pg.locator('.cod-submit').click();await pg.waitForURL(base+'/receipt');assert.equal(await pg.locator('.order-receipt h1').innerText(),'Order #TEST-ONLY');assert.deepEqual(received.map(x=>x[0]),['/boot','/prepare','/native-checkout']);assert.equal(received[2][1].payment_method,'cod');assert.equal(received[2][1].terms,undefined);assert.equal(received[2][1]['terms-field'],undefined);assert.equal(received[2][1]['woocommerce-process-checkout-nonce'],'test-only');
 const fieldNames=()=>pg.locator('.cod-form input').evaluateAll(xs=>xs.map(x=>[x.name,x.required]));
 const fields=[['name',true],['address',true],['phone',true],['city',true],['email',false]];
 await pg.goto(base+'/checkout?items=silver-single%3A1');await pg.reload();assert.deepEqual(await fieldNames(),fields);assert.equal(await pg.locator('dd.cod-total').innerText(),'Rs 2,199');
 await pg.goto(base+'/cart');await pg.getByRole('link',{name:'Proceed to checkout'}).click();assert.deepEqual(await fieldNames(),fields);assert.equal(await pg.locator('dd.cod-total').innerText(),'Rs 6,048');await pg.getByRole('button',{name:'Decrease Gold set quantity'}).click();await pg.getByRole('button',{name:'Complete order — Rs 3,249'}).waitFor();await pg.reload();assert.equal(await pg.locator('dd.cod-total').innerText(),'Rs 3,249');assert.equal(await pg.locator('.cod-item').count(),2);assert.equal(await pg.locator('.cod-form input[type=checkbox]').count(),0);
 for(const [name,v] of Object.entries({name:'QA Example',address:'Example street',phone:'03000000000',city:'Lahore'}))await pg.locator('[name='+name+']').fill(v);
 await pg.locator('.cod-submit').click();await pg.waitForURL(base+'/receipt');assert.equal(received.at(-2)[1].mode,'prepare');assert.equal(received.at(-1)[1]['woocommerce-process-checkout-nonce'],'cart-test');assert.equal(received.at(-1)[1].ao_total,'3249');
 const routes=[...new Set(['/',...paths,'/collections/all','/checkout','/receipt'])];
 for(const [w,h] of [[320,568],[390,844],[768,1024],[1366,900]]){
  await pg.setViewportSize({width:w,height:h});
  for(const route of routes){
   await pg.goto(base+route);await pg.locator('main h1,main h2').first().waitFor();
   assert(await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow: '+route+' at '+w);
   await pg.locator('footer a.footer-support').getByText('Track Order').waitFor({state:'attached'});
   assert(!/from this storefront|sample reviews for this preview|check a store request|redesigned stand collection/i.test(await pg.locator('main').innerText()),route);
   if((w===390||w===1366)&&['/guide','/pages/contact-aytal-mart','/pages/track-your-order'].includes(route)){
    await pg.screenshot({path:path.join(output,'brand-'+w+'-'+route.split('/').at(-1)+'.png')});
   }
  }
 }
 for(const [w,h,isPhone] of [[320,568,true],[390,844,true],[740,950,true],[844,390,true],[768,1024,false],[1366,900,false]]){
  await pg.setViewportSize({width:w,height:h});const requested=new Set();const collect=r=>requested.add(r.url());pg.on('request',collect);
  await pg.goto(base+'/');const button=pg.getByRole('button',{name:'Open menu'});assert.equal(await button.isVisible(),isPhone);
  if(isPhone){await button.click();const nav=pg.locator('#mast-navigation');await nav.getByRole('link',{name:'Track Order'}).waitFor();assert.equal(await pg.locator('.mast-toggle').getAttribute('aria-expanded'),'true');await pg.keyboard.press('Escape');assert.equal(await nav.isVisible(),false);assert(await button.evaluate(e=>e===document.activeElement));const [a,b]=await Promise.all([pg.locator('header .brand-lockup').boundingBox(),button.boundingBox()]);assert(a.x+a.width<b.x);await button.click();await nav.getByRole('link',{name:'Contact',exact:true}).click();await pg.getByRole('heading',{name:'Contact AYTAL MART',exact:true}).waitFor();await pg.goto(base+'/')}
  for(let i=0;i<3;i++){const source=await pg.locator('.hero-artwork img').evaluate(async img=>{await img.decode();return img.currentSrc});assert.equal(source.includes('/mobile-hero-'),isPhone,source);if(i<2)await pg.getByRole('button',{name:'Next slide'}).click()}
  const wrong=[...requested].filter(url=>isPhone?/\/optimized\/hero-0/.test(url):url.includes('/mobile-hero-'));assert.deepEqual(wrong,[],w+' wrong art fetched');pg.off('request',collect)
 }
 await pg.goto(base+'/pages/contact-aytal-mart');await pg.getByLabel('Your email').fill('qa@example.com');await pg.getByLabel('Your message').fill('Customer support fixture only.');await pg.getByRole('button',{name:'Send message'}).click();await pg.getByText('Your enquiry has been received.').waitFor();
 await pg.locator('footer .footer-support').click();await pg.getByLabel('Order number').fill('12345');await pg.getByLabel('Phone used at checkout').fill('03000000000');await pg.getByRole('button',{name:'Check status'}).click();await pg.getByText('Processing',{exact:true}).waitFor();assert.equal(messages.length,2);
 await pg.goto(base+'/pages/contact-aytal-mart?editor=1');await pg.getByText('Updated warehouse address from the page editor').waitFor();assert.equal(await pg.getByText('Ittehad Colony, Lahore, Pakistan',{exact:true}).count(),1);
 await pg.goto(base+'/products/gold-set');await pg.locator('#buy-cod').waitFor();assert.equal(await pg.locator('#product-reviews').count(),0);
 await pg.goto(base+'/products/gold-set?reviews=1');await pg.getByText('Approved review fixture').waitFor();
 for(const [width,height,phone] of [[390,844,true],[1366,900,false]]){
  await pg.setViewportSize({width,height});await pg.goto(base+'/shell-fixture');const url=await pg.locator('.hero-artwork img').evaluate(async i=>{await i.decode();return i.currentSrc});assert.equal(url.includes('mobile-hero-'),phone);
  await pg.goto(base+'/?portrait=1');const override=await pg.locator('.hero-artwork img').evaluate(async i=>{await i.decode();return i.currentSrc});assert.equal(override.endsWith('/brand/aytal-mart.png'),phone)
 }
 await pg.close();assert.deepEqual(errors,[]);console.log('PASS:',routes.length,'routes at 320, 390, 768 and 1366 px; 3 hero sources and menu behavior at 6 sizes. First paint, separate mobile image override, contact, tracking, editable content, approved reviews and both COD paths passed locally. No real order or enquiry placed.')}
 finally{await browser.close();server.close()}}
run().catch(e=>{console.error(e);server.close();process.exitCode=1})
