import rates from './stand-rates.json'
import images from './shop-image-manifest.json'
export const finishes = ['Gold', 'White', 'Silver', 'Black'] as const
export type Finish = typeof finishes[number]
export type Kind = 'set' | 'single'
export const standOptionLabel: Record<Kind,string> = {set:'Quran & Janamaz stand',single:'Only Quran stand'}
export type CartLine = { sku: string; quantity: number }
export const swatches: Record<Finish, string> = {
  Gold: '#c59b4a', White: '#fbf7ec', Silver: '#a5a6a4', Black: '#292924',
}
export const kinds = {
  set: { name: 'Quran & Janamaz Stand Set', ...rates.set },
  single: { name: 'Quran Stand', ...rates.single },
}
export const products = (['set', 'single'] as const).flatMap(kind =>
  finishes.map(finish => ({ ...kinds[kind], sku: finish.toLowerCase() + '-' + kind, finish, kind })),
)
export type Product = typeof products[number]
export const productFor = (sku: string) => products.find(p => p.sku === sku)
export const money = (value: number) => 'Rs ' + value.toLocaleString('en-US')
export const shot = (p: Product, original = false) => {
  const key=(p.sku+(original?'-photo':'')) as keyof typeof images
  const files=images[key].webp
  return '/shop/optimized/'+files[files.length-1]
}
export function validLines(value: unknown): value is CartLine[] {
  if (!Array.isArray(value) || value.length > products.length) return false
  const seen = new Set<string>()
  return value.every(line => {
    if (!line || !productFor(line.sku) || seen.has(line.sku) ||
      !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20) return false
    seen.add(line.sku)
    return true
  })
}
// Any two finishes of the same kind make a pair. Allocate whole rupees; odd units
// retain their own SKU price. Called by both the checkout display and order writer.
export function priceLines(lines: CartLine[]){
  const counts={set:0,single:0},used={set:0,single:0}
  for(const l of lines)counts[productFor(l.sku)!.kind]+=l.quantity
  return lines.map(l=>{
    const p=productFor(l.sku)!,k=p.kind,limit=counts[k]-counts[k]%2,pair=rates[k].pair
    let total=0
    for(let i=0;i<l.quantity;i++){const n=used[k]++;total+=n>=limit?p.price:n%2?Math.ceil(pair/2):Math.floor(pair/2)}
    return {total,saving:Math.max(0,p.price*l.quantity-total)}
  })
}
export function offerPrice(product:Product,quantity:number){return priceLines([{sku:product.sku,quantity}])[0]}
export function totals(lines: CartLine[]) {
  const amounts=priceLines(lines)
  return lines.reduce((sum, line,i) => {
    const product = productFor(line.sku)!
    const offer = amounts[i]
    return {
      sale: sum.sale + offer.total,
      packSavings: sum.packSavings + offer.saving,
      regular: sum.regular + product.original * line.quantity,
      units: sum.units + line.quantity,
    }
  }, { sale: 0, regular: 0, units: 0, packSavings: 0 })
}
