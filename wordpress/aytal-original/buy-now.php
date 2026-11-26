<?php
defined('ABSPATH') || exit;
/** Direct Buy uses a request-only Woo cart, never the customer's saved basket. */
function ao_buy_request(){
	if(($_SERVER['REQUEST_METHOD']??'')!=='POST')return false;
	$route=$_GET['wc-ajax']??'';
	return $route==='ao_prepare'||($route==='checkout'&&!empty($_POST['ao_direct'])&&isset($_POST['ao_buy_items']));
}
add_filter('woocommerce_cart_session_initialize',static function($enabled){return ao_buy_request()?false:$enabled;});
// Mark the lifecycle before Woo attempts a lazy read of the normal browser basket.
add_action('wp_loaded',static function(){if(ao_buy_request()&&!did_action('woocommerce_load_cart_from_session'))do_action('woocommerce_load_cart_from_session');},-100);
add_filter('woocommerce_persistent_cart_enabled',static function($enabled){return ao_buy_request()?false:$enabled;});
function ao_fill_buy_cart($lines){
	if(!is_array($lines)||!$lines||count($lines)>8)throw new Exception('Please select your stand.');
	$cart=WC()->cart;
	if(!$cart->is_empty())throw new Exception('Could not start an independent checkout. Your cart is unchanged.');
	$seen=array();
	foreach($lines as $line){
		if(!is_array($line)||!is_string($line['sku']??null))throw new Exception('Invalid selection.');
		$id=wc_get_product_id_by_sku(sanitize_text_field($line['sku']));$p=wc_get_product($id);$q=filter_var($line['quantity']??0,FILTER_VALIDATE_INT);
		if(!$p||!am_stand($p)||$p->get_status()!=='publish'||isset($seen[$id])||$q<1||$q>20||!$p->is_purchasable()||!$p->is_in_stock()||!$p->has_enough_stock($q)||!apply_filters('woocommerce_add_to_cart_validation',true,$id,$q)||!$cart->add_to_cart($id,$q))throw new Exception('A selected stand is no longer available in that quantity.');
		$seen[$id]=true;
	}
}
add_action('woocommerce_before_checkout_process',static function(){
	if(!ao_buy_request())return;
	// Runs after core's checkout-nonce verification and before its empty-cart check.
	ao_gate();ao_fill_buy_cart(json_decode(wp_unslash($_POST['ao_buy_items']??''),true));
},1);
add_action('woocommerce_checkout_create_order',static function($order){if(ao_buy_request())$order->update_meta_data('_ao_buy_now','yes');});
add_filter('woocommerce_should_clear_cart_after_payment',static function($clear){
	if(!$clear||!WC()->session)return $clear;
	$id=absint(get_query_var('order-received'))?:absint(WC()->session->get('order_awaiting_payment'));
	$order=$id?wc_get_order($id):false;return $order&&$order->get_meta('_ao_buy_now')==='yes'?false:$clear;
});
