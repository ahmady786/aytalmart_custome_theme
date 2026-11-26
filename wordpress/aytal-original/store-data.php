<?php
defined('ABSPATH') || exit;
function ao_image($id){
	if(!$id)return null;$u=wp_get_attachment_image_src($id,'full');if(!$u)return null;
	return array('url'=>$u[0],'width'=>$u[1],'height'=>$u[2],'srcset'=>wp_get_attachment_image_srcset($id,'full')?:'');
}
function ao_data($route){
	$d=array('route'=>$route,'base'=>get_stylesheet_directory_uri().'/dist','home'=>home_url('/'),'urls'=>array('/'=>home_url('/'),'/collection'=>wc_get_page_permalink('shop'),'/checkout'=>wc_get_checkout_url(),'/bag'=>wc_get_checkout_url()),'catalog'=>array(),'images'=>array(),'frames'=>array(),'pages'=>array(),'categories'=>array(),'extra'=>array(),'ajax'=>WC_AJAX::get_endpoint('ao_prepare'),'checkout'=>WC_AJAX::get_endpoint('checkout'),'help'=>WC_AJAX::get_endpoint('ao_help'),'boot'=>WC_AJAX::get_endpoint('ao_boot'));
	$d['activity']=WC_AJAX::get_endpoint('ao_activity');
	$d['urls']['/my-account']=wc_get_page_permalink('myaccount');
	$d['urls']['/cart']=wc_get_cart_url();
	$d['cartView']=WC_AJAX::get_endpoint('ao_cart_view');
	$d['cartEndpoint']=WC_AJAX::get_endpoint('ao_cart_checkout');
	if($route==='/')foreach(ao_phone_slides() as $key=>$label){
		$id=(int)get_theme_mod('ao_mobile_'.$key,0);if($id && wp_attachment_is_image($id))$d['images']['mobile-hero-'.$key]=ao_image($id);
	}
	if($route==='/checkout'&&!isset($_GET['items'])){
		$d['cart']=ao_cart_snapshot();$d['cartEndpoint']=WC_AJAX::get_endpoint('ao_cart_checkout');
	}
	$parent=json_decode(file_get_contents(get_template_directory().'/starter/catalog.json'),true);
	foreach(array('Gold','White','Silver','Black') as $f)foreach(array('set','single') as $k){
		$s=strtolower($f).'-'.$k;$p=wc_get_product(wc_get_product_id_by_sku($s));if(!$p||$p->get_status()!=='publish')continue;
		$name=$p->get_name();if(stripos($name,$f.' ')===0)$name=substr($name,strlen($f)+1);
		$d['catalog'][]=array('sku'=>$s,'kind'=>$k,'finish'=>$f,'name'=>$name,'price'=>(float)$p->get_price(),'original'=>(float)($p->get_regular_price()?:$p->get_price()),'available'=>$p->is_purchasable()&&$p->is_in_stock(),'sales'=>(int)$p->get_total_sales());
		$d['urls']['/products/'.$s]=get_permalink($p->get_id());
		if($route==='/products/'.$s){
			$d['description']=wp_kses_post(wpautop($p->get_description()));
			$d['reviews']=array();
			if(wc_reviews_enabled() && comments_open($p->get_id()))foreach(get_comments(array('post_id'=>$p->get_id(),'type'=>'review','status'=>'approve','number'=>3,'parent'=>0)) as $review){
				$d['reviews'][]=array('id'=>(int)$review->comment_ID,'name'=>get_comment_author($review),'text'=>wp_strip_all_tags($review->comment_content),'rating'=>min(5,max(0,(int)get_comment_meta($review->comment_ID,'rating',true))));
			}
		}
		$ids=array_values(array_filter(array_merge(array($p->get_image_id()),$p->get_gallery_image_ids()))); $frame=array();$defaults=$parent['catalog'][$s]['media']??array();
		foreach($ids as $i=>$id){$name=$defaults[$i]??'';$same=$name && (int)get_option('am_media_'.md5($name))===(int)$id;
			$key=$i===0?$s:($i===1?$s.'-photo':$s.'-view-'.$i);
			if($same && $i>1 && preg_match('/photo-(\d+)/',$name,$m)){$frame[]=array('photo'=>(int)$m[1]);continue;}
			if(!$same)$d['images'][$key]=ao_image($id);
			$frame[]=array('asset'=>$key);}
		if(!$ids){$d['images'][$s]=array('url'=>wc_placeholder_img_src(),'width'=>800,'height'=>800);$frame[]=array('asset'=>$s);}
		$d['frames'][$s]=$frame;
	}
	$featured=get_post_thumbnail_id(get_option('page_on_front')); // Home artwork uses the store owner's chosen image blocks.
	$home=get_post((int)get_option('page_on_front'));if($home){$blocks=parse_blocks($home->post_content);
		foreach($blocks as $b)if(str_contains($b['attrs']['className']??'','am-hero')){
			$i=0;foreach($b['innerBlocks'] as $img){if($img['blockName']!=='core/image'||$i>=3)continue;
				$id=(int)($img['attrs']['id']??0);$keys=array('hero-01-complete-sets','hero-02-quran-stands','hero-03-golden-gallery');
				if($id && $id!==(int)get_option('am_media_'.md5('hero-'.($i+1).'.webp')))$d['images'][$keys[$i]]=ao_image($id);$i++;}
		}}
	$logo=(int)get_option('site_logo');if($logo && $logo!==(int)get_option('am_media_'.md5('aytal-mart.png')))$d['logo']=wp_get_attachment_image_url($logo,'medium');
	foreach($parent['pages'] as $seed){$slug=$seed['slug'];$post=$slug==='privacy-policy'?get_post((int)get_option('wp_page_for_privacy_policy')):get_page_by_path($slug);if(!$post||$post->post_status!=='publish')continue;
		$d['urls']['/pages/'.$slug]=get_permalink($post);if($route==='/pages/'.$post->post_name){
			$normalize=static function($html){return trim(preg_replace('/\s+/u',' ',preg_replace('/<!--.*?-->/s','',$html)));};
			$d['route']='/pages/'.$slug;$d['pages'][]=array('slug'=>$slug,'title'=>$post->post_title,'customCopy'=>$normalize($post->post_content)!==$normalize(wp_kses_post($seed['html'])),'html'=>wp_kses_post(apply_filters('the_content',$post->post_content)));}}
	if(str_starts_with($route,'/pages/')&&!$d['pages']){$post=get_queried_object();if($post instanceof WP_Post)$d['pages'][]=array('slug'=>$post->post_name,'title'=>$post->post_title,'html'=>wp_kses_post(apply_filters('the_content',$post->post_content)));}
	foreach(get_terms(array('taxonomy'=>'product_cat','hide_empty'=>false)) as $t){if(!is_object($t)||$t->slug==='uncategorized')continue;$d['categories'][]=array('slug'=>$t->slug,'title'=>$t->name,'count'=>(int)$t->count,'html'=>wp_kses_post(wpautop($t->description)),'products'=>array());$d['urls']['/collections/'.$t->slug]=get_term_link($t);}
	foreach(wc_get_products(array('status'=>'publish','visibility'=>'visible','limit'=>-1,'return'=>'objects')) as $p){if(am_stand($p))continue;$d['extra'][]=array('name'=>$p->get_name(),'url'=>get_permalink($p->get_id()),'price'=>wc_price($p->get_price()),'image'=>wp_get_attachment_image_url($p->get_image_id(),'woocommerce_thumbnail'),'categories'=>wp_get_post_terms($p->get_id(),'product_cat',array('fields'=>'slugs')));}
	if($route==='/receipt')$d['receipt']=ao_receipt();
	return $d;
}
