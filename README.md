# AYTAL MART custom theme

AYTAL MART WordPress/WooCommerce theme, release **2.0.8**. [Public design preview](https://ahmady786.github.io/aytalmart_custome_theme/) is independently deployed and may show an earlier revision. GitHub Pages does not accept orders, payments, sign-ins or shipping addresses.

## Restore to WordPress

1. Use [the release parent theme ZIP](wordpress/aytal-mart-parent-2.0.8.zip) and [the 2.0.8 child theme ZIP](wordpress/aytal-original-2.0.8.zip). See [2.0.8 launch notes](wordpress/RELEASE-2.0.8.md). Do not upload the outer release bundle or GitHub's "Download ZIP" as a theme.
2. In WordPress, install and activate WooCommerce if it is not already active. Under **Appearance → Themes → Add Theme → Upload Theme**, install the parent first, then install and activate **AYTAL MART — Original Storefront** (the child).
3. On an existing shop, keep its catalog, settings, and orders; do not run the parent starter import again. [Theme notes](wordpress/ORIGINAL-STOREFRONT.md) cover content editing and checkout.

This is a **theme** backup, not a database or full-site backup. It includes the bundled starter catalog and product artwork, not real orders, enquiries, credentials, or the host's media library.

## Preview or edit

With Node.js installed, run `node scripts/preview-aytal-theme.cjs` and open [the local preview](http://127.0.0.1:3210). This serves the already-built theme on your laptop without WordPress and does not take orders.

The editable interface is under `app/(shop)` and `components/shop`; the WordPress adapters are under `wordpress/original-src` and `wordpress/aytal-original`. Approved image masters are under `public/shop` and `design/hero/three-final`. To rebuild the child bundle run:

    npm ci
    npm install --prefix tmp/aytal-parity-tools --no-save --ignore-scripts esbuild@0.25.12 playwright-core php-parser pngjs
    npm run build:theme

To generate the GitHub Pages preview, run `node scripts/build-original-wp.cjs --github-pages` in a checkout with the build dependencies installed. Publish only the contents of `tmp/pages-export` to the `gh-pages` branch. Pushing the theme or preview to GitHub does not update Hostinger.
