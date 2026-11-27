# AYTAL MART original storefront

This is a child of the existing `aytal-mart` WooCommerce theme, not a new visual design. Its frontend is bundled from the approved storefront in `app/(shop)`, `components/shop` and `lib`. The parent retains the native products and two-unit pricing. Install the packaged parent if it is not already present; do not run its setup/import again on a populated store.

- Installable child: [AYTAL MART 2.0.12](aytal-original-2.0.12.zip). Activate **AYTAL MART — Original Storefront** under Appearance → Themes. The parent is unchanged from the [2.0.8 release](RELEASE-2.0.8.md). See [SEO cutover instructions](SEO-RELEASE.md). Do not change the main domain or the store visibility to test this.
- Manage the original eight stand SKUs, prices, images, gallery, descriptions and stock under Products. Keep their SKUs (e.g. `gold-set`) intact. Change information-page content under Pages. Standard set studio images exclude the old price strip. If replacing hero banners, use your own up-to-date prices.
- Buy 1 / Buy 2 open the custom checkout. Final submissions use WooCommerce checkout, COD, shipping rates, stock and the native order number. No order information is sent to the former frontend.
- Cart → Proceed to checkout uses the same COD form. Cart checkout updates WooCommerce cart lines by their native key (including variations), keeps coupons, and uses server-calculated totals. Customer account, order-pay and order-received endpoints are not replaced by the checkout form.
- Rollback: reactivate the previously active theme. The child does not import, delete or replace products or orders. Its gallery, banner and layout assets are served by WordPress itself.
- The header cart reads WooCommerce's current session, including purchases added with the secondary Add to Cart button. Direct Buy checks out only the selected items. Mobile keeps the cart visible and places My Account in the menu. The account page uses native WooCommerce login, password reset, registration, orders and addresses. A one-time administrator setup enables optional registration and guest checkout; subsequent edits in WooCommerce → Settings → Accounts & Privacy are respected.

## Source and local checks

2.0.6 puts the eight stand products immediately below the hero, followed by circular collections, the stand guide, and Shop Together. The two-set bundle is Rs 5,500 (previous bundle Rs 6,000); single Quran stand pairs cost Rs 4,399. Finishes can be mixed within a type. Odd leftover units retain the product's current sale price. The one-time catalog update targets only the eight original stand SKUs. In WordPress → Settings → General, the **AYTAL MART · WhatsApp** checkbox controls the floating contact link (off by default).

The integration code is in `wordpress/aytal-original` (PHP routes, storefront payload, checkout adapter) and `wordpress/original-src` (React host adapters). The build script applies adapters to the original source without replacing the originals. A manifest in `dist/source-list.json` identifies the bundled modules.

From the project root, with the existing approved Next production build available under `.next`:

    npm install --prefix tmp/aytal-parity-tools --no-save --ignore-scripts esbuild@0.25.12 playwright-core php-parser pngjs
    py scripts/encode-mobile-heroes.py
    node scripts/build-original-wp.cjs
    node scripts/qa-original-wp.cjs
    node scripts/qa-shop-cart.cjs
    py -3 -m zipfile -c wordpress/aytal-original-2.0.8.zip wordpress/aytal-original

2.0.3 uses a separate portrait picture source (AVIF with WebP fallback) on each of the three slides. The current mobile header and hero are rendered into the initial HTML. WordPress Customizer → **AYTAL MART: mobile hero images** accepts independent mobile photo replacements. Re-export the eight optimized source groups only when their masters change. Mobile prices and links remain HTML; prices printed in the approved desktop artwork require a new banner if offers change.

Contact and order tracking use the existing support and order endpoints. The default imported page copy is presented in a compact layout; saved merchant edits override the stock details. Product pages only show published, approved WooCommerce reviews. Keep Coming Soon and the main domain unchanged during preview.

The QA harness uses local Chrome and compares desktop and phone screenshots with the approved Next build. It tests the buy flow against a **local fixture**, not a real order submission. Screenshots are in `tmp/aytal-parity`. The WordPress theme archive contains the child theme only; it does not contain credentials, customer orders, or the rest of the project.
