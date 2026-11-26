<?php
defined('ABSPATH') || exit;
add_action('admin_init',static function(){
 register_setting('general','aytal_floating_whatsapp',array('type'=>'boolean','default'=>false,'sanitize_callback'=>'rest_sanitize_boolean'));
 add_settings_field('aytal_floating_whatsapp','AYTAL MART · WhatsApp',static function(){
  echo '<label><input type="hidden" name="aytal_floating_whatsapp" value="0"><input type="checkbox" name="aytal_floating_whatsapp" value="1" '.checked((bool)get_option('aytal_floating_whatsapp',false),true,false).'> Show the floating WhatsApp chat button on shop pages</label>';
 },'general');
});
function aytal_floating_chat(){return (bool)get_option('aytal_floating_whatsapp',false)&&!is_checkout()&&!is_account_page();}
add_action('wp_footer',static function(){
 if(!function_exists('is_checkout')||!aytal_floating_chat())return;
 echo '<a class="aytal-chat" aria-label="Chat with AYTAL MART on WhatsApp" href="https://wa.me/923435558177" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4.1 16.7 3 21l4.5-1.1a9 9 0 1 0-3.4-3.2Z"/><path d="m8.4 7.1 1.2-.2 1 2.2-.9 1.1a8.2 8.2 0 0 0 3.9 3.9l1.1-1 2.2 1-.2 1.3c-.2 1.2-1.4 1.6-2.4 1.3-3.6-.9-6.5-3.9-7.3-7.3-.2-.8.2-1.9 1.4-2.3Z"/></svg></a>';
});
add_action('wp_enqueue_scripts',static function(){if(function_exists('is_checkout')&&aytal_floating_chat())wp_enqueue_style('aytal-floating-chat',get_stylesheet_directory_uri().'/floating-chat.css',array(),'2.0.6');});
