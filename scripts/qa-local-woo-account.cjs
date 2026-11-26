// Real lifecycle using fictional QA data on the disposable, loopback-only WordPress instance.
const assert=require('node:assert/strict')
const {chromium}=require('../tmp/aytal-parity-tools/node_modules/playwright-core')
async function main(){
 const b=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true})
 try{const p=await b.newPage();p.setDefaultTimeout(90000)
  await p.goto('http://127.0.0.1:9422/my-account/',{waitUntil:'domcontentloaded',timeout:120000})
  const form=p.locator('.ao-account form.register');await form.locator('[name=email]').fill('local-'+Date.now()+'@example.invalid')
  await form.getByRole('button',{name:'Register',exact:true}).click()
  const nav=p.locator('.ao-account .woocommerce-MyAccount-navigation')
  await nav.getByText('Orders',{exact:true}).click();assert(p.url().includes('/orders'))
  await nav.getByText('Addresses',{exact:true}).click();assert(p.url().includes('/edit-address'))
  await p.locator('.woocommerce-MyAccount-content').getByText('Billing address',{exact:true}).waitFor()
  console.log('PASS: native WooCommerce registration, authenticated orders and address book')
 }finally{await b.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1})
