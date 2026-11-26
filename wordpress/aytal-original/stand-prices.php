<?php
defined('ABSPATH') || exit;
function aytal_rates(){static $r;return $r??($r=json_decode(file_get_contents(__DIR__.'/stand-rates.json'),true));}
// Only the eight catalog SKUs are enrolled. Other goods and historic orders are untouched.
function aytal_rate_kind($p){return $p&&preg_match('/^(gold|white|silver|black)-(set|single)$/D',$p->get_sku(),$m)?$m[2]:null;}
function aytal_set_catalog_rates(){
 if(!function_exists('WC')||get_option('aytal_catalog_rates_206'))return;
 foreach(array('Gold','White','Silver','Black') as $f)foreach(aytal_rates() as $k=>$r){
  $id=wc_get_product_id_by_sku(strtolower($f).'-'.$k);$p=$id?wc_get_product($id):false;
  if(!$p||!am_stand($p))continue;
  $p->set_regular_price((string)$r['original']);$p->set_sale_price((string)$r['price']);$p->set_price((string)$r['price']);$p->save();
 }
 update_option('aytal_catalog_rates_206',1,false);
}
add_action('wp_loaded','aytal_set_catalog_rates',1);
// Upgrade previously seeded sites once, without repricing sets or past orders.
add_action('wp_loaded',static function(){
 if(!function_exists('WC')||get_option('aytal_single_rates_208'))return;
 $done=0;$r=aytal_rates()['single'];
 foreach(array('gold','white','silver','black') as $finish){
  $id=wc_get_product_id_by_sku($finish.'-single');$p=$id?wc_get_product($id):false;
  if(!$p||!am_stand($p))continue;
  if(!$p->get_meta('_aytal_single_rates_208')){
   $p->set_regular_price((string)$r['original']);$p->set_sale_price((string)$r['price']);$p->set_price((string)$r['price']);
   $p->update_meta_data('_aytal_single_rates_208','yes');$p->save();wc_delete_product_transients($id);
  }$done++;
 }
 if($done===4)update_option('aytal_single_rates_208',1,false);
},2);
function aytal_pair_lines($rows){
 $count=array('set'=>0,'single'=>0);$used=array('set'=>0,'single'=>0);$out=array();
 foreach($rows as $r)$count[$r['kind']]+=$r['qty'];
 foreach($rows as $key=>$r){$k=$r['kind'];$paired=min($r['qty'],max(0,$count[$k]-($count[$k]%2)-$used[$k]));
  $pair=aytal_rates()[$k]['pair'];$total=intdiv($paired,2)*$pair;
  if($paired%2)$total+=($used[$k]%2)?ceil($pair/2):floor($pair/2);
  $total+=($r['qty']-$paired)*$r['base'];$used[$k]+=$r['qty'];
  $out[$key]=array('total'=>$total,'saving'=>max(0,$r['base']*$r['qty']-$total));
 }return $out;
}
add_action('woocommerce_before_calculate_totals',static function($cart){
 $rows=array();foreach($cart->get_cart() as $key=>$item){$k=aytal_rate_kind($item['data']);if(!$k||!am_stand($item['data']))continue;
  $base=wc_get_product($item['product_id']);if(!$base||$item['quantity']<1)continue;
  $rows[$key]=array('kind'=>$k,'base'=>(float)$base->get_price(),'qty'=>(int)$item['quantity']);
 }
 foreach(aytal_pair_lines($rows) as $key=>$v){$cart->cart_contents[$key]['data']->set_price($v['total']/$rows[$key]['qty']);$cart->cart_contents[$key]['aytal_pair_saving']=$v['saving'];}
},90);
add_action('woocommerce_checkout_create_order_line_item',static function($line,$key,$item){if(isset($item['aytal_pair_saving']))$line->add_meta_data('_aytal_pair_saving',$item['aytal_pair_saving'],true);},10,3);
