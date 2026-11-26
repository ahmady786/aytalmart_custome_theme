<?php
defined( 'ABSPATH' ) || exit;
require_once __DIR__ . '/commerce.php';
if ( is_admin() ) { require_once __DIR__ . '/setup.php'; }
add_action( 'after_setup_theme', static function () {
	add_theme_support( 'woocommerce' );
	foreach ( array( 'wc-product-gallery-zoom', 'wc-product-gallery-lightbox', 'wc-product-gallery-slider' ) as $feature ) { add_theme_support( $feature ); }
	add_editor_style( 'style.css' );
} );
add_action( 'wp_enqueue_scripts', static function () {
	wp_enqueue_style( 'aytal-store', get_stylesheet_uri(), array(), wp_get_theme()->get('Version') );
	wp_enqueue_script( 'aytal-store', get_theme_file_uri( 'store.js' ), array(), '1.0.0', array( 'strategy'=>'defer', 'in_footer'=>true ) );
} );
