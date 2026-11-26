# AYTAL MART · 2.0.7 release and cutover

This is a tested release candidate for the existing WordPress/WooCommerce store. Preparing these files does not change aytalmart.com, DNS, customer records or the Hostinger staging installation.

## Files

- Install **aytal-original-2.0.7.zip** in Appearance → Themes. This is the child theme; keep its existing `aytal-mart` parent installed. Do not reimport the starter catalog on a populated site.
- **production-webroot/robots.txt** is a separate server file. Only on the final aytalmart.com host, compare it with the existing root robots.txt and merge any merchant, plugin or hosting rules before installing it in the public web root. A physical file takes precedence over WordPress-generated robots rules. Never use the production file to open staging for crawling.
- SHA-256 of the installable child ZIP: `5f31e16f6bd82b4cd9faa92a636836ac72f66dd454437f87c13cb4f5a70ffd2a`. Do not install the outer release bundle as a WordPress theme.

## Migration inventory

Public source: https://aytalmart.com/sitemap.xml and its five product, page, collection, blog and discovery sitemaps. Audit on 26 November 2026. The sitemap supplied four product URLs; the former Shopify product pages returned HTTP 429 to the batch crawler. All four were separately tested on the new WordPress installation.

| Prefix | Handles retained exactly |
| --- | --- |
| / | Homepage |
| /products/ | aytal-quran-and-janamaz-stand, quran-janamaz-wall-stand, quran-janamaz-wall-stand-double-set, black-quran-janamaz-wall-stand-double-set |
| /collections/ | islamic-collection, custom-metal-creations, custom-metal-photo-frames, metal-key-holders |
| /pages/ | about-aytal-mart, contact-aytal-mart, shipping-policy, return-exchange-policy, privacy-policy, terms-of-service, disclaimer, faq, care-installation-guide, track-your-order |
| /blogs/ | news |
| Discovery | /agents.md, /sitemap.xml and the five old child-sitemap filenames |

Also checked: /collections and /collections/all. XML children lead to a current URL set, not Shopify ID ranges. The same legacy sitemap is registered with the WordPress index for hosts that redirect /sitemap.xml to /wp-sitemap.xml. Cart, checkout and account should not be indexed. Unknown products, collections and pages must return 404. Real published pages in WordPress are the source of truth: drafts are not silently replaced by old public copy.

## Results

- Local WordPress 7.1.5 / WooCommerce 11.3.1 / PHP 8.3. All 20 original sitemap HTML URLs returned direct HTTP 200, a matching self-canonical, one H1 and a non-empty server-rendered title and description. 41/41 URL, metadata, sitemap, robots, redirect, privacy and not-found assertions passed.
- Mobile Lighthouse: the original public Shopify homepage scored SEO 100. The new WordPress homepage and /products/aytal-quran-and-janamaz-stand each scored **SEO 100, accessibility 100, best practices 100** using the release's static robots file. The earlier dynamic robots response also returned valid text, but took 3.55 seconds and timed out in Lighthouse (SEO 92). Measured static response was 0.005 seconds.
- 390 px and 1440 px: the appropriate hero source loaded; the black bundle showed Rs 5,500, passed two black sets to checkout, and displayed the same total there without overflow or JavaScript errors. No real order was placed or email sent.
- Cold local homepage trace: LCP 4.50 seconds, including 4.29 seconds waiting for the local PHP runtime; CLS 0.00. These are **local lab results**, not field metrics or a Hostinger speed guarantee. The release did not change the approved product artwork.

## Go-live gates

1. Back up WordPress files and database, keep the previous child ZIP, and verify restore access. Install on the temporary domain first. Keep staging private/noindex. Confirm existing products, the ten published information pages (including the WP privacy-page assignment), permalink settings and HTTPS.
2. On Hostinger, verify a controlled COD order, receipt, email delivery, stock, WooCommerce admin order entry and tracking. Never cache cart, checkout, account, receipt URLs, WooCommerce sessions or AJAX. Use public-page caching for anonymous catalog/home pages. Do not cache across customers.
3. Reconcile Google Search Console landing-page and link exports plus any former redirects against the sitemap list. Sitemaps cannot enumerate orphaned pages or historic backlinks. Add specific 301 mappings for real retired URLs; do not redirect arbitrary missing URLs to the homepage.
4. At the approved cutover, use https://aytalmart.com as the WordPress/site URL. Check apex and www HTTPS redirects, remove production-only indexing blocks/Coming Soon, and purge caches. Keep staging blocked. If enabling Yoast/Rank Math/AIOSEO, recheck their canonical/title/description output on all virtual routes before launch; this audit used core WordPress SEO.
5. Open /robots.txt, /sitemap.xml, old product URLs and policy pages anonymously. Run the smoke test against the final domain, submit /sitemap.xml in Search Console, inspect representative URLs, and monitor indexing, 404s and real-user Core Web Vitals after cutover. A Lighthouse SEO score is not a ranking prediction.

## Repeat tests

Run `python scripts/audit-legacy-urls.py` for the public inventory and `python scripts/verify-wp-seo.py ORIGIN` on an indexable, seeded test host. Run `node scripts/qa-migration-ui.cjs http://127.0.0.1:PORT` with playwright-core and Chrome for the two viewport tests. The latter deliberately refuses non-local hosts and stops before order submission.
