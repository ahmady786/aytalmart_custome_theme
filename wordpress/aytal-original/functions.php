<?php
defined('ABSPATH') || exit;
require_once __DIR__.'/store-data.php';
require_once __DIR__.'/orders.php';
require_once __DIR__.'/cart-checkout.php';
require_once __DIR__.'/buy-now.php';
require_once __DIR__.'/customer-account.php';
if(!function_exists('aytal_rates'))require_once __DIR__.'/stand-prices.php';
require_once __DIR__.'/whatsapp.php';
function ao_phone_slides(){return array('01-complete-sets'=>'Complete sets','02-quran-stands'=>'Single stands','03-golden-gallery'=>'Four finishes');}
add_action('customize_register',static function($customizer){
	$customizer->add_section('ao_mobile_hero',array('title'=>'AYTAL MART: mobile hero images','description'=>'Optional portrait photos for phones. Desktop banners stay unchanged.'));
	foreach(ao_phone_slides() as $key=>$label){$setting='ao_mobile_'.$key;
		$customizer->add_setting($setting,array('default'=>0,'sanitize_callback'=>'absint'));
		$customizer->add_control(new WP_Customize_Media_Control($customizer,$setting,array('section'=>'ao_mobile_hero','label'=>$label,'mime_type'=>'image')));
	}
});
function ao_routes(){
	add_rewrite_rule('^(collections(?:/[a-z0-9-]+)?|guide|blogs/news)/?$','index.php?ao_view=$matches[1]','top');
	add_rewrite_rule('^products/([a-z0-9-]+)/?$','index.php?ao_view=products/$matches[1]','top');
}
add_action('init','ao_routes');
add_filter('query_vars',static function($v){$v[]='ao_view';return $v;});
add_action('template_redirect',static function(){
	$v=trim((string)get_query_var('ao_view'),'/');if($v==='')return;
	if('yes'===get_option('woocommerce_coming_soon')&&!current_user_can('manage_woocommerce')){wp_safe_redirect(wc_get_page_permalink('shop'));exit;}
	if(preg_match('~^products/(.+)$~',$v,$m)){
		$id=wc_get_product_id_by_sku($m[1]);if($id && 'publish'===get_post_status($id)){wp_safe_redirect(get_permalink($id));exit;}
		$src=json_decode(file_get_contents(__DIR__.'/dist/legacy-slugs.json'),true);
		if(in_array($m[1],$src,true))return;
	}else if(!preg_match('~^collections/(.+)$~',$v,$m)||$m[1]==='all'||term_exists($m[1],'product_cat')||in_array($m[1],json_decode(file_get_contents(__DIR__.'/dist/legacy-categories.json'),true),true))return;
	global $wp_query;$wp_query->set_404();$wp_query->set('ao_view','');status_header(404);nocache_headers();
},5);
add_action('after_switch_theme',static function(){ao_routes();flush_rewrite_rules(false);});
function ao_context(){
	if(!function_exists('is_woocommerce')||is_admin()||is_feed()||wp_doing_ajax()||is_preview()||is_customize_preview())return false;
	$v=trim((string)get_query_var('ao_view'),'/');
	if($v && !preg_match('~^(guide|blogs/news|collections(?:/[a-z0-9-]+)?|products/[a-z0-9-]+)$~D',$v))return false;
	$restricted=is_product()||is_shop()||is_product_taxonomy()||is_checkout()||is_cart()||is_account_page()||$v;
	// Do not expose preview-only shop pages through virtual routes.
	if('yes'===get_option('woocommerce_coming_soon')&&!current_user_can('manage_woocommerce')&&($restricted||'yes'!==get_option('woocommerce_store_pages_only')))return false;
	if(is_front_page()&&!$v)return '/';
	if($v)return '/'.$v;
	if(is_order_received_page())return ao_receipt() ? '/receipt' : false;
	if(is_account_page())return '/my-account';
	if(is_wc_endpoint_url())return false;
	if(is_cart())return '/cart';
	if(is_checkout())return '/checkout';
	if(is_shop())return '/collection';
	if(is_product_category())return '/collections/'.get_queried_object()->slug;
	if(is_product()){$p=wc_get_product(get_queried_object_id());return $p && am_stand($p)?'/products/'.$p->get_sku():false;}
	if(is_page()&&!is_cart()&&!is_account_page())return '/pages/'.get_post_field('post_name',get_queried_object_id());
	return false;
}
// Direct Buy keeps the selection in the URL until submission. An empty Woo
// cart must not divert it (or the unified empty state) to the cart page.
add_filter('woocommerce_checkout_redirect_empty_cart',static function($redirect){
	return ao_context()==='/checkout'?false:$redirect;
});
add_filter('template_include',static function($tpl){if(!ao_context())return $tpl;if(get_query_var('ao_view')){global $wp_query;$wp_query->is_404=false;status_header(200);}return __DIR__.'/screen.php';},99);
add_filter('redirect_canonical',static function($url){return get_query_var('ao_view')?false:$url;});
add_filter('pre_handle_404',static function($done){return get_query_var('ao_view')?true:$done;});
add_filter('do_shortcode_tag',static function($html,$tag){
	if($tag!=='aytal_footer_links')return $html;
	return preg_replace('~<a href="([^"]+/track-your-order/?)">[^<]*</a>~i','<a class="ao-native-track" href="$1">Track Order</a>',$html);
},10,2);
add_filter('pre_get_document_title',static function($title){
	$labels=array('guide'=>'Stand guide','collections'=>'Collections','collections/all'=>'All products','blogs/news'=>'Journal');
	$v=get_query_var('ao_view');return isset($labels[$v])?$labels[$v].' | AYTAL MART':$title;
});
add_action('wp_enqueue_scripts',static function(){
	if(!ao_context()){wp_enqueue_style('ao-native-fallback',get_template_directory_uri().'/style.css',array(),wp_get_theme(get_template())->get('Version'));wp_enqueue_style('ao-native-chrome',get_stylesheet_directory_uri().'/native-chrome.css',array('ao-native-fallback'),wp_get_theme()->get('Version'));return;}
	foreach(array('aytal-store','global-styles','wp-block-library','wp-block-library-theme','classic-theme-styles','woocommerce-layout','woocommerce-general','woocommerce-smallscreen','wc-blocks-style','core-block-supports','wp-emoji-styles') as $h){if(is_account_page()&&strpos($h,'woocommerce-')===0)continue;wp_dequeue_style($h);}
	wp_dequeue_script('aytal-store'); wp_enqueue_style('ao-original',get_stylesheet_directory_uri().'/dist/store.css',array(),wp_get_theme()->get('Version'));
},999);
add_action('admin_notices',static function(){if(!function_exists('WC'))echo '<div class="notice notice-error"><p>Activate WooCommerce to use the AYTAL storefront.</p></div>';});
