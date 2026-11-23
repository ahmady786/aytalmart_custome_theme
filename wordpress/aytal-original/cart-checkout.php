<?php
defined('ABSPATH') || exit;

/** Only serialize this shopper's cart on their non-cacheable checkout page. */
function ao_cart_snapshot(){
	$cart=WC()->cart;
	$rows=array();$savings=0;
	foreach($cart->get_cart() as $key=>$item){
		$p=$item['data'];$qty=(int)$item['quantity'];$stand=am_stand($p);
		$max=$p->get_max_purchase_quantity();
		$rows[]=array('key'=>$key,'name'=>$p->get_name(),'image'=>wp_get_attachment_image_url($p->get_image_id(),'woocommerce_thumbnail')?:wc_placeholder_img_src(),
			'detail'=>wp_strip_all_tags(wc_get_formatted_cart_item_data($item,true)),'quantity'=>$qty,'max'=>$max,
			'lineTotal'=>(float)$item['line_total']);
		if($stand)$savings+=200*intdiv($qty,2);
	}
	$fees=array();foreach($cart->get_fees() as $fee)$fees[]=array('label'=>$fee->name,'value'=>(float)$fee->total);
	return array('lines'=>$rows,'hash'=>$cart->get_cart_hash(),'subtotal'=>(float)$cart->get_subtotal()+$savings,'packSavings'=>$savings,
		'discount'=>(float)$cart->get_discount_total(),'tax'=>(float)$cart->get_total_tax(),'shipping'=>(float)$cart->get_shipping_total(),'fees'=>$fees,'total'=>(float)$cart->get_total('edit'));
}
add_action('wc_ajax_ao_cart_checkout',static function(){
	ao_gate();check_ajax_referer('ao_store','nonce');
	$cart=WC()->cart;
	if($cart->is_empty())wp_send_json_error('Your cart is empty. Return to the collection to choose an item.',409);
	if(!hash_equals($cart->get_cart_hash(),sanitize_text_field(wp_unslash($_POST['hash']??''))))wp_send_json_error('Your cart changed. Refresh checkout to see the latest items and prices.',409);
	if(($_POST['mode']??'')==='prepare'){ao_finish_preparation($cart);return;}
	if(($_POST['mode']??'')!=='quantity')wp_send_json_error('Unknown cart action.',400);
	$key=wp_unslash($_POST['key']??'');if(!is_string($key)||!preg_match('/^[a-f0-9]{32}$/D',$key))wp_send_json_error('Invalid cart item.',400);
	$item=$cart->get_cart_item($key);
	$q=filter_var($_POST['quantity']??'',FILTER_VALIDATE_INT);
	if(!$item||$q===false||$q<1)wp_send_json_error('Invalid cart item or quantity.',400);
	$p=$item['data'];$max=$p->get_max_purchase_quantity();
	if(($max>=0&&$q>$max)||!$p->is_purchasable()||!$p->is_in_stock()||!$p->has_enough_stock($q)||!apply_filters('woocommerce_update_cart_validation',true,$key,$item,$q))
		wp_send_json_error('That quantity is not available.',409);
	$cart->set_quantity($key,$q,true);wp_send_json_success(ao_cart_snapshot());
});
