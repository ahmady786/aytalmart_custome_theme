// Read-only browser check on the local design preview; never submits an order.
const assert=require('node:assert/strict'),{chromium}=require('../tmp/aytal-parity-tools/node_modules/playwright-core')
const base='http://127.0.0.1:3210'
;(async()=>{const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'})
try{for(const width of [320,390,1024,1366]){const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message))
 await p.goto(base);await p.locator('#duo-title').waitFor()
 assert.deepEqual(await p.locator('main>section').evaluateAll(ns=>ns.map(n=>n.querySelector('h1,h2')?.textContent)),['Quran stands and Quran & Janamaz stand sets','Shop the stands','Explore the collections','The stand guide.','Shop together'])
 const grid=p.locator('.home-products .sku-grid');assert.equal(await grid.locator('.sku-card').count(),8);assert.equal(await grid.evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),width>900?4:2)
 assert.equal(await p.locator('.collection-rounds a').count(),6);assert.equal(await p.locator('.aytal-chat').count(),0)
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
 for(const second of ['gold-set','black-set']){await p.getByLabel('Set 2 finish').selectOption(second);await p.getByRole('button',{name:'Buy both with COD'}).click();await p.locator('.cod-dialog[open] dd.cod-total').filter({hasText:'5,500'}).waitFor();assert.equal(await p.locator('.cod-dialog .cod-item').count(),second==='gold-set'?1:2);await p.keyboard.press('Escape')}
 for(const [sku,total] of [['silver-set','5,500'],['white-single','4,399']]){await p.goto(base+'/products/'+sku);await p.locator('.pack-card').nth(1).click();await p.locator('#buy-cod').click();await p.locator('.cod-dialog dd.cod-total').filter({hasText:total}).waitFor()}
 assert.deepEqual(errors,[]);await p.close();console.log('PASS '+width+'px: section order, 8 products, circles, pack rates, same/mixed finishes and checkout')
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1})
