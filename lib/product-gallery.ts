import type {Product} from './catalog'
type Frame={label:string;asset?:string;photo?:number;detail?:boolean}
const angles:Record<string,[number,string][]> = {
  'gold-set':[[1464,'Left angle'],[1466,'Right angle']],
  'gold-single':[[1453,'Room view'],[1461,'Alternate angle']],
  'silver-set':[[1474,'Empty set'],[1486,'Side view']],
  'silver-single':[[1470,'Side view'],[1479,'Styled view']],
  'black-set':[[1512,'Left angle'],[1513,'Right angle']],
  'black-single':[[1517,'Styled view'],[1518,'Side view']],
  'white-set':[[1443,'Empty set'],[1446,'Alternate view']],
}
export function galleryFor(p:Product):Frame[]{
  return [{label:'Studio view',asset:p.sku},{label:'Original photo',asset:p.sku+'-photo'},
    ...(angles[p.sku]||[]).map(([photo,label])=>({photo,label})),
    ...(p.sku==='white-single'?[{asset:p.sku+'-photo',label:'Calligraphy detail',detail:true}]:[])]
}
export type {Frame}
