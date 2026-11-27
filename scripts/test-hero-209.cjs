// Exercise the actual generated WordPress shell and hydrated carousel, without orders.
const {chromium}=require('playwright-core'),assert=require('node:assert/strict')
const fs=require('node:fs'),path=require('node:path')
const url=new URL(process.argv[2]||'http://127.0.0.1:9439/')
if(url.hostname!=='127.0.0.1')throw Error('Local acceptance only')
const out=path.resolve(__dirname,'../tmp/hero-209');fs.mkdirSync(out,{recursive:true})
const labels=['Complete Quran & Janamaz sets','Quran stands only','The Golden Edit: four complete sets']
const sizes=[[320,568,'mobile'],[390,844,'mobile'],[639,900,'mobile'],[640,900,'tablet'],[768,1024,'tablet'],[1024,768,'tablet'],[844,390,'desktop'],[1355,555,'desktop'],[1920,903,'desktop'],[2560,1080,'desktop']]
async function run(){
 const b=await chromium.launch({channel:'chrome',headless:true})
 try{
  const ctx=await b.newContext({reducedMotion:'reduce'})
  const page=await ctx.newPage(),errors=[]
  page.on('pageerror',e=>errors.push(e.message))
  page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url())})
  for(const [w,h,layout] of sizes){
   await page.setViewportSize({width:w,height:h});await page.goto(url.href,{waitUntil:'networkidle'})
   assert.match(await page.locator('.hero-artwork img').evaluate(i=>i.currentSrc),/hero-01-complete-sets/)
   assert.equal(await page.getByRole('button',{name:'Show '+labels[0],exact:true}).getAttribute('aria-current'),'true')
   for(const [n,label] of labels.entries()){
    await page.getByRole('button',{name:'Show '+label,exact:true}).click()
    const img=page.locator('.hero-artwork img')
    const prefix=(layout==='desktop'?(n===2?'wide-':''):layout+'-')+'hero-0'+(n+1)
    await page.waitForFunction(p=>{const i=document.querySelector('.hero-artwork img');return i?.complete&&i?.naturalWidth&&i.currentSrc.includes(p)},prefix)
    await img.evaluate(i=>i.decode())
    const m=await page.evaluate(()=>{
     const sel=s=>document.querySelector(s),box=s=>sel(s).getBoundingClientRect()
     const art=box('.hero-artwork img'),i=sel('.hero-artwork img'),body=document.documentElement,link=sel('.hero-photo')
     const cta=box('.hero-cta'),deal=box('.hero-deal'),ctrl=box('.hero-controls'),stage=box('.hero-photo')
     return {left:art.left,right:body.clientWidth-art.right,aspect:art.width/art.height,native:i.naturalWidth/i.naturalHeight,
       topGap:art.top-box('.offer-hero').top,hasTitleBar:!!sel('.hero-heading,.hero-sale'),overflow:body.scrollWidth-body.clientWidth,src:i.currentSrc,room:Math.min(cta.width,cta.height),bottom:Math.max(deal.bottom,art.bottom)-ctrl.top,
       totalH:stage.height,link:link.href,price:sel('.hero-deal').innerText.replace(/\s+/g,' ')}
    })
    assert(Math.abs(m.left)<1&&Math.abs(m.right)<1&&m.overflow<=1&&m.bottom<2&&m.room>=40,JSON.stringify(m))
    assert(!m.hasTitleBar&&Math.abs(m.topGap)<1,JSON.stringify(m))
    assert(Math.abs(m.aspect/m.native-1)<.012,JSON.stringify(m))
    assert.match(m.price,n===1?/2,199.*2,500/:/2,999.*3,500/);assert(m.link.includes(n===1?'type=single':'type=set'))
    if([390,768,1355,1920].includes(w))await page.locator('.offer-hero').screenshot({path:path.join(out,w+'-slide-'+(n+1)+'.png')})
    console.log(w+'x'+h,'slide '+(n+1),layout,'edge '+m.left+'/'+m.right,path.basename(m.src))
   }
  }
  for(const width of [390,1920]){
   const nojs=await b.newContext({javaScriptEnabled:false,viewport:{width,height:844}})
   const p=await nojs.newPage();await p.goto(url.href)
   assert((await p.locator('.hero-artwork img').evaluate(i=>i.currentSrc)).includes('hero-01-complete-sets'))
   assert.equal(await p.locator('.hero-heading,.hero-sale').count(),0);await nojs.close()
  }
  assert.deepEqual(errors,[]);console.log('PASS: 30 states without a top bar; complete sets first before and after JS.')
 }finally{await b.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1})
