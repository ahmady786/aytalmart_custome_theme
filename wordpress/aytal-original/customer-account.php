<?php
defined('ABSPATH') || exit;
// One-time shop setup. Subsequent merchant edits of these settings are respected.
function ao_setup_customer_accounts(){
	if(!function_exists('WC')||!current_user_can('manage_woocommerce')||get_option('ao_account_setup_v1'))return;
	if(wc_get_page_id('myaccount')<=0){
		require_once WC_ABSPATH.'includes/admin/wc-admin-functions.php';
		wc_create_page('my-account','woocommerce_myaccount_page_id','My Account','[woocommerce_my_account]');
	}
	update_option('woocommerce_enable_myaccount_registration','yes');
	update_option('woocommerce_enable_guest_checkout','yes');
	update_option('ao_account_setup_v1',1,false);
}
add_action('admin_init','ao_setup_customer_accounts');
add_action('after_switch_theme','ao_setup_customer_accounts');
add_filter('woocommerce_checkout_posted_data',static function($data){
	if(ao_direct()&&is_user_logged_in()&&empty($data['billing_email']))$data['billing_email']=wp_get_current_user()->user_email;
	return $data;
});
