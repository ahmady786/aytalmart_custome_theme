<?php defined('ABSPATH') || exit;
$ao=ao_data(ao_context());$is_account=$ao['route']==='/my-account';
if(in_array($ao['route'],array('/receipt','/checkout','/cart','/my-account'),true)){nocache_headers();header('Referrer-Policy: '.($ao['route']==='/receipt'?'no-referrer':'same-origin'));}
$account_html=$is_account?do_shortcode('[woocommerce_my_account]'):'';
?><!doctype html><html <?php language_attributes(); ?>><head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#322419"><?php wp_head(); ?></head><body <?php body_class('ao-original-store'); ?>><?php wp_body_open(); ?>
<div id="ao-store"><?php $shown=false;if($ao['route']==='/'){ $shell=file_get_contents(__DIR__.'/dist/hero-shell.html');if(empty(array_intersect_key($ao['images'],array_flip(array('hero-01-complete-sets','mobile-hero-01-complete-sets')))) && empty($ao['logo'])){echo str_replace(array('__AO_ASSETS__','__AO_SHOP__'),array(esc_url($ao['base']),esc_url($ao['urls']['/collection'])),$shell);$shown=true;} } ao_seo_body($ao,$shown); ?></div>
<?php if($is_account): ?><div id="ao-native-account"><?php echo $account_html; // Native WooCommerce markup; preserves its forms, nonces and extension hooks. ?></div><?php endif; ?>
<noscript><p>JavaScript is required for the interactive gallery and order form.</p></noscript>
<script id="ao-context" type="application/json"><?php echo wp_json_encode($ao,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT); ?></script><script defer src="<?php echo esc_url(add_query_arg('v',wp_get_theme()->get('Version'),$ao['base'].'/store.js')); ?>"></script><?php wp_footer(); ?></body></html>
