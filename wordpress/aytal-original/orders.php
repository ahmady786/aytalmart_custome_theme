<?php
defined('ABSPATH') || exit;
function ao_gate(){
	nocache_headers();
	if(wp_parse_url(wp_get_referer()?:'',PHP_URL_HOST)!==wp_parse_url(home_url(),PHP_URL_HOST) || ($_SERVER['REQUEST_METHOD']??'')!=='POST')wp_send_json_error('Reopen this page and try again.',403);
	if('yes'===get_option('woocommerce_coming_soon')&&!current_user_can('manage_woocommerce'))wp_send_json_error('Checkout is not open to the public yet.',403);
}
function ao_boot(){
	ao_gate(); WC()->session->set_customer_session_cookie(true);
	wp_send_json_success(array('nonce'=>wp_create_nonce('ao_store')));
}
add_action('wc_ajax_ao_boot','ao_boot');
add_action('wc_ajax_ao_activity',static function(){
	ao_gate();$v=json_decode(file_get_contents('php://input',false,null,0,1024),true);
	$sku=$v['product']??'';if(!is_string($sku)||!preg_match('/^(gold|white|silver|black)-(set|single)$/D',$sku))wp_send_json_error('Unknown stand.',400);
	$key='ao_view_'.str_replace('-','_',$sku);$now=time();$active=(array)(get_transient($key)?:array());$active=array_filter($active,static function($t)use($now){return $t>$now-60;});
	$id=hash_hmac('sha256',($_SERVER['REMOTE_ADDR']??'').'|'.substr($_SERVER['HTTP_USER_AGENT']??'',0,160),wp_salt('nonce').gmdate('Ymd'));if(count($active)<1000)$active[$id]=$now;set_transient($key,$active,70);
	$start=new DateTimeImmutable('today',new DateTimeZone('Asia/Karachi'));$cache='ao_sets_'.$start->format('Ymd');$sold=get_transient($cache);
	if(false===$sold){global $wpdb;
		$sold=(int)$wpdb->get_var($wpdb->prepare("SELECT COALESCE(SUM(ol.product_qty),0) FROM {$wpdb->prefix}wc_order_product_lookup ol JOIN {$wpdb->prefix}wc_order_stats os ON os.order_id=ol.order_id JOIN {$wpdb->prefix}wc_product_meta_lookup p ON ol.product_id=p.product_id WHERE p.sku IN ('gold-set','white-set','silver-set','black-set') AND os.status IN ('wc-processing','wc-completed') AND os.date_created_gmt >= %s",gmdate('Y-m-d H:i:s',$start->getTimestamp())));set_transient($cache,$sold,90);}
	wp_send_json(array('viewers'=>count($active),'sold'=>(int)$sold));
});
function ao_prepare(){
	ao_gate();check_ajax_referer('ao_store','nonce');
	$lines=json_decode(wp_unslash($_POST['items']??''),true);
	if(!is_array($lines)||!$lines||count($lines)>8)wp_send_json_error('Please select your stand.',400);
	$wanted=array();foreach($lines as $line){if(!is_array($line)||!is_string($line['sku']??null))wp_send_json_error('Invalid selection.',400);
		$id=wc_get_product_id_by_sku(sanitize_text_field($line['sku']));$p=wc_get_product($id);$q=filter_var($line['quantity']??0,FILTER_VALIDATE_INT);
		if(!$p||!am_stand($p)||'publish'!==$p->get_status()||isset($wanted[$id])||$q<1||$q>20||!$p->is_purchasable()||!$p->is_in_stock()||!$p->has_enough_stock($q))wp_send_json_error('A selected stand is not available in that quantity.',409);
		$wanted[$id]=$q;
	}
	$cart=WC()->cart;
	// Do not silently discard products placed in an independent WooCommerce cart.
	foreach($cart->get_cart() as $item)if(!am_stand($item['data']))wp_send_json_error('Your basket contains another item. Please use the regular checkout first.',409);
	foreach($cart->get_cart() as $key=>$item){$id=$item['product_id'];if(isset($wanted[$id])){$cart->set_quantity($key,$wanted[$id],false);unset($wanted[$id]);}else{$cart->remove_cart_item($key);}}
	foreach($wanted as $id=>$q)if(!$cart->add_to_cart($id,$q))wp_send_json_error('This stand could not be added.',409);
	ao_finish_preparation($cart);
}
function ao_finish_preparation($cart){
	WC()->customer->set_billing_country('PK');WC()->customer->set_shipping_country('PK');$cart->calculate_totals();
	$shipping=array();foreach(WC()->shipping()->get_packages() as $i=>$pkg){foreach($pkg['rates'] as $rate)if($rate->method_id==='free_shipping'){$shipping[$i]=$rate->id;break;}if(!isset($shipping[$i]))wp_send_json_error('Free home delivery is currently unavailable.',409);}
	WC()->session->set('chosen_shipping_methods',$shipping);$cart->calculate_totals();
	if(!isset(WC()->payment_gateways()->get_available_payment_gateways()['cod']))wp_send_json_error('Cash on delivery is unavailable.',409);
	WC()->session->set('ao_direct',true);
	wp_send_json_success(array('shipping'=>$shipping,'total'=>(float)$cart->get_total('edit'),'nonce'=>wp_create_nonce('woocommerce-process_checkout')));
}
add_action('wc_ajax_ao_prepare','ao_prepare');
function ao_direct(){return !empty($_POST['ao_direct']) && function_exists('WC') && WC()->session && WC()->session->get('ao_direct');}
add_filter('woocommerce_checkout_fields',static function($f){
	if(ao_direct())foreach(array('billing_last_name','billing_email','billing_state','billing_postcode') as $k)if(isset($f['billing'][$k]))$f['billing'][$k]['required']=false;
	return $f;
},99);
add_action('woocommerce_after_checkout_validation',static function($data,$errors){if(!ao_direct())return;
	if(($data['billing_country']??'')!=='PK'||($data['payment_method']??'')!=='cod')$errors->add('ao_cod','Use Pakistan home delivery and cash on delivery.');
	if(!isset($_POST['ao_total']) || abs((float)wc_format_decimal(wp_unslash($_POST['ao_total']))-(float)WC()->cart->get_total('edit'))>0.01)$errors->add('ao_total','Prices changed; please refresh checkout.');
},20,2);
add_action('woocommerce_checkout_order_processed',static function($id){if(ao_direct())WC()->session->set('ao_recent_order',(int)$id);});
function ao_receipt(){
	if(!function_exists('WC')||!WC()->session)return null;
	$id=absint(get_query_var('order-received'));$o=wc_get_order($id);if(!$o||(int)WC()->session->get('ao_recent_order')!==$id || !hash_equals($o->get_order_key(),wc_clean(wp_unslash($_GET['key']??'')))||$o->get_payment_method()!=='cod'||$o->has_status(array('failed','cancelled','refunded')))return null;
	$items=array();foreach($o->get_items() as $i){$p=$i->get_product();$items[]=array('sku'=>$p&&$p->get_sku()?$p->get_sku():'item-'.$i->get_id(),'quantity'=>$i->get_quantity(),'name'=>$i->get_name(),'finish'=>$p?$p->get_meta('_aytal_finish'):'','lineTotal'=>(float)$i->get_total(),'packSavings'=>$p&&am_stand($p)?intdiv($i->get_quantity(),2)*200:0);}
	return array('ref'=>(string)$o->get_order_number(),'createdAt'=>$o->get_date_created()->date('c'),'subtotal'=>(float)$o->get_total(),'items'=>$items,'customer'=>array('name'=>$o->get_formatted_billing_full_name(),'address'=>$o->get_billing_address_1(),'city'=>$o->get_billing_city(),'email'=>$o->get_billing_email(),'phone'=>$o->get_billing_phone()));
}
add_action('init',static function(){register_post_type('ao_enquiry',array('label'=>'Store enquiries','public'=>false,'show_ui'=>true,'show_in_rest'=>false,'capabilities'=>array('edit_posts'=>'manage_woocommerce','edit_others_posts'=>'manage_woocommerce','read_private_posts'=>'manage_woocommerce','read_post'=>'manage_woocommerce','edit_post'=>'manage_woocommerce','delete_post'=>'manage_woocommerce'),'supports'=>array('title','editor')));});
add_action('wc_ajax_ao_help',static function(){
	ao_gate();check_ajax_referer('ao_store','nonce');$bucket='ao_msg_'.substr(hash_hmac('sha256',$_SERVER['REMOTE_ADDR']??'',wp_salt()),0,28);if((int)get_transient($bucket)>=8)wp_send_json_error('Please try again later.',429);set_transient($bucket,1+(int)get_transient($bucket),10*MINUTE_IN_SECONDS);
	if(isset($_POST['ref'])){$id=absint(preg_replace('/^PS-/i','',sanitize_text_field(wp_unslash($_POST['ref']))));$o=$id?wc_get_order($id):false;$phone=preg_replace('/\D/','',sanitize_text_field($_POST['phone']??''));
		if(!$o||strlen($phone)<7||!hash_equals(preg_replace('/\D/','',$o->get_billing_phone()),$phone))wp_send_json_error('No matching order found.',404);wp_send_json_success(wc_get_order_status_name($o->get_status()));}
	$email=sanitize_email(wp_unslash($_POST['email']??''));$msg=sanitize_textarea_field(wp_unslash($_POST['message']??''));if(!is_email($email)||strlen($msg)<10||strlen($msg)>4000)wp_send_json_error('Please check your email and message.',400);
	$id=wp_insert_post(wp_slash(array('post_type'=>'ao_enquiry','post_status'=>'private','post_title'=>$email,'post_content'=>$msg)),true);if(is_wp_error($id))wp_send_json_error('Please retry.',503);wp_send_json_success('Your enquiry has been received.');
});
