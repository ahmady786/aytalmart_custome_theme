<?php
defined('ABSPATH') || exit;
function am_stand($p) { return $p && $p->is_type('simple') && 'yes' === $p->get_meta('_aytal_stand'); }
if(!function_exists('aytal_rates'))require_once __DIR__.'/stand-prices.php';
function am_valid_pack_request() {
	return isset($_POST['aytal_pack'],$_POST['add-to-cart']) && in_array((string)wp_unslash($_POST['aytal_pack']),array('1','2'),true);
}
add_action('woocommerce_before_add_to_cart_button',static function(){
	global $product;
	if (!am_stand($product)) return;
	$max=$product->get_max_purchase_quantity(); $price=(float)$product->get_price();
	echo '<fieldset class="am-packs"><legend>Choose your offer</legend><label><input type="radio" name="aytal_pack" value="1" checked> Buy 1 · '.wp_kses_post(wc_price($price)).'</label>';
	if ($max<0 || $max>=2) echo '<label><input type="radio" name="aytal_pack" value="2"> Buy 2 · '.wp_kses_post(wc_price(aytal_rates()[aytal_rate_kind($product)]['pair']??($price*2))).'</label>';
	echo '</fieldset>';
});
add_filter('woocommerce_add_to_cart_quantity',static function($qty,$id){
	return am_valid_pack_request() && absint($_POST['add-to-cart'])===$id && am_stand(wc_get_product($id)) ? absint($_POST['aytal_pack']) : $qty;
},10,2);
add_filter('woocommerce_add_to_cart_redirect',static function($url,$product){
	return $product && am_stand($product) && am_valid_pack_request() ? wc_get_checkout_url() : $url;
},10,2);
add_filter('woocommerce_product_single_add_to_cart_text',static function($text,$p){return am_stand($p)?'Buy with Cash on Delivery':$text;},10,2);
add_action('woocommerce_single_product_summary',static function(){
	global $product;
	if(!am_stand($product))return;
	$kind=$product->get_meta('_aytal_kind');$finish=$product->get_meta('_aytal_finish');
	echo '<div class="am-options">';
	foreach(array('Finish'=>array('Gold','White','Silver','Black'),'Stand'=>array('set','single')) as $group=>$choices){
		echo '<strong>'.esc_html($group).'</strong><div>';
		foreach($choices as $c){
			$sku='Finish'===$group?strtolower($c).'-'.$kind:strtolower($finish).'-'.$c;
			$id=wc_get_product_id_by_sku($sku);if(!$id || 'publish'!==get_post_status($id))continue;
			$name='set'===$c?'Quran & Janamaz stand':('single'===$c?'Only Quran stand':$c);
			echo '<a '.($id===$product->get_id()?'aria-current="true" ':'').'href="'.esc_url(get_permalink($id)).'">'.esc_html($name).'</a>';
		} echo '</div>';
	} echo '</div>';
},25);
add_action('woocommerce_single_product_summary',static function(){global $product;if(am_stand($product))echo '<p class="am-note">Free delivery across Pakistan. You can open the parcel before paying.</p>';},32);
add_filter('woocommerce_checkout_cart_item_quantity',static function($html,$item,$key){
	if(!is_checkout()||!am_stand($item['data']))return $html;
	$max=$item['data']->get_max_purchase_quantity();
	return '<label class="am-check-qty"> Quantity <input type="number" step="1" min="1" max="'.esc_attr($max<0?20:min(20,$max)).'" name="am_qty['.esc_attr($key).']" value="'.esc_attr($item['quantity']).'"></label>';
},10,3);
function am_checkout_quantities($values){
	if(empty($values['am_qty'])||!is_array($values['am_qty'])||!WC()->cart)return;
	foreach(WC()->cart->get_cart() as $key=>$item){
		if(!isset($values['am_qty'][$key])||!is_scalar($values['am_qty'][$key])||!am_stand($item['data']))continue;
		$n=filter_var($values['am_qty'][$key],FILTER_VALIDATE_INT);$max=$item['data']->get_max_purchase_quantity();
		if($n===false||$n<1||$n>20||($max>=0&&$n>$max)){wc_add_notice('Please choose an available quantity.','error');continue;}
		if((int)$item['quantity']!==$n)WC()->cart->set_quantity($key,$n,false);
	}
}
add_action('woocommerce_checkout_update_order_review',static function($serialized){parse_str($serialized,$fields);am_checkout_quantities($fields);});
add_action('woocommerce_checkout_process',static function(){am_checkout_quantities(wp_unslash($_POST));if(WC()->cart)WC()->cart->calculate_totals();});
add_shortcode('aytal_footer_links',static function(){
	$links=array();
	foreach(array('about-aytal-mart','contact-aytal-mart','faq','shipping-policy','return-exchange-policy','privacy-policy','terms-of-service','disclaimer','care-installation-guide','track-your-order') as $slug){$p=$slug==='privacy-policy'?get_post((int)get_option('wp_page_for_privacy_policy')):get_page_by_path($slug);if($p&&'publish'===$p->post_status)$links[]='<a href="'.esc_url(get_permalink($p)).'">'.esc_html(get_the_title($p)).'</a>';}
	return '<nav aria-label="Store information" class="am-footer-links">'.implode(' ',$links).'</nav>';
});
add_shortcode('aytal_collections',static function(){
	if(!function_exists('wc_get_product_id_by_sku'))return '';
	$out='<div class="am-home-cards">';
	foreach(array('complete-sets'=>'gold-set','quran-stands'=>'silver-single')as $slug=>$sku){$t=get_term_by('slug',$slug,'product_cat');if(!$t)continue;
		$u=get_term_link($t);if(is_wp_error($u))continue;$img=get_post_thumbnail_id(wc_get_product_id_by_sku($sku));
		$out.='<a href="'.esc_url($u).'">'.($img?wp_get_attachment_image($img,'woocommerce_thumbnail'):'').'<span>'.esc_html($t->name).' →</span></a>';}
	return $out.'</div>';
});
add_filter('render_block_data',static function($parsed){if(($parsed['blockName']??'')==='core/navigation' && empty($parsed['attrs']['ref']) && empty($parsed['innerBlocks']) && ($id=(int)get_option('am_nav_id'))) $parsed['attrs']['ref']=$id;return $parsed;});
add_filter('woocommerce_product_related_products_heading',static function(){return 'More from the collection';});
