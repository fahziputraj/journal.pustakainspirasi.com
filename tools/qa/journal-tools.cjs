/**
 * Journal dock, bottom sheet and rail sections (spec 2026-11-27-pim-journal-tools-design).
 * Usage: PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright node tools/qa/journal-tools.cjs
 * Uses the installed Chrome (PLAYWRIGHT_CHANNEL overrides). The fixture uses the real dock markup from
 * header.tpl and the working-tree pim-layout.css, custom.css, pim-v2.css and pim-ui.js.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const header = read('plugins/themes/pustakaMinang/templates/frontend/components/header.tpl');
const dock = /<nav class="pim-mobile-tools-bar[^"]*"[\s\S]*?<\/nav>/.exec(header)[0]
  .replace('{url page="search"}', '/mbj/search')
  .replace('{url page="about" op="submissions"}', '/mbj/about/submissions');

const menuLinks = ['All Journals', 'Home / Overview', 'Search', 'Current Issue', 'Archives', 'Author Guidelines', 'Editorial Team', 'About', 'Contact']
  .map((label, i) => `<a href="/mbj/p${i}"${i === 1 ? ' class="is-active"' : ''}><i class="fas fa-house"></i> ${label}</a>`).join('');
const menuPanel = `<aside class="pim-journal-tools" id="pimJournalMenuPanel" aria-label="Journal menu"><div class="pim-journal-tools-panel">
  <div class="pim-journal-tools-head"><span>Journal Menu</span><strong>Minang Bioscience Journal (MBJ)</strong></div>
  <div class="pim-journal-tools-group"><h2>Content</h2>${menuLinks}</div>
  <a class="pim-journal-submit" href="/mbj/about/submissions"><i class="fas fa-paper-plane"></i> Make a Submission</a></div></aside>`;
const block = (cls, title, body) => `<div class="pkp_block ${cls}">${title}<div class="content">${body}</div></div>`;
const linksPanel = `<div class="pkp_structure_sidebar left pim-journal-sidebar" id="pimJournalLinksPanel" role="complementary" aria-label="Sidebar">
  ${block('block_information', '<h2 class="title">Information</h2>', '<ul><li><a href="/r">For Readers</a></li><li><a href="/a">For Authors</a></li></ul>')}
  ${block('block_custom', '<h2 class="title pkp_screen_reader">Journal Information</h2>', '<p><strong>:: PEOPLE ::</strong></p><p><a href="/team">Editorial Team</a></p><p><a href="/rev">Reviewers</a></p>')}
  ${block('block_custom', '', '<h3>Indexed By</h3><p><a href="https://scholar.google.com">Google Scholar</a></p>')}
</div>`;

function page(withSidebar) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/pim-layout.css">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/custom.css">
  <link rel="stylesheet" href="https://fixture.test/plugins/themes/pustakaMinang/styles/pim-v2.css"></head>
  <body class="pkp_page_index pkp_op_index pim_public_journal"><div class="pkp_structure_page">
  <div class="pim-mobile-tools-backdrop" data-pim-tools-close aria-hidden="true"></div>${dock}
  <div class="pkp_structure_content pkp_has_sidebar pim-layout-journal-public">${menuPanel}
  <div class="pkp_structure_main" id="pim-main-content" role="main"><h1>MBJ</h1>${'<p>Journal text.</p>'.repeat(40)}</div>
  ${withSidebar ? linksPanel : ''}</div></div>
  <script src="https://fixture.test/pim-ui.js"></script></body></html>`;
}

async function load(p, withSidebar = true, width = 390) {
  await p.setViewportSize({ width, height: 844 });
  await p.unrouteAll();
  await p.route('https://fixture.test/**', (route) => {
    const rel = new URL(route.request().url()).pathname.slice(1);
    if (rel === 'mbj/index') return route.fulfill({ status: 200, contentType: 'text/html', body: page(withSidebar) });
    const file = path.join(root, rel);
    if (fs.existsSync(file)) return route.fulfill({ status: 200, contentType: rel.endsWith('.css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(file) });
    return route.fulfill({ status: 204, body: '' });
  });
  await p.route(/^https:\/\/(?!fixture\.test)/, (route) => route.fulfill({ status: 204, body: '' }));
  await p.goto('https://fixture.test/mbj/index');
  await p.waitForTimeout(150);
}
const state = (p) => p.evaluate(() => ({
  open: document.body.classList.contains('pim-tools-open'),
  tab: document.body.classList.contains('pim-tools-tab-links') ? 'links' : 'menu',
  menuExpanded: document.querySelector('[data-pim-tools-tab="menu"]').getAttribute('aria-expanded'),
  linksExpanded: document.querySelector('[data-pim-tools-tab="links"]').getAttribute('aria-expanded'),
  active: document.activeElement && (document.activeElement.dataset.pimToolsTab || document.activeElement.className || document.activeElement.tagName),
  bodyOverflow: getComputedStyle(document.body).overflowY,
}));
const visibleIn = (p, selector) => p.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const st = getComputedStyle(el);
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && st.visibility !== 'hidden' && el.getAttribute('aria-hidden') !== 'true';
}, selector);

const results = [];
async function check(name, fn) {
  try { await fn(); results.push('ok   ' + name); } catch (error) { results.push('FAIL ' + name + ': ' + error.message.split('\n')[0]); }
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  const p = await browser.newPage();
  try {
    await check('openMenu', async () => {
      await load(p);
      await p.click('[data-pim-tools-tab="menu"]');
      const s = await state(p);
      assert.equal(s.open, true); assert.equal(s.tab, 'menu'); assert.equal(s.menuExpanded, 'true');
      assert.ok(await visibleIn(p, '#pimJournalMenuPanel'), 'menu panel visible');
      assert.equal(await p.textContent('#pimJournalMenuPanel .pim-sheet-head h2'), 'Journal menu');
    });
    await check('toggleClose', async () => {
      await p.click('[data-pim-tools-tab="menu"]');
      const s = await state(p);
      assert.equal(s.open, false); assert.equal(s.menuExpanded, 'false');
    });
    await check('switch', async () => {
      await p.click('[data-pim-tools-tab="menu"]');
      await p.click('[data-pim-tools-tab="links"]');
      const s = await state(p);
      assert.equal(s.open, true); assert.equal(s.tab, 'links');
      assert.equal(s.menuExpanded, 'false'); assert.equal(s.linksExpanded, 'true');
      assert.ok(await visibleIn(p, '#pimJournalLinksPanel'), 'links panel visible');
      assert.equal(await p.textContent('#pimJournalLinksPanel .pim-sheet-head h2'), 'Journal information');
    });
    await check('closeButton', async () => {
      await p.click('#pimJournalLinksPanel .pim-sheet-close');
      const s = await state(p);
      assert.equal(s.open, false); assert.equal(s.active, 'links');
    });
    await check('focusReturn', async () => {
      await load(p);
      await p.focus('[data-pim-tools-tab="menu"]');
      await p.keyboard.press('Enter');
      assert.equal((await state(p)).open, true);
      for (let i = 0; i < 30; i++) {
        await p.keyboard.press('Tab');
        const inside = await p.evaluate(() => !!document.activeElement.closest('#pimJournalMenuPanel, .pim-mobile-tools-bar'));
        assert.ok(inside, 'focus left the sheet at Tab #' + (i + 1));
      }
      await p.keyboard.press('Escape');
      const s = await state(p);
      assert.equal(s.open, false); assert.equal(s.active, 'menu');
    });
    await check('noSidebar', async () => {
      await load(p, false);
      assert.equal(await visibleIn(p, '[data-pim-tools-tab="links"]'), false, 'Information item hidden');
      const fill = await p.evaluate(() => {
        const nav = document.querySelector('.pim-mobile-tools-bar').getBoundingClientRect();
        const items = [...document.querySelectorAll('.pim-dock-item')].filter((i) => i.getBoundingClientRect().width > 0);
        return { count: items.length, gap: Math.round(nav.right - items[items.length - 1].getBoundingClientRect().right), minSide: Math.min(...items.map((i) => Math.min(i.getBoundingClientRect().width, i.getBoundingClientRect().height))) };
      });
      assert.equal(fill.count, 3); assert.ok(fill.gap <= 16, 'dock filled, right gap ' + fill.gap); assert.ok(fill.minSide >= 44, 'targets >= 44px');
    });
    await check('resizeClose', async () => {
      await load(p);
      await p.click('[data-pim-tools-tab="menu"]');
      await p.setViewportSize({ width: 1280, height: 900 });
      await p.waitForTimeout(150);
      const s = await state(p);
      assert.equal(s.open, false); assert.notEqual(s.bodyOverflow, 'hidden');
      assert.equal(await visibleIn(p, '.pim-mobile-tools-bar'), false, 'dock hidden on desktop');
    });
    await check('sections', async () => {
      await load(p, true, 1280);
      const s = await p.evaluate(() => {
        const panel = document.getElementById('pimJournalLinksPanel');
        return {
          sections: [...panel.querySelectorAll('details.pim-rail-section')].map((d) => ({ open: d.open, title: d.querySelector('summary').textContent.trim() })),
          links: [...panel.querySelectorAll('a')].map((a) => a.getAttribute('href')),
          nested: panel.querySelectorAll('details details').length,
          again: window.PIM.buildRailSections(panel),
        };
      });
      assert.deepEqual(s.sections.map((x) => x.open), [true, true, false]);
      assert.deepEqual(s.links, ['/r', '/a', '/team', '/rev', 'https://scholar.google.com'], 'links kept in order');
      assert.equal(s.nested, 0); assert.equal(s.again, 3, 'idempotent');
      assert.deepEqual(s.sections.map((x) => x.title), ['Information', 'Journal Information', 'Indexed By']);
    });
    await check('decoration', async () => {
      const text = await p.evaluate(() => [...document.querySelectorAll('#pimJournalLinksPanel strong')].map((n) => n.textContent));
      assert.deepEqual(text, ['PEOPLE'], 'legacy :: decoration stripped from display text');
    });
    await check('customHeading', async () => {
      const count = await p.evaluate(() => {
        const block = document.querySelectorAll('#pimJournalLinksPanel .pkp_block')[2];
        return { headings: block.querySelectorAll('h3').length, inSummary: !!block.querySelector('summary h3') };
      });
      assert.equal(count.headings, 1); assert.equal(count.inSummary, true);
    });
    await check('submitFits', async () => {
      await load(p, true, 1280);
      const r = await p.evaluate(() => {
        const panel = document.querySelector('.pim-journal-tools-panel').getBoundingClientRect();
        const btn = document.querySelector('.pim-journal-submit').getBoundingClientRect();
        return { over: Math.round(btn.right - panel.right) };
      });
      assert.ok(r.over <= 0, 'Make a Submission overflows the rail by ' + r.over + 'px');
    });
    await check('activeState', async () => {
      for (const width of [1280, 390]) {
        await load(p, true, width);
        if (width === 390) await p.click('[data-pim-tools-tab="menu"]');
        const st = await p.evaluate(() => {
          const a = document.querySelector('.pim-journal-tools-group a.is-active');
          const cs = getComputedStyle(a);
          return { current: a.getAttribute('aria-current'), shadow: cs.boxShadow, border: cs.borderLeftWidth, bg: cs.backgroundColor };
        });
        assert.equal(st.current, 'page'); assert.equal(st.shadow, 'none', 'no inset bar at ' + width);
        assert.equal(st.border, '0px'); assert.equal(st.bg, 'rgb(251, 239, 239)', 'tonal fill at ' + width);
      }
      await p.waitForTimeout(300); // let the 160ms indicator transition settle
      const dockItem = await p.evaluate(() => {
        const i = document.querySelector('[data-pim-tools-tab="menu"] i');
        const b = document.querySelector('[data-pim-tools-tab="menu"]');
        return { pill: getComputedStyle(i).backgroundColor, top: getComputedStyle(b).borderTopWidth };
      });
      assert.equal(dockItem.pill, 'rgb(251, 239, 239)'); assert.equal(dockItem.top, '0px');
    });
    if (process.env.SHOTS_DIR) {
      // Optional visual evidence: SHOTS_DIR=<dir> saves the key states as PNGs.
      fs.mkdirSync(process.env.SHOTS_DIR, { recursive: true });
      const shot = (name) => p.screenshot({ path: path.join(process.env.SHOTS_DIR, name + ".png") });
      await load(p, true, 390); await shot("390-closed");
      await p.click("[data-pim-tools-tab=\"menu\"]"); await p.waitForTimeout(300); await shot("390-menu");
      await p.click("[data-pim-tools-tab=\"links\"]"); await p.waitForTimeout(300); await shot("390-information");
      await load(p, true, 1280); await p.screenshot({ path: path.join(process.env.SHOTS_DIR, "1280-rails.png"), fullPage: true });
    }
  } finally {
    await browser.close();
  }
  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
  console.log('PASS: Journal dock and sheet open, switch, close, trap focus and reset on resize.');
})().catch((error) => { console.error(error); process.exit(1); });
