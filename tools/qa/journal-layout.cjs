/**
 * Browser regression checks against a saved public OJS HTML response.
 * Usage: node tools/qa/journal-layout.cjs snapshot.html evidence-directory
 * Requires Playwright (or PLAYWRIGHT_MODULE pointing to an installed module).
 * Replays public markup with local theme assets; never connects to an OJS DB.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');
const [snapshot, output] = process.argv.slice(2);
if (!snapshot || !output) throw new Error('Provide the public HTML snapshot and evidence directory.');
fs.mkdirSync(output, { recursive: true });
const css = fs.readFileSync(path.join(root, 'plugins/themes/pustakaMinang/styles/pim-layout.css'), 'utf8')
  .replace(/@import\s+url\([^)]*\)\s*;/g, '');
const customCss = fs.readFileSync(path.join(root, 'plugins/themes/pustakaMinang/styles/custom.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'pim-ui.js'), 'utf8');
const fixtureDir = path.dirname(path.resolve(snapshot));
const basePath = path.join(fixtureDir, 'base-stylesheet.css');
const baseCss = fs.existsSync(basePath) ? fs.readFileSync(basePath, 'utf8') : '';
const iconsPath = path.join(fixtureDir, 'icons.css');
const iconsCss = fs.existsSync(iconsPath) ? fs.readFileSync(iconsPath, 'utf8').replace(/url\((?:["'])?\.\.\/webfonts\/([^)'"\s]+)(?:["'])?\)/g, (match, name) => {
  const fontPath = path.join(fixtureDir, name);
  return fs.existsSync(fontPath) ? `url(data:font/woff2;base64,${fs.readFileSync(fontPath).toString('base64')})` : match;
}) : '';
const html = fs.readFileSync(snapshot, 'utf8')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<link\b[^>]*>/gi, '')
  .replace(/https:\/\/journal\.pustakainspirasi\.com\/public\/journals\/1\/(logo|cover)\.png/g, (url, name) => {
    const imagePath = path.join(fixtureDir, `${name}.png`);
    return fs.existsSync(imagePath) ? `data:image/png;base64,${fs.readFileSync(imagePath).toString('base64')}` : url;
  })
  .replace('</head>', `<style>${baseCss}\n${iconsCss}\n${css}\n${customCss}</style></head>`);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  try {
    const page = await browser.newPage();
    // Tests are self-contained: remote images/fonts/widgets cannot stall them.
    await page.route('**/*', route => route.abort());
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const width of [1440, 1280, 1200, 1024, 993, 992, 900, 768, 430, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.addScriptTag({ content: script });
      await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
      const result = { width, checks: [], failures: [] };
      async function check(name, action) {
        try { await action(); result.checks.push(name); }
        catch (error) { result.failures.push(`${name}: ${error.message}`); }
      }
      const panels = await page.evaluate(() => Object.fromEntries(
        ['pimJournalMenuPanel', 'pim-main-content', 'pimJournalLinksPanel'].map(id => {
          const e = document.getElementById(id);
          return [id, e ? e.getBoundingClientRect().toJSON() : null];
        })
      ));
      if (width > 992) {
        await check('Journal Menu appears to the left of the content', () => {
          assert(panels.pimJournalMenuPanel.right <= panels['pim-main-content'].left + 1);
          assert(panels['pim-main-content'].width >= 480, 'Long-form content remains readable');
        });
        if (width >= 1200) {
          await check('Right sidebar starts at the top alongside the menu', () => {
            assert(Math.abs(panels.pimJournalLinksPanel.top - panels['pim-main-content'].top) < 2);
            assert(panels.pimJournalLinksPanel.left >= panels['pim-main-content'].right - 1);
          });
        }
      } else {
        const toggle = page.locator('#pimMobileToolsToggle');
        await check('Tablet/phone navigation opens and closes with keyboard support', async () => {
          assert(await toggle.isVisible(), 'Journal Tools must be available');
          await toggle.click();
          assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
          assert(await page.locator('#pimJournalMenuPanel').isVisible());
          await page.getByRole('tab', { name: 'Links', exact: true }).click();
          assert(await page.locator('#pimJournalLinksPanel').isVisible());
          assert.equal(await page.locator('#pimJournalMenuPanel').getAttribute('aria-hidden'), 'true');
          await page.keyboard.press('Escape');
          assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
          assert.equal(await toggle.evaluate(e => document.activeElement === e), true, 'Focus returns to the opener');
          assert.equal(await page.locator('#pimJournalLinksPanel').isVisible(), false);
        });
        await check('Tab navigation stays within the open drawer', async () => {
          await page.getByRole('tab', { name: 'Menu', exact: true }).click();
          await page.locator('#pimJournalMenuPanel a').last().focus();
          await page.keyboard.press('Tab');
          assert(await page.evaluate(() => !!document.activeElement.closest('#pimJournalMenuPanel, .pim-mobile-tools-bar')),
            'The final menu link must not send focus into the background page');
          const menuTab = page.getByRole('tab', { name: 'Menu', exact: true });
          await menuTab.focus();
          await page.keyboard.press('ArrowRight');
          assert.equal(await page.getByRole('tab', { name: 'Links', exact: true }).getAttribute('aria-selected'), 'true');
          assert(await page.locator('#pimJournalLinksPanel').isVisible());
          if (width === 390) await page.screenshot({ path: path.join(output, 'journal-390-links.png') });
          await page.keyboard.press('Home');
          assert.equal(await menuTab.getAttribute('aria-selected'), 'true');
          assert(await page.locator('#pimJournalMenuPanel').isVisible());
          if (width === 390) await page.screenshot({ path: path.join(output, 'journal-390-menu.png') });
          await page.keyboard.press('Escape');
        });
        await check('Arrow keys keep focus on tabs when opening a closed drawer', async () => {
          try {
            const menuTab = page.getByRole('tab', { name: 'Menu', exact: true });
            await menuTab.focus();
            await page.keyboard.press('ArrowRight');
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            assert(await page.getByRole('tab', { name: 'Links', exact: true }).evaluate(e => document.activeElement === e));
          } finally { await page.keyboard.press('Escape'); }
        });
        await check('Tab skips the inactive tab in the panel switcher', async () => {
          try {
            const linksTab = page.getByRole('tab', { name: 'Links', exact: true });
            await linksTab.click();
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
            await page.locator('#pimJournalLinksPanel a').last().focus();
            await page.keyboard.press('Tab');
            assert(await toggle.evaluate(e => document.activeElement === e));
            await page.keyboard.press('Tab');
            assert(await linksTab.evaluate(e => document.activeElement === e));
          } finally { await page.keyboard.press('Escape'); }
        });
      }
      await check('Page has no horizontal overflow', async () => {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        assert(overflow <= 1, `Overflow: ${overflow}px`);
      });
      results.push(result);
      console.log(`${result.failures.length ? 'FAIL' : 'PASS'} ${width}px: ${result.checks.length} checks; ${result.failures.join('; ')}`);
      if ([1440, 1024, 390].includes(width)) {
        await page.screenshot({ path: path.join(output, `journal-${width}.png`) });
      }
    }
    const focusRegressions = [];
    async function focusCheck(name, action) {
      try { await action(); console.log(`PASS ${name}`); }
      catch (error) { focusRegressions.push(`${name}: ${error.message}`); console.log(`FAIL ${name}: ${error.message}`); }
    }
    await focusCheck('Tab skips disabled and hidden widget controls', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.locator('#pimJournalLinksPanel').evaluate(e => {
        const widget = document.createElement('div');
        widget.innerHTML = '<a id="qa-widget-first" href="/first">First</a>'
          + '<button disabled tabindex="0">Unavailable</button>'
          + '<fieldset disabled><input tabindex="0" aria-label="Unavailable input"></fieldset>'
          + '<button style="visibility:hidden" tabindex="0">Hidden</button>'
          + '<a id="qa-widget-last" href="/last">Last</a>';
        e.prepend(widget);
      });
      await page.addScriptTag({ content: script });
      await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
      await page.getByRole('tab', { name: 'Links', exact: true }).click();
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
      await page.locator('#qa-widget-first').focus();
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'qa-widget-last');
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'qa-widget-first');
      await page.keyboard.press('Escape');
    });
    await focusCheck('Focused desktop navigation transfers to tablet tools on resize', async () => {
      await page.setViewportSize({ width: 1280, height: 844 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.addScriptTag({ content: script });
      await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
      await page.locator('#pimJournalMenuPanel a').first().focus();
      await page.setViewportSize({ width: 900, height: 844 });
      await page.waitForFunction(() => document.getElementById('pimJournalMenuPanel').hasAttribute('inert'));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'pimMobileToolsToggle');
    });
    await focusCheck('Pointer blur outside the rail does not transfer stale focus on resize', async () => {
      await page.setViewportSize({ width: 1280, height: 844 });
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.addScriptTag({ content: script });
      await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
      await page.locator('#pimJournalMenuPanel a').first().focus();
      await page.locator('.pim-topbar').click({ position: { x: 2, y: 2 } });
      assert(await page.evaluate(() => document.activeElement === document.body));
      await page.setViewportSize({ width: 900, height: 844 });
      await page.waitForFunction(() => document.getElementById('pimJournalMenuPanel').hasAttribute('inert'));
      assert(await page.evaluate(() => document.activeElement === document.body), 'Intentional background blur must stay outside the drawer');
    });
    assert.equal(focusRegressions.length, 0, focusRegressions.join('; '));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ content: script });
    await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
    await page.getByRole('tab', { name: 'Links', exact: true }).click();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.waitForFunction(() => !document.getElementById('pimJournalLinksPanel').hasAttribute('inert'));
    assert(await page.locator('#pimJournalMenuPanel').isVisible());
    assert(await page.locator('#pimJournalLinksPanel').isVisible());
    await page.setViewportSize({ width: 900, height: 1000 });
    await page.waitForFunction(() => document.getElementById('pimJournalMenuPanel').hasAttribute('inert'));
    assert.equal(await page.locator('#pimJournalMenuPanel').isVisible(), false);
    console.log('PASS responsive resize: open mobile panel resets safely on desktop and tablet.');
    await page.setViewportSize({ width: 1024, height: 1000 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const compactGap = await page.evaluate(() => {
      const extraContent = document.createElement('div');
      extraContent.style.height = '4000px';
      document.getElementById('pim-main-content').appendChild(extraContent);
      return document.getElementById('pimJournalLinksPanel').getBoundingClientRect().top - document.getElementById('pimJournalMenuPanel').getBoundingClientRect().bottom;
    });
    assert(Math.abs(compactGap - 24) <= 1, `Long journal pages must not push information blocks down: gap=${compactGap}px`);
    console.log('PASS compact long page: information blocks follow the menu without a stretched grid gap.');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.locator('#pimJournalLinksPanel').evaluate(e => e.remove());
    await page.addScriptTag({ content: script });
    await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
    assert.equal(await page.locator('[data-pim-tools-tab="links"]').isVisible(), false);
    await page.locator('#pimMobileToolsToggle').click();
    assert(await page.locator('#pimJournalMenuPanel').isVisible());
    await page.keyboard.press('Escape');
    console.log('PASS empty sidebar: journal menu still works and the unavailable Links tab is hidden.');
    assert.equal(errors.length, 0, `Theme JavaScript errors: ${errors.join('; ')}`);
    fs.writeFileSync(path.join(output, 'layout-results.json'), JSON.stringify({ results, errors, resize: 'PASS', emptySidebar: 'PASS', compactLongContentGap: compactGap }, null, 2));
    if (results.some(result => result.failures.length)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
