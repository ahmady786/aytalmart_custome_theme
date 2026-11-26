<?php
/** Legacy public URLs belong to the store, not to its former commerce platform. */
defined('ABSPATH') || exit;

function ao_legacy_manifest(){
	static $records=null;
	if(null===$records){
		$records=array();
		$source=json_decode(file_get_contents(__DIR__.'/dist/legacy-content.json'),true);
		foreach(array('pages','products','collections') as $group)
			foreach($source[$group] as $row)$records['/'.$group.'/'.$row['slug']]=$row;
	}
	return $records;
}
function ao_legacy_page_key($id){
	$p=$id?get_post($id):null;
	if(!$p||'page'!==$p->post_type||'publish'!==$p->post_status||$p->post_password||$p->post_parent)return '';
	if((int)$id===(int)get_option('wp_page_for_privacy_policy'))return 'privacy-policy';
	return isset(ao_legacy_manifest()['/pages/'.$p->post_name])?$p->post_name:'';
}
function ao_legacy_page($key){
	$id='privacy-policy'===$key?(int)get_option('wp_page_for_privacy_policy'):0;
	$post=$id?get_post($id):get_page_by_path($key);
	return $post && ao_legacy_page_key($post->ID)===$key?$post:null;
}
function ao_seo_rules(){
	// Resolve through the real WP page query so drafts, edits and native SEO tools work.
	$keys=array();
	foreach(ao_legacy_manifest() as $path=>$row)if(str_starts_with($path,'/pages/'))$keys[]=$row['slug'];
	add_rewrite_rule('^pages/('.implode('|',$keys).')/?$','index.php?ao_page=$matches[1]','top');
	add_rewrite_rule('^(sitemap\.xml|aytal-store-sitemap\.xml|agents\.md)/?$','index.php?ao_document=$matches[1]','top');
	add_rewrite_rule('^customer_authentication/redirect/?$','index.php?ao_document=account','top');
}
// Core also recognizes the historical /sitemap.xml alias. Select our index
// before WP handles canonical redirects, even if a host cached older rules.
add_action('parse_request',static function($wp){
	if(trim($wp->request,'/')==='sitemap.xml')$wp->query_vars=array('ao_document'=>'sitemap.xml');
	if(preg_match('~^sitemap_(agentic_discovery|(?:products|pages|collections|blogs)_1)\.xml$~D',trim($wp->request,'/')))$wp->query_vars=array('ao_document'=>'aytal-store-sitemap.xml');
});
add_filter('query_vars',static function($v){$v[]='ao_page';$v[]='ao_document';return $v;});
add_filter('request',static function($q){
	if(!isset($q['ao_page']))return $q;
	$key=$q['ao_page'];unset($q['ao_page']);
	$p=is_string($key)&&isset(ao_legacy_manifest()['/pages/'.$key])?ao_legacy_page($key):null;
	if($p)$q['page_id']=$p->ID;else $q['error']='404';
	return $q;
});
add_action('wp_loaded',static function(){
	if(get_option('ao_rewrite_version')==='2.0.7')return;
	flush_rewrite_rules(false);update_option('ao_rewrite_version','2.0.7',false);
});
add_filter('page_link',static function($url,$id,$sample){
	$key=$sample?'':ao_legacy_page_key($id);return $key?home_url('/pages/'.$key):$url;
},10,3);
add_filter('term_link',static function($url,$term,$taxonomy){
	return 'product_cat'===$taxonomy&&isset(ao_legacy_manifest()['/collections/'.$term->slug])?home_url('/collections/'.$term->slug):$url;
},10,3);
function ao_request_path(){
	global $wp;return '/'.trim((string)($wp->request??''),'/');
}
add_filter('redirect_canonical',static function($to){
	$path=ao_request_path();
	if(isset(ao_legacy_manifest()[$path]) || (is_404()&&preg_match('~^/(pages|collections|products)/~',$path)))return false;
	return $to;
},20);
add_action('template_redirect',static function(){
	if(!in_array($_SERVER['REQUEST_METHOD']??'GET',array('GET','HEAD'),true)||is_preview()||is_feed()||is_embed()||is_paged()||is_customize_preview())return;
	$path=ao_request_path();$target='';
	if(is_page()&&($key=ao_legacy_page_key(get_queried_object_id()))){
		if($path==='/'.get_post_field('post_name',get_queried_object_id()))$target='/pages/'.$key;
	}elseif(function_exists('is_product_category')&&is_product_category()&&!get_query_var('ao_view')){
		$term=get_queried_object();$canonical='/collections/'.$term->slug;
		if(isset(ao_legacy_manifest()[$canonical])&&$path!==$canonical)$target=$canonical;
	}
	if($target){wp_safe_redirect(home_url($target),301);exit;}
},4);
function ao_public_routes(){
	$routes=array('/','/collections','/collections/all','/guide','/blogs/news');
	foreach(ao_legacy_manifest() as $path=>$record){
		if(!str_starts_with($path,'/pages/')||ao_legacy_page($record['slug']))$routes[]=$path;
	}
	return $routes;
}
// Register with the core index too: some hosts redirect sitemap.xml before
// WordPress loads the theme. Both discovery paths must include legacy URLs.
add_action('init',static function(){
	if(!class_exists('WP_Sitemaps_Provider')||!function_exists('WC'))return;
	$provider=new class extends WP_Sitemaps_Provider {
		public function __construct(){$this->name='aytal';$this->object_type='aytal';}
		public function get_url_list($page_num,$object_subtype=''){
			return (int)$page_num===1?array_map(static fn($p)=>array('loc'=>home_url($p)),ao_public_routes()):array();
		}
		public function get_max_num_pages($object_subtype=''){return 1;}
		public function get_sitemap_entries(){return array(array('loc'=>home_url('/aytal-store-sitemap.xml')));}
	};
	wp_register_sitemap_provider('aytal',$provider);
},20);
function ao_staging(){
	$host=strtolower((string)wp_parse_url(home_url('/'),PHP_URL_HOST));
	return str_ends_with($host,'.hostingersite.com') || 'production'!==wp_get_environment_type();
}
function ao_noindex_request(){
	return ao_staging() || !get_option('blog_public') || 'yes'===get_option('woocommerce_coming_soon') ||
		is_search() || is_404() || (function_exists('is_checkout')&&(is_checkout()||is_cart()||is_account_page())) ||
		isset($_GET['items'])||isset($_GET['finish'])||isset($_GET['type'])||isset($_GET['ao_view'])||isset($_GET['ao_page']);
}
add_filter('wp_robots',static function($tags){
	if(ao_noindex_request()){unset($tags['index']);$tags['noindex']=true;}
	return $tags;
},99);
add_action('template_redirect',static function(){
	if(ao_noindex_request())header('X-Robots-Tag: noindex',true);
	$doc=get_query_var('ao_document');
	if(!$doc || !in_array($doc,array('account','agents.md','sitemap.xml','aytal-store-sitemap.xml'),true))return;
	if($doc==='account'&&function_exists('wc_get_page_permalink')){wp_safe_redirect(wc_get_page_permalink('myaccount'),302);exit;}
	if($doc==='account'||!function_exists('WC'))return;
	if($doc==='agents.md'){
		status_header(200);header('Content-Type: text/plain; charset=UTF-8');
		echo "# AYTAL MART\n\nPublic catalog: ".esc_url_raw(home_url('/collections/all'))."\nStore policies: ".esc_url_raw(home_url('/pages/terms-of-service'))."\n";exit;
	}
	if(!get_option('blog_public')||'yes'===get_option('woocommerce_coming_soon')){status_header(404);exit;}
	status_header(200);header('Content-Type: application/xml; charset=UTF-8');
	echo '<?xml version="1.0" encoding="UTF-8"?>';
	$ns=' xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';
	if($doc==='sitemap.xml'){
		echo '<sitemapindex'.$ns.'>';
		$server=wp_sitemaps_get_server();$rows=$server->index->get_sitemap_list();
		if(!in_array(home_url('/aytal-store-sitemap.xml'),array_column($rows,'loc'),true))$rows[]=array('loc'=>home_url('/aytal-store-sitemap.xml'));
		foreach($rows as $row)echo '<sitemap><loc>'.esc_xml($row['loc']).'</loc></sitemap>';
		echo '</sitemapindex>';
	}else{
		echo '<urlset'.$ns.'>';foreach(array_merge(ao_public_routes(),array('/agents.md')) as $route)echo '<url><loc>'.esc_xml(home_url($route)).'</loc></url>';echo '</urlset>';
	}exit;
},0);
add_filter('robots_txt',static function($text,$public){
	return $public&&!ao_staging()&&'yes'!==get_option('woocommerce_coming_soon')?$text."\nSitemap: ".home_url('/sitemap.xml')."\n":$text;
},20,2);
add_filter('wp_sitemaps_posts_query_args',static function($args,$type){
	if('page'===$type && function_exists('wc_get_page_id')){
		$args['post__not_in']=array_unique(array_merge($args['post__not_in']??array(),array_filter(array_map('wc_get_page_id',array('cart','checkout','myaccount')),static fn($id)=>$id>0)));
	}
	return $args;
},10,2);
function ao_seo_details($route){
	if(!$route||in_array($route,array('/cart','/my-account','/checkout','/receipt'),true))return null;
	$labels=array(
		'/'=>array('Quran & Janamaz Stands in Pakistan','Shop wall-mounted Quran holders and matching Janamaz stands in gold, white, silver and black. Compare finishes, find the right set and order with cash on delivery.'),
		'/guide'=>array('Quran & Janamaz Stand Guide','Compare the single Quran holder and the complete set, choose a finish and plan the space for your prayer mat.'),
		'/collections'=>array('Shop Collections','Explore Islamic gifts, wall-mounted Quran stands and custom metal décor from AYTAL MART.'),
		'/collections/all'=>array('All Products','Browse AYTAL MART products, including Quran holders, matching Janamaz stands and metal décor.'),
		'/collection'=>array('Shop Quran Stands','Compare finishes and prices for individual wall-mounted Quran holders and complete Quran and Janamaz sets.'),
		'/blogs/news'=>array('Guides for Your Prayer Space','Read practical guides to choosing a Quran stand and planning the space for your Janamaz rail and tasbeeh.'));
	$row=ao_legacy_manifest()[$route]??null;
	$title=$labels[$route][0]??($row['title']??'');$html=$labels[$route][1]??($row['html']??'');$url=home_url($route);
	if(is_page()&&!is_front_page()&&!get_query_var('ao_view')){
		$p=get_queried_object();$title=$p->post_title;$html=$p->post_excerpt?:$p->post_content;$url=get_permalink($p);
	}elseif(function_exists('is_product')&&is_product()){
		$p=wc_get_product(get_queried_object_id());if(!$p)return null;$title=$p->get_name();$html=$p->get_short_description()?:$p->get_description();$url=get_permalink($p->get_id());
	}elseif($route==='/collection')$url=wc_get_page_permalink('shop');
	elseif(str_starts_with($route,'/collections/')&&$route!=='/collections/all'){
		$t=get_term_by('slug',substr($route,13),'product_cat');
		if($t){$title=$t->name;if($t->description)$html=$t->description;$url=get_term_link($t);}
	}
	if(!$title)return null;
	$text=html_entity_decode(wp_strip_all_tags(strip_shortcodes($html),true),ENT_QUOTES|ENT_HTML5,'UTF-8');
	$text=trim(preg_replace('/\s+/u',' ',$text));if(!$text)$text='Explore '.$title.' at AYTAL MART in Pakistan.';
	$description=wp_html_excerpt($text,155,'…');
	return compact('title','description','url');
}
function ao_seo_plugin(){return defined('WPSEO_VERSION')||defined('RANK_MATH_VERSION')||defined('AIOSEO_VERSION');}
add_action('wp',static function(){
	$data=ao_seo_details(ao_context());if(!$data || ao_seo_plugin())return;
	// This template does not run Woo's standard product-summary action.
	if(function_exists('is_product')&&is_product()&&isset(WC()->structured_data)){
		$product=wc_get_product(get_queried_object_id());
		if($product && am_stand($product))WC()->structured_data->generate_product_data($product);
	}
	remove_action('wp_head','rel_canonical');
	add_filter('pre_get_document_title',static function()use($data){return preg_match('/AYTAL MART$/i',$data['title'])?$data['title']:$data['title'].' | AYTAL MART';},90);
	add_action('wp_head',static function()use($data){
		echo '<meta name="description" content="'.esc_attr($data['description']).'">'."\n".'<link rel="canonical" href="'.esc_url($data['url']).'">'."\n";
		echo '<meta property="og:type" content="website"><meta property="og:site_name" content="AYTAL MART"><meta property="og:title" content="'.esc_attr($data['title']).'"><meta property="og:description" content="'.esc_attr($data['description']).'"><meta property="og:url" content="'.esc_url($data['url']).'">'."\n";
	},3);
});
function ao_seo_body($ao,$has_heading){
	$d=ao_seo_details($ao['route']);if(!$d)return;
	echo '<section class="shop-section info-wrap">';if(!$has_heading)echo '<h1>'.esc_html($d['title']).'</h1>';
	$html=$ao['pages'][0]['html']??($ao['description']??(ao_legacy_manifest()[$ao['route']]['html']??''));
	echo $html?wp_kses_post($html):'<p>'.esc_html($d['description']).'</p>';
	if($ao['route']==='/'||in_array($ao['route'],array('/collection','/collections/all','/collections/islamic-collection'),true)){
		echo '<ul>';foreach($ao['catalog'] as $p)echo '<li><a href="'.esc_url($ao['urls']['/products/'.$p['sku']]).'">'.esc_html($p['finish'].' '.$p['name']).'</a> — '.esc_html('Rs '.number_format($p['price'])).'</li>';echo '</ul>';
	}
	if($ao['route']==='/'||$ao['route']==='/collections'||$ao['route']==='/blogs/news'){
		echo '<nav aria-label="Explore AYTAL MART"><ul>';
		foreach(ao_public_routes() as $route)if($route!==$ao['route']&&($r=ao_legacy_manifest()[$route]??null))echo '<li><a href="'.esc_url(home_url($route)).'">'.esc_html($r['title']).'</a></li>';
		echo '<li><a href="'.esc_url(home_url('/guide')).'">Stand guide</a></li></ul></nav>';
	}
	echo '</section>';
}
