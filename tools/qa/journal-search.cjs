/**
 * Search page enhancement (plan 2026-11-27-pim-search-ui, Task 1).
 * Usage: PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright node tools/qa/journal-search.cjs
 * Fixture: the live OJS search markup (tools/qa/fixtures/search-page.html) with local theme CSS/JS.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');
const form = fs.readFileSync(path.join(__dirname, 'fixtures/search-page.html'), 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page({ query = '', fromYear = '' } = {}) {
  let body = form.replace('{{QUERY}}', esc(query));
  if (fromYear) body = body.replace(`<option value="${fromYear}">`, `<option value="${fromYear}" selected>`);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/pim-layout.css">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/custom.css">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/pim-v2.css"></head>
  <body class="pkp_page_search pkp_op_search pim_public_journal"><div class="pkp_structure_page">
  <div class="pkp_structure_content pkp_has_sidebar pim-layout-journal-public">
  <div class="pkp_structure_main" id="pim-main-content" role="main">${body}</div></div></div>
  <script src="https://fixture.test/pim-ui.js"></script></body></html>`;
}

async function load(p, opts = {}, width = 1280) {
  await p.setViewportSize({ width, height: 900 });
  await p.unrouteAll();
  await p.route('https://fixture.test/**', (route) => {
    const rel = new URL(route.request().url()).pathname.slice(1);
    if (rel === 'mbj/search') return route.fulfill({ status: 200, contentType: 'text/html', body: page(opts) });
    const file = path.join(root, rel);
    if (fs.existsSync(file)) return route.fulfill({ status: 200, contentType: rel.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(file) });
    return route.fulfill({ status: 204, body: '' });
  });
  await p.route(/^https:\/\/(?!fixture\.test)/, (route) => route.fulfill({ status: 204, body: '' }));
  await p.goto('https://fixture.test/mbj/search');
  await p.waitForTimeout(150);
}

const results = [];
async function check(name, fn) {
  try { await fn(); results.push('ok   ' + name); } catch (error) { results.push('FAIL ' + name + ': ' + error.message.split('\n')[0]); }
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const p = await browser.newPage();
  try {
    await check('layout', async () => {
      await load(p, { query: 'betel' });
      const r = await p.evaluate(() => { const i = document.querySelector('.search_input input.query').getBoundingClientRect(); const b = document.querySelector('.page_search form > .submit button').getBoundingClientRect(); return { input: Math.round(i.top), button: Math.round(b.top), inputH: Math.round(i.height), buttonH: Math.round(b.height) }; });
      assert.ok(Math.abs(r.input - r.button) <= 1 && Math.abs(r.inputH - r.buttonH) <= 1, 'keyword field and Search button aligned: ' + JSON.stringify(r));
    });
    await check('labels', async () => {
      const labels = await p.evaluate(() => [...document.querySelectorAll('.date_range label')].map((l) => ({ text: l.textContent.trim(), w: l.getBoundingClientRect().width, clip: getComputedStyle(l).clipPath })));
      assert.deepEqual(labels.map((l) => l.text), ['Year', 'Month', 'Day', 'Year', 'Month', 'Day']);
      assert.ok(labels.every((l) => l.w > 8 && (l.clip === 'none' || l.clip === '')), 'date labels visible');
    });
    await check('filtersClosed', async () => {
      const open = await p.evaluate(() => { const d = document.querySelector('details.pim-search-filters'); return d ? d.open : 'missing'; });
      assert.equal(open, false);
    });
    await check('filtersOpen', async () => {
      await load(p, { query: 'betel', fromYear: '2026' });
      assert.equal(await p.evaluate(() => document.querySelector('details.pim-search-filters')?.open), true);
    });
    await check('emptyBefore', async () => {
      await load(p, { query: '' });
      assert.equal((await p.textContent('.page_search .cmp_notification')).trim(), 'Search titles, abstracts and authors in this journal.');
    });
    await check('emptyAfter', async () => {
      await load(p, { query: 'betel' });
      const t = (await p.textContent('.page_search .cmp_notification')).replace(/\s+/g, ' ').trim();
      assert.equal(t, 'No articles match "betel". Try fewer or different words.');
    });
    await check('escapedQuery', async () => {
      await load(p, { query: '<b>x</b>' });
      const r = await p.evaluate(() => ({ text: document.querySelector('.page_search .cmp_notification').textContent, bold: document.querySelectorAll('.page_search .cmp_notification b').length }));
      assert.ok(r.text.includes('<b>x</b>'), 'query shown literally'); assert.equal(r.bold, 0);
    });
    if (process.env.SHOTS_DIR) {
      fs.mkdirSync(process.env.SHOTS_DIR, { recursive: true });
      await load(p, { query: 'betel' }, 1280); await p.screenshot({ path: path.join(process.env.SHOTS_DIR, 'search-1280.png'), fullPage: true });
      await p.click('details.pim-search-filters > summary'); await p.screenshot({ path: path.join(process.env.SHOTS_DIR, 'search-1280-filters.png'), fullPage: true });
      await load(p, { query: '' }, 390); await p.screenshot({ path: path.join(process.env.SHOTS_DIR, 'search-390.png'), fullPage: true });
    }
  } finally {
    await browser.close();
  }
  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
  console.log('PASS: Search page has an inline search bar, labelled collapsible filters and honest empty states.');
})().catch((error) => { console.error(error); process.exit(1); });
