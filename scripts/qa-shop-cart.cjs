// Run against a local preview, or against a disposable local Woo instance with --woo.
const assert=require('node:assert/strict')
const {chromium}=require('../tmp/aytal-parity-tools/node_modules/playwright-core')
const live=process.argv.includes('--woo'),base=live?'http://127.0.0.1:9422':'http://127.0.0.1:3210'
async function main(){
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
 try{for(const width of live?[1300]:[320,390,768,1366]){
  const pg=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});pg.setDefaultTimeout(live?65000:7000)
  const errs=[];pg.on('pageerror',e=>errs.push(e.message))
  if(live){pg.on('response',async r=>{const u=new URL(r.url()),op=u.searchParams.get('wc-ajax');if(op&&op!=='ao_activity'){let j;try{j=await r.json()}catch{}console.log('Woo local:',op,r.status(),j?.result??(j?.success===false?'failed':j?.success===true?'ok':'non-JSON'))}});pg.on('framenavigated',f=>{if(f===pg.mainFrame())console.log('Page:',new URL(f.url()).pathname)})}
  const go=async path=>pg.goto(base+path,{waitUntil:'domcontentloaded',timeout:120000})
  const product=(sku)=>live?'/product/'+sku+'/':'/products/'+sku
  await go(product('gold-set'));await pg.locator('.pdp-add-cart').waitFor()
  assert(await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow at '+width)
  if(width<740){await pg.getByLabel('Open menu').click();assert(await pg.getByRole('navigation',{name:'Store',exact:true}).getByText('My Account').isVisible());await pg.getByLabel('Close menu').click()}
  else assert(await pg.locator('.mast-account').isVisible())
  await pg.locator('.pdp-add-cart').click()
  const drawer=pg.locator('.shop-cart-drawer[open]')
  await drawer.getByText('Rs 2,999',{exact:true}).first().waitFor()
  await drawer.getByLabel(/^Increase /).click()
  await drawer.getByText('Rs 5,500',{exact:true}).first().waitFor()
  await pg.keyboard.press('Escape')
  await pg.reload({waitUntil:'domcontentloaded'});await pg.getByLabel('Open cart, 2 items').click()
  await drawer.getByText('View full cart').click()
  await pg.locator('.shop-cart-page').getByText('Rs 5,500',{exact:true}).first().waitFor()
  await pg.getByText('Proceed to checkout').click()
  await pg.locator('dd.cod-total').filter({hasText:'5,500'}).waitFor()
  await go(product('black-single'));await pg.locator('#buy-cod').click()
  const dialog=pg.locator('.cod-dialog[open]');await dialog.locator('dd.cod-total').filter({hasText:'2,199'}).waitFor()
  if(live){
   for(const [key,value] of Object.entries({name:'Local QA',address:'Local Test Address 1',phone:'03000000000',city:'Lahore'}))await dialog.locator('input[name='+key+']').fill(value)
   await dialog.locator('.cod-submit').click()
   await pg.waitForFunction(()=>location.href.includes('order-received')||!!document.querySelector('.cod-error'),{},{timeout:150000})
   if(await pg.locator('.cod-error').count())throw Error(await pg.locator('.cod-error').innerText())
   await pg.getByText(/2,199/).first().waitFor();console.log('Native Woo guest COD order confirmed (local test only)')
  }else await pg.keyboard.press('Escape')
  await go('/cart');await pg.locator('.shop-cart-page').getByText('Rs 5,500',{exact:true}).first().waitFor()
  await pg.locator('.shop-cart-page').getByLabel(/^Remove /).click()
  await pg.getByText('Your cart is empty.').waitFor()
  await go('/my-account');await pg.locator('.ao-account').waitFor()
  if(live){await pg.locator('.ao-account form.login').waitFor();await pg.locator('.ao-account form.register').waitFor();await pg.locator('.ao-account a[href*="lost-password"]').click();await pg.locator('.ao-account .woocommerce-ResetPassword').waitFor()}
  else{await pg.getByRole('button',{name:'Orders',exact:true}).click();await pg.getByText('Your WooCommerce order history',{exact:false}).waitFor()}
  assert.deepEqual(errs,[]);await pg.close();console.log('PASS '+width+'px: cart, account, checkout and direct Buy isolation')
 }}finally{await b.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
