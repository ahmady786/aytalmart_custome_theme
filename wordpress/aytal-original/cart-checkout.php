<?php
defined('ABSPATH') || exit;

/** Only serialize this shopper's cart on their non-cacheable checkout page. */
function ao_cart_snapshot(){
	$cart=WC()->cart;
	$rows=array();$savings=0;
	foreach($cart->get_cart() as $key=>$item){
		$p=$item['data'];$qty=(int)$item['quantity'];$stand=am_stand($p);
		$max=$p->get_max_purchase_quantity();if($stand)$max=$max<0?20:min(20,$max);
		$detail=wp_strip_all_tags(wc_get_formatted_cart_item_data($item,true));
		if($stand){$labels=array('set'=>'Quran & Janamaz stand','single'=>'Only Quran stand');
			$detail=implode(' · ',array_filter(array($p->get_meta('_aytal_finish'),$labels[$p->get_meta('_aytal_kind')]??'', $detail)));}
		$img=$p->get_image_id();if($stand&&$img&&(int)get_option('am_media_'.md5($p->get_sku().'.webp'))===(int)$img){$gallery=$p->get_gallery_image_ids();$img=$gallery[0]??$img;}
		$rows[]=array('key'=>$key,'name'=>$p->get_name(),'image'=>wp_get_attachment_image_url($img,'woocommerce_thumbnail')?:wc_placeholder_img_src(),
			'detail'=>$detail,'quantity'=>$qty,'max'=>$max,
			'lineTotal'=>(float)$item['line_total']);
		if($stand)$savings+=(float)($item['aytal_pair_saving']??0);
	}
	$fees=array();foreach($cart->get_fees() as $fee)$fees[]=array('label'=>$fee->name,'value'=>(float)$fee->total);
	return array('lines'=>$rows,'hash'=>$cart->get_cart_hash(),'subtotal'=>(float)$cart->get_subtotal()+$savings,'packSavings'=>$savings,
		'discount'=>(float)$cart->get_discount_total(),'tax'=>(float)$cart->get_total_tax(),'shipping'=>(float)$cart->get_shipping_total(),'fees'=>$fees,'total'=>(float)$cart->get_total('edit'));
}
add_action('wc_ajax_ao_cart_view',static function(){ao_gate();wp_send_json_success(ao_cart_snapshot());});
add_action('wc_ajax_ao_cart_checkout',static function(){
	ao_gate();check_ajax_referer('ao_store','nonce');
	$cart=WC()->cart;
	if(!hash_equals($cart->get_cart_hash(),sanitize_text_field(wp_unslash($_POST['hash']??''))))wp_send_json_error('Your cart changed. Refresh checkout to see the latest items and prices.',409);
	if(($_POST['mode']??'')==='add'){
		$sku=sanitize_text_field(wp_unslash($_POST['sku']??''));$q=filter_var($_POST['quantity']??null,FILTER_VALIDATE_INT);
		$p=wc_get_product(wc_get_product_id_by_sku($sku));
		if(!$p||!am_stand($p)||$p->get_status()!=='publish'||!$q||$q<1||$q>20||!$p->is_purchasable()||!$p->is_in_stock())wp_send_json_error('This stand is unavailable.',409);
		$id=$p->get_id();$existing=$cart->get_cart_item_quantities()[$p->get_stock_managed_by_id()]??0;
		if($existing+$q>20||!$p->has_enough_stock($existing+$q)||!apply_filters('woocommerce_add_to_cart_validation',true,$id,$q)||!$cart->add_to_cart($id,$q))wp_send_json_error('That quantity is unavailable.',409);
		wp_send_json_success(ao_cart_snapshot());
	}
	if($cart->is_empty())wp_send_json_error('Your cart is empty.',409);
	if(($_POST['mode']??'')==='prepare'){ao_finish_preparation($cart);return;}
	if(($_POST['mode']??'')!=='quantity')wp_send_json_error('Unknown cart action.',400);
	$key=wp_unslash($_POST['key']??'');if(!is_string($key)||!preg_match('/^[a-f0-9]{32}$/D',$key))wp_send_json_error('Invalid cart item.',400);
	$item=$cart->get_cart_item($key);
	$q=filter_var($_POST['quantity']??'',FILTER_VALIDATE_INT);
	if(!$item||$q===false||$q<0)wp_send_json_error('Invalid cart item or quantity.',400);
	if($q===0){$cart->remove_cart_item($key);wp_send_json_success(ao_cart_snapshot());}
	$p=$item['data'];$max=$p->get_max_purchase_quantity();
	if((am_stand($p)&&$q>20)||($max>=0&&$q>$max)||!$p->is_purchasable()||!$p->is_in_stock()||!$p->has_enough_stock($q)||!apply_filters('woocommerce_update_cart_validation',true,$key,$item,$q))
		wp_send_json_error('That quantity is not available.',409);
	$cart->set_quantity($key,$q,true);wp_send_json_success(ao_cart_snapshot());
});
