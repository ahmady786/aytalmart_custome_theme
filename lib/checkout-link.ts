import {validLines,type CartLine} from './catalog'

export function checkoutLink(lines:CartLine[]) {
  return '/checkout?items='+encodeURIComponent(lines.map(({sku,quantity})=>sku+':'+quantity).join(','))
}
export function checkoutItems(value:string|string[]|undefined):CartLine[] {
  if(typeof value!=='string'||value.length>220)return []
  const items=value.split(',').map(part=>{
    const match=/^([a-z]+-(?:set|single)):([1-9]\d?)$/.exec(part)
    return {sku:match?.[1]||'',quantity:Number(match?.[2])}
  })
  return validLines(items)?items:[]
}
