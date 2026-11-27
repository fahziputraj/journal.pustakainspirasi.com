/**
 * Save live PIM pages with the theme assets swapped for the working-tree files, so CSS/JS
 * changes can be audited against real content before deployment.
 * Usage: node tools/qa/replay-live.cjs <outDir> <url> [url...]
 * Prints one local HTML path per URL. Markup is the live (deployed) template output.
 */
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '../..');
const [outDir, ...urls] = process.argv.slice(2);
if (!outDir || !urls.length) {
  console.error('Usage: node tools/qa/replay-live.cjs <outDir> <url> [url...]');
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const stamp = Date.now();
const local = (rel) => pathToFileURL(path.join(root, rel)).href + '?local=' + stamp;
const swaps = [
  [/https?:\/\/[^"']*\/plugins\/themes\/pustakaMinang\/styles\/pim-layout\.css[^"']*/g, local('plugins/themes/pustakaMinang/styles/pim-layout.css')],
  [/https?:\/\/[^"']*\/plugins\/themes\/pustakaMinang\/styles\/custom\.css[^"']*/g, local('plugins/themes/pustakaMinang/styles/custom.css')],
  [/https?:\/\/[^"']*\/plugins\/themes\/pustakaMinang\/styles\/pim-v2\.css[^"']*/g, local('plugins/themes/pustakaMinang/styles/pim-v2.css')],
  [/https?:\/\/[^"']*\/plugins\/themes\/pustakaMinang\/styles\/pim-refine\.css[^"']*/g, local('plugins/themes/pustakaMinang/styles/pim-refine.css')],
  [/https?:\/\/[^"']*\/pim-ui\.js[^"']*/g, local('pim-ui.js')],
  [/https?:\/\/[^"']*\/plugins\/themes\/pustakaMinang\/images\/([\w.-]+)[^"']*/g, (m, file) => local('plugins/themes/pustakaMinang/images/' + file)],
];

(async () => {
  for (const url of urls) {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (PIM replay)' } });
    if (!response.ok) throw new Error(url + ' returned HTTP ' + response.status);
    let html = await response.text();
    let replaced = 0;
    for (const [pattern, replacement] of swaps) {
      html = html.replace(pattern, (...args) => { replaced++; return typeof replacement === 'function' ? replacement(...args) : replacement; });
    }
    if (!replaced) throw new Error(url + ': no theme assets found to swap');
    if (!html.includes('pim-v2.css')) {
      // The v2 layer is new in this release: inject it right after the swapped layout stylesheet.
      html = html.replace(/(<link[^>]+pim-layout.css[^>]*>)/i, (m) => m + '<link rel="stylesheet" href="' + local('plugins/themes/pustakaMinang/styles/pim-v2.css') + '" type="text/css">');
    }
    if (!html.includes('pim-refine.css')) {
      // The refinement layer is new in this release: inject it right after the v2 stylesheet.
      html = html.replace(/(<link[^>]+pim-v2.css[^>]*>)/i, (m) => m + '<link rel="stylesheet" href="' + local('plugins/themes/pustakaMinang/styles/pim-refine.css') + '" type="text/css">');
    }
    html = html.replace(/<head([^>]*)>/i, (m) => m + '<base href="' + url + '">');
    const slug = new URL(url).pathname.replace(/^\/(index\.php\/)?/, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'portal';
    const file = path.join(outDir, slug + '.html');
    fs.writeFileSync(file, html);
    console.log(file);
  }
})().catch((error) => { console.error(error.message); process.exit(1); });
