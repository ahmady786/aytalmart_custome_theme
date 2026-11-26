// Exercise the packaged WordPress theme, including its final global link rule.
const assert=require('node:assert/strict')
const path=require('node:path')
const {chromium}=require(path.join(__dirname,'../tmp/aytal-parity-tools/node_modules/playwright-core'))
const base=process.argv[2]||'http://127.0.0.1:3210'
const set='Quran & Janamaz stand',single='Only Quran stand'
async function white(locator){
 const css=await locator.evaluate(e=>[getComputedStyle(e).color,getComputedStyle(e).backgroundColor])
 assert.equal(css[0],'rgb(255, 255, 255)',await locator.textContent())
 return css[1]
}
async function run(){
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
 try{for(const w of [320,390,1366]){
  const pg=await b.newPage({viewport:{width:w,height:850},reducedMotion:'reduce'}),errors=[]
  pg.on('pageerror',e=>errors.push(e.message))
  await pg.goto(base+'/collection')
  const types=pg.getByRole('navigation',{name:'Filter by product'}),finishes=pg.getByRole('navigation',{name:'Filter by finish'})
  assert.deepEqual(await types.getByRole('link').allTextContents(),['All stands',set,single])
  for(const type of [set,single,'All stands']){
   await types.getByRole('link',{name:type,exact:true}).click()
   assert.equal(await types.locator('[aria-current]').innerText(),type)
   assert.equal(await white(types.locator('[aria-current]')),'rgb(56, 38, 25)')
   assert.notEqual(await types.locator('a:not([aria-current])').first().evaluate(e=>getComputedStyle(e).color),'rgb(255, 255, 255)')
   for(const finish of ['Gold','Black','All finishes']){
    await finishes.getByRole('link',{name:finish,exact:true}).click()
    assert.equal(await finishes.locator('[aria-current]').innerText(),finish);await white(finishes.locator('[aria-current]'))
   }
  }
  await pg.goto(base+'/products/silver-set');const opts=pg.getByRole('group',{name:'Choose stand type'})
  assert.deepEqual(await opts.getByRole('link').allTextContents(),[set,single])
  for(const type of [single,set]){
   await opts.getByRole('link',{name:type,exact:true}).click();assert.equal(await opts.locator('[aria-current]').innerText(),type)
   const chosen=opts.locator('[aria-current]');await chosen.focus();assert.equal(await white(chosen),'rgb(85, 57, 31)')
   assert.equal(await pg.locator('.buy-swatches [aria-current]').getAttribute('aria-label'),'Silver')
   assert(await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow')
   await pg.locator('.pack-card').nth(1).click();const pack=pg.locator('.pack-card[data-selected=true]')
   for(const sel of ['.pack-choice b','.pack-choice small','.pack-price strong','.pack-price del'])await white(pack.locator(sel))
   await pg.locator('#buy-cod').click();await pg.locator('.cod-dialog[open]').waitFor()
   assert((await pg.locator('.cod-item').innerText()).includes(type));await pg.keyboard.press('Escape')
   await pg.locator('.cod-dialog[open]').waitFor({state:'detached'})
  }
  assert.deepEqual(errors,[]);await pg.close();console.log('PASS: choices, white active text, checkout labels and layout at '+w+'px')
 }}finally{await b.close()}
}
run().catch(e=>{console.error(e);process.exitCode=1})
