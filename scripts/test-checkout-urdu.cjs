// Read-only acceptance of the compiled checkout, without placing an order.
const { chromium } = require('playwright-core')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path')
const base = 'http://127.0.0.1:9442'
const labels = ['Full name','Delivery address','Phone number','City','Email (optional)']
async function run() {
  const browser = await chromium.launch({channel:'chrome',headless:true})
  const out = path.join(__dirname,'../tmp/checkout-urdu')
  fs.mkdirSync(out,{recursive:true})
  try {
    for (const width of [320,390,481,649,721,768,1024,1440]) {
      const page = await browser.newPage({viewport:{width,height:900}})
      for (const mode of ['standalone','buy']) {
        await page.goto(base + (mode==='buy'?'/products/gold-set/':'/checkout?items=gold-set%3A1'))
        if(mode==='buy')await page.locator('#buy-cod').click()
        const fields=page.locator('.cod-fields:visible')
        await fields.waitFor()
        assert.equal(await fields.locator('input').count(),5)
        for(const label of labels) {
          const input=fields.getByRole('textbox',{name:label,exact:true})
          const info=await input.evaluate(el=>{
            const help=document.getElementById(el.getAttribute('aria-describedby'))
            if(!help)return null
            const r=help.getBoundingClientRect(), f=el.getBoundingClientRect(),p=el.closest('.cod-field').getBoundingClientRect()
            const en=el.labels[0].getBoundingClientRect()
            return {lang:help.lang,dir:getComputedStyle(help).direction,text:help.textContent,
              sameLine:r.top<en.bottom&&en.top<r.bottom&&r.left>=en.right&&r.left-en.right<=10,
              fits:r.width>0&&r.left>=p.left-1&&r.right<=p.right+1&&r.bottom<=f.top+1,
              required:el.required,valid:el.checkValidity()}
          })
          assert(info && info.lang==='ur' && info.dir==='rtl' && /[\u0600-\u06ff]/.test(info.text) && info.fits,JSON.stringify({label,info}))
          assert.equal(info.required,label!=='Email (optional)')
          assert(info.sameLine,'Bilingual label not on one line: '+width+' '+label)
          assert.equal(info.valid,!info.required)
        }
        assert(await fields.evaluate(el=>el.scrollWidth<=el.clientWidth+1))
        if(width===390||width===1440)await fields.screenshot({path:path.join(out,mode+'-'+width+'.png')})
        console.log('PASS',width,mode)
      }
      await page.close()
    }
  } finally {await browser.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1})
