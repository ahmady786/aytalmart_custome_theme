export const finishes = ['Gold', 'White', 'Silver', 'Black'] as const
export type Finish = typeof finishes[number]
export type Kind = 'set' | 'single'
export type CartLine = { sku: string; quantity: number }
export const swatches: Record<Finish, string> = {
  Gold: '#c59b4a', White: '#fbf7ec', Silver: '#a5a6a4', Black: '#292924',
}
export const kinds = {
  set: { name: 'Quran & Janamaz Stand Set', price: 2999, original: 4000 },
  single: { name: 'Quran Stand', price: 2199, original: 4000 },
}
export const products = (['set', 'single'] as const).flatMap(kind =>
  finishes.map(finish => ({ ...kinds[kind], sku: finish.toLowerCase() + '-' + kind, finish, kind })),
)
export type Product = typeof products[number]
export const productFor = (sku: string) => products.find(p => p.sku === sku)
export const money = (value: number) => 'Rs ' + value.toLocaleString('en-US')
export const shot = (p: Product, original = false) => '/shop/' + p.sku + (original ? '-photo.jpg' : p.kind==='set'?'.jpg?v=2999':'.jpg')
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
// Only complete pairs of the same SKU qualify; an unpaired item stays at its sale price.
export function offerPrice(product: Product, quantity: number) {
  const saving = Math.floor(quantity / 2) * 200
  return { saving, total: product.price * quantity - saving }
}
export function totals(lines: CartLine[]) {
  return lines.reduce((sum, line) => {
    const product = productFor(line.sku)!
    const offer = offerPrice(product, line.quantity)
    return {
      sale: sum.sale + offer.total,
      packSavings: sum.packSavings + offer.saving,
      regular: sum.regular + product.original * line.quantity,
      units: sum.units + line.quantity,
    }
  }, { sale: 0, regular: 0, units: 0, packSavings: 0 })
}
