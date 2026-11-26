// Non-transactional browser acceptance checks for a seeded local WordPress site.
const assert=require('node:assert/strict'),{chromium}=require('playwright-core')
const base=new URL(process.argv[2]||'http://127.0.0.1:9424')
if(!['127.0.0.1','localhost'].includes(base.hostname))throw Error('Local fixture only')
;(async()=>{
 const b=await chromium.launch({channel:'chrome',headless:true})
 try {
  for(const width of [390,1440]){
   const p=await b.newPage({viewport:{width,height:900}}),errors=[]
   p.on('pageerror',e=>errors.push(e.message))
   await p.goto(base.href);const img=p.locator('.hero-artwork img').first()
   await img.waitFor();const source=await img.evaluate(async el=>{await el.decode();return el.currentSrc})
   assert.equal(source.includes('mobile-hero'),width===390)
   const path='/products/black-quran-janamaz-wall-stand-double-set'
   await p.goto(new URL(path,base).href)
   const buy=p.getByRole('link',{name:'Buy both with Cash on Delivery'})
   await buy.waitFor();assert.match(await p.locator('.pdp-offer').innerText(),/5,500/)
   assert.equal(await p.locator('h1').count(),1)
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
   const target=new URL(await buy.getAttribute('href'),base);assert.equal(target.searchParams.get('items'),'black-set:2')
   await buy.click();await p.getByText(/5,500/).first().waitFor()
   assert.equal(await p.locator('input[name], form input').count()>0,true)
   assert.deepEqual(errors,[]);await p.close();console.log('PASS',width,'px: responsive hero, bundle page, correct SKU and checkout total. No order submitted.')
  }
 } finally {await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1})
