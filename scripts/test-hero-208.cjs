// Read-only browser acceptance on a local, seeded WordPress release or Pages preview.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const base=new URL(process.argv[2]||'http://127.0.0.1:9428/'),wp=base.pathname==='/'
if(base.hostname!=='127.0.0.1')throw Error('Local QA only')
const out=path.resolve(__dirname,'../tmp/hero-208');fs.mkdirSync(out,{recursive:true})
;(async()=>{const b=await chromium.launch({channel:'chrome',headless:true})
try{
 const p=await b.newPage({reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.goto(base.href,{waitUntil:'domcontentloaded'})
 for(const [w,h] of [[1355,555],[1280,640],[844,390],[768,1024],[390,844],[320,568],[1920,1080]]){
  await p.setViewportSize({width:w,height:h});await p.evaluate(()=>scrollTo(0,0))
  for(const [n,label] of ['Complete Quran & Janamaz sets','Quran stands only','The Golden Edit: four complete sets'].entries()){
   await p.getByRole('button',{name:'Show '+label,exact:true}).click();const art=p.locator('.hero-artwork img');await art.evaluate(e=>e.decode())
   const m=await p.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect(),i=document.querySelector('.hero-artwork img'),a=rect('.hero-artwork img'),d=rect('.hero-deal'),head=rect('.hero-heading'),pager=rect('.hero-controls');
    const scale=Math.min(a.width/i.naturalWidth,a.height/i.naturalHeight)
    return {source:i.currentSrc,photoWidth:Math.round(i.naturalWidth*scale),overflow:document.documentElement.scrollWidth-innerWidth,dealWidth:d.width,titleWidth:head.width,last:Math.max(d.bottom,head.bottom,a.bottom),pager:pager.top}
   })
   assert.equal(m.source.includes('mobile-hero'),w<=740&&w<h)
   assert(m.overflow<=1&&m.dealWidth>110&&m.titleWidth>110&&m.last<=m.pager+1,JSON.stringify(m))
   if(n===1){assert.match(await p.locator('.hero-deal').innerText(),/Rs 2,199[\s\S]*Rs 2,500/);if(w===1355)assert(m.photoWidth>=1000,JSON.stringify(m))
    if(w===1355||w===390){await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,(wp?'wp-':'preview-')+w+'x'+h+'.png')})}
    console.log(w+'x'+h+': '+m.photoWidth+'px image, '+path.basename(m.source))
   }
  }
 }
 if(wp){for(const f of ['gold','white','silver','black']){
  await p.goto(new URL('product/'+f+'-single/',base).href,{waitUntil:'domcontentloaded'})
  await p.locator('#buy-cod').waitFor()
  const sku=await p.evaluate(f=>JSON.parse(document.querySelector('#ao-context').textContent).catalog.find(v=>v.sku===f+'-single'),f)
  assert.equal(sku.price,2199);assert.equal(sku.original,2500);
  const offers=p.locator('.pack-card');assert.match(await offers.nth(1).innerText(),/4,399/)
  if(f==='gold'){await offers.nth(1).click();await p.locator('#buy-cod').click();await p.locator('.cod-dialog dd.cod-total').filter({hasText:'4,399'}).waitFor()}
  console.log('PASS migrated SKU',sku.sku,sku.original,sku.price)
 }}
 assert.deepEqual(errors,[]);console.log('PASS all three slides, no overflow, no browser errors; no order submitted.')
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1})
