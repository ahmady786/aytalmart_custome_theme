# AYTAL MART original storefront

This is a child of the existing `aytal-mart` WooCommerce theme, not a new visual design. Its frontend is bundled from the approved storefront in `app/(shop)`, `components/shop` and `lib`. The parent retains the native products and two-unit pricing. Install the packaged parent if it is not already present; do not run its setup/import again on a populated store.

- Installable child: `wordpress/aytal-original-2.0.3.zip`. Activate **AYTAL MART — Original Storefront** under Appearance → Themes. Do not change the main domain or the store visibility to test this.
- Manage the original eight stand SKUs, prices, images, gallery, descriptions and stock under Products. Keep their SKUs (e.g. `gold-set`) intact. Change information-page content under Pages. Images containing printed prices must also be updated when the sale price changes.
- Buy 1 / Buy 2 open the custom checkout. Final submissions use WooCommerce checkout, COD, shipping rates, stock and the native order number. No order information is sent to the former frontend.
- Cart → Proceed to checkout uses the same COD form. Cart checkout updates WooCommerce cart lines by their native key (including variations), keeps coupons, and uses server-calculated totals. Customer account, order-pay and order-received endpoints are not replaced by the checkout form.
- Rollback: reactivate the previously active theme. The child does not import, delete or replace products or orders. Its gallery, banner and layout assets are served by WordPress itself.

## Source and local checks

The integration code is in `wordpress/aytal-original` (PHP routes, storefront payload, checkout adapter) and `wordpress/original-src` (React host adapters). The build script applies adapters to the original source without replacing the originals. A manifest in `dist/source-list.json` identifies the bundled modules.

From the project root, with the existing approved Next production build available under `.next`:

    npm install --prefix tmp/aytal-parity-tools --no-save --ignore-scripts esbuild@0.25.12 playwright-core php-parser pngjs
    py scripts/encode-mobile-heroes.py
    node scripts/build-original-wp.cjs
    node scripts/qa-original-wp.cjs
    tar.exe -a -cf wordpress/aytal-original-2.0.3.zip -C wordpress aytal-original

2.0.3 uses a separate portrait picture source (AVIF with WebP fallback) on each of the three slides. The current mobile header and hero are rendered into the initial HTML. WordPress Customizer → **AYTAL MART: mobile hero images** accepts independent mobile photo replacements. Re-export the eight optimized source groups only when their masters change. Mobile prices and links remain HTML; prices printed in the approved desktop artwork require a new banner if offers change.

Contact and order tracking use the existing support and order endpoints. The default imported page copy is presented in a compact layout; saved merchant edits override the stock details. Product pages only show published, approved WooCommerce reviews. Keep Coming Soon and the main domain unchanged during preview.

The QA harness uses local Chrome and compares desktop and phone screenshots with the approved Next build. It tests the buy flow against a **local fixture**, not a real order submission. Screenshots are in `tmp/aytal-parity`. The WordPress theme archive contains the child theme only; it does not contain credentials, customer orders, or the rest of the project.
