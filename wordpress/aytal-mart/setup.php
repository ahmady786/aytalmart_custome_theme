<?php
defined('ABSPATH') || exit;
function am_bundle(){static $data; if(!isset($data))$data=json_decode(file_get_contents(__DIR__.'/starter/catalog.json'),true,512,JSON_THROW_ON_ERROR);return $data;}
function am_media($file,$title){
	$key='am_media_'.md5($file);$old=(int)get_option($key);
	if($old&&get_post_type($old)==='attachment')return $old;
	$src=__DIR__.'/starter/'.basename($file);if(!is_file($src))throw new RuntimeException('Missing starter image: '.basename($file));
	require_once ABSPATH.'wp-admin/includes/image.php';
	$bits=wp_upload_bits(basename($file),null,file_get_contents($src));if($bits['error'])throw new RuntimeException($bits['error']);
	$mime=wp_check_filetype($bits['file']);
	$id=wp_insert_attachment(array('post_mime_type'=>$mime['type'],'post_title'=>$title,'post_status'=>'inherit'),$bits['file'],0,true);
	if(is_wp_error($id))throw new RuntimeException($id->get_error_message());
	wp_update_attachment_metadata($id,wp_generate_attachment_metadata($id,$bits['file']));update_post_meta($id,'_wp_attachment_image_alt',$title);update_option($key,$id,false);return $id;
}
function am_term($slug,$name){
	$t=get_term_by('slug',$slug,'product_cat');if($t)return (int)$t->term_id;
	$r=wp_insert_term($name,'product_cat',array('slug'=>$slug));if(is_wp_error($r))throw new RuntimeException($r->get_error_message());return (int)$r['term_id'];
}
function am_page($slug,$title,$content){
	$old=get_page_by_path($slug);if($old)return (int)$old->ID;
	$id=wp_insert_post(wp_slash(array('post_type'=>'page','post_status'=>'publish','post_name'=>$slug,'post_title'=>$title,'post_content'=>$content)),true);
	if(is_wp_error($id))throw new RuntimeException($id->get_error_message());return $id;
}
function am_woo_settings(){
	WC_Install::create_pages();
	update_option('woocommerce_currency','PKR');update_option('woocommerce_allowed_countries','specific');update_option('woocommerce_specific_allowed_countries',array('PK'));
	update_option('woocommerce_ship_to_countries','');update_option('woocommerce_default_country','PK:PB');update_option('woocommerce_store_city','Lahore');
	$cod=(array)get_option('woocommerce_cod_settings',array());$cod['enabled']='yes';$cod['title']='Cash on Delivery';$cod['description']='Pay when your order arrives.';update_option('woocommerce_cod_settings',$cod);
	// A dedicated domestic zone; never edit or delete another shipping method.
	$zone=null;foreach(WC_Shipping_Zones::get_zones() as $z){if($z['zone_name']==='AYTAL MART — Pakistan'){$zone=new WC_Shipping_Zone($z['zone_id']);break;}}
	if(!$zone){$zone=new WC_Shipping_Zone();$zone->set_zone_name('AYTAL MART — Pakistan');$zone->add_location('PK','country');$zone->set_zone_order(0);$zone->save();}
	$free=false;foreach($zone->get_shipping_methods() as $m){if($m->id==='free_shipping')$free=true;}
	if(!$free){$instance=$zone->add_shipping_method('free_shipping');if(!$instance)throw new RuntimeException('Free shipping could not be created.');}
	// WC's own classic checkout performs stock checks, COD validation, email and order creation.
	$id=wc_get_page_id('checkout');if($id>0 && has_block('woocommerce/checkout',get_post_field('post_content',$id))){
		wp_update_post(array('ID'=>$id,'post_content'=>'<!-- wp:shortcode -->[woocommerce_checkout]<!-- /wp:shortcode -->'));
	}
}
function am_brand(){
	update_option('blogname','AYTAL MART');update_option('blogdescription','Quran stands and janamaz stand sets');
	$logo=am_media('aytal-mart.png','AYTAL MART');update_option('site_logo',$logo);set_theme_mod('custom_logo',$logo);
}
function am_product($sku,$d){
	if(wc_get_product_id_by_sku($sku))return;
	$row=$d['catalog'][$sku];$p=new WC_Product_Simple();$p->set_name($row['name']);$p->set_slug($sku);$p->set_sku($sku);
	$p->set_regular_price('4000');$p->set_sale_price((string)$row['price']);$p->set_description(wp_kses_post($row['description']));$p->set_short_description($row['summary']);
	$p->set_status('publish');$p->set_category_ids(array(am_term('islamic-collection','Islamic Collection'),am_term($row['kind']==='set'?'complete-sets':'quran-stands',$row['kind']==='set'?'Complete sets':'Single Quran stands')));
	$p->update_meta_data('_aytal_stand','yes');$p->update_meta_data('_aytal_kind',$row['kind']);$p->update_meta_data('_aytal_finish',$row['finish']);
	$g=array();foreach($row['media'] as $i=>$file){$img=am_media($file,$row['name'].' — '.($i===0?'studio view':($i===1?'original photograph':'additional view')));if(!$i)$p->set_image_id($img);else $g[]=$img;}
	$p->set_gallery_image_ids($g);$p->save();
}
function am_homepage(){
	$shop=wc_get_page_permalink('shop');$slides='';
	foreach(array('Complete Quran & Janamaz sets','Single Quran stands','The golden gallery') as $i=>$label){
		$id=am_media('hero-'.($i+1).'.webp',$label);$src=wp_get_attachment_url($id);$cat=get_term_by('slug',$i===1?'quran-stands':'complete-sets','product_cat');
		$url=$cat?get_term_link($cat):$shop;if(is_wp_error($url))$url=$shop;
		$slides.='<!-- wp:image '.wp_json_encode(array('id'=>$id,'sizeSlug'=>'full','linkDestination'=>'custom','className'=>'am-slide')).' --><figure class="wp-block-image size-full am-slide"><a href="'.esc_url($url).'"><img src="'.esc_url($src).'" alt="'.esc_attr($label).'" class="wp-image-'.$id.'"/></a></figure><!-- /wp:image -->';
	}
	$html='<!-- wp:group {"className":"am-hero"} --><div class="wp-block-group am-hero">'.$slides.'</div><!-- /wp:group -->';
	$html.='<!-- wp:heading {"level":1,"className":"am-intro"} --><h1 class="wp-block-heading am-intro">A place for your prayer essentials</h1><!-- /wp:heading -->';
	$html.='<!-- wp:paragraph {"className":"am-intro"} --><p class="am-intro">Discover wall-mounted Quran holders and matching Janamaz rails in gold, white, silver and black.</p><!-- /wp:paragraph -->';
	$html.='<!-- wp:heading --><h2 class="wp-block-heading">Shop the collections</h2><!-- /wp:heading --><!-- wp:shortcode -->[aytal_collections]<!-- /wp:shortcode -->';
	$html.='<!-- wp:heading --><h2 class="wp-block-heading">Quran &amp; Janamaz stand sets</h2><!-- /wp:heading --><!-- wp:shortcode -->[products category="complete-sets" columns="4" limit="8" orderby="menu_order" order="ASC"]<!-- /wp:shortcode -->';
	$html.='<!-- wp:heading --><h2 class="wp-block-heading">Single Quran stands</h2><!-- /wp:heading --><!-- wp:shortcode -->[products category="quran-stands" columns="4" limit="8" orderby="menu_order" order="ASC"]<!-- /wp:shortcode -->';
	$id=am_page('aytal-home','AYTAL MART',$html);update_option('page_on_front',$id);update_option('show_on_front','page');
	$nav=array('Shop'=>wc_get_page_id('shop'));foreach(array('care-installation-guide','faq','contact-aytal-mart')as $slug){$p=get_page_by_path($slug);if($p)$nav[$p->post_title]=$p->ID;}
	if(!get_option('am_nav_id')){$cnt='';foreach($nav as $label=>$pid){if($pid>0)$cnt.='<!-- wp:navigation-link '.wp_json_encode(array('label'=>$label,'type'=>'page','kind'=>'post-type','id'=>(int)$pid,'url'=>get_permalink($pid))).' /-->';}
		$n=wp_insert_post(wp_slash(array('post_type'=>'wp_navigation','post_status'=>'publish','post_title'=>'Store navigation','post_content'=>$cnt)),true);if(!is_wp_error($n))update_option('am_nav_id',$n);}
	$privacy=get_page_by_path('aytal-privacy-policy')?:get_page_by_path('privacy-policy');if($privacy && 'publish'===$privacy->post_status)update_option('wp_page_for_privacy_policy',$privacy->ID);
	$terms=get_page_by_path('terms-of-service');if($terms)update_option('woocommerce_terms_page_id',$terms->ID);
	flush_rewrite_rules(false);
}
add_action('admin_menu',static function(){add_theme_page('AYTAL store setup','AYTAL store setup','manage_options','aytal-store-setup','am_setup_screen');});
function am_jobs(){ $d=am_bundle();return array_merge(array('settings','brand'),array_map(static function($p){return 'page:'.$p['slug'];},$d['pages']),array_map(static function($k){return 'product:'.$k;},array_keys($d['catalog'])),array('home'));}
function am_setup_screen(){
	if(!current_user_can('manage_options'))return;
	echo '<div class="wrap"><h1>AYTAL MART · Store setup</h1><p>For the new staging store only. Creates products and photos, publishes store pages, sets the homepage, configures PKR, Pakistan-only delivery, free shipping and COD. Leaves live domains, DNS, orders and payments untouched. Existing product SKUs are skipped. No customer data is imported.</p>';
	if(!class_exists('WooCommerce')){echo '<p>Activate WooCommerce first.</p></div>';return;}
	echo '<button type="button" id="am-seed" class="button button-primary">Set up this staging store</button><pre id="am-progress" aria-live="polite"></pre></div>';
	?>
	<script>
	(()=>{const b=document.querySelector('#am-seed'),out=document.querySelector('#am-progress'),jobs=<?php echo wp_json_encode(am_jobs()); ?>;
	b.onclick=async()=>{b.disabled=true;out.textContent='';try{for(const job of jobs){const payload=new URLSearchParams({action:'am_setup_job',job,_ajax_nonce:<?php echo wp_json_encode(wp_create_nonce('am_setup_job')); ?>});
	const r=await fetch(ajaxurl,{method:'POST',body:payload});if(!r.ok)throw Error(job+' · HTTP '+r.status);const j=await r.json();if(!j.success)throw Error(job+' · '+j.data);out.textContent+=job+' ✓\n';}out.textContent+='Store setup complete.';}catch(e){out.textContent+='Stopped: '+e.message;b.disabled=false;}}})();
	</script><?php
}
add_action('wp_ajax_am_setup_job',static function(){
	check_ajax_referer('am_setup_job');if(!current_user_can('manage_options')||!current_user_can('manage_woocommerce')||!class_exists('WooCommerce'))wp_send_json_error('Administrator access and WooCommerce required.',403);
	try{$d=am_bundle();$job=sanitize_text_field(wp_unslash($_POST['job']??''));if(!in_array($job,am_jobs(),true))wp_send_json_error('Unknown setup step.',400);
		if(get_option('am_seed_v1_'.$job))wp_send_json_success();
		if($job==='settings')am_woo_settings();elseif($job==='brand')am_brand();elseif($job==='home')am_homepage();
		elseif(strpos($job,'product:')===0)am_product(substr($job,8),$d);
		else foreach($d['pages'] as $p){if('page:'.$p['slug']===$job){
			// Fresh WordPress ships an unpublished sample privacy page: keep it; use our own distinct slug.
			$slug=$p['slug'];$existing=get_page_by_path($slug);if($slug==='privacy-policy'&&$existing&&$existing->post_status!=='publish')$slug='aytal-privacy-policy';
			am_page($slug,$p['title'],'<!-- wp:freeform -->'.wp_kses_post($p['html']).'<!-- /wp:freeform -->');break;}}
		update_option('am_seed_v1_'.$job,1,false);wp_send_json_success();
	}catch(Throwable $e){wp_send_json_error($e->getMessage());}
});
