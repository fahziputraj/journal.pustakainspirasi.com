/**
 * Layer v2.2 (pim-hero.css): each journal takes its accent from its logo, every accent passes WCAG AA
 * (as text on white and behind white text), the portal keeps PIM red, and components follow the
 * HeroUI-style language (pill buttons, filled fields, soft surfaces).
 * Usage: node tools/qa/replay-live.cjs <dir> <portal + 5 journal homes + mbj/login> ; node tools/qa/journal-palette.cjs <dir>
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const dir = process.argv[2];
const expected = { 'index.html': '#a91d22', 'mbj-index.html': '#0a3f8f', 'mcj-index.html': '#c70d16', 'mcsj-index.html': '#265688', 'mmj-index.html': '#c50a0a', 'mpj-index.html': '#12357e' };
const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const parse = (s) => s.match(/\d+/g).slice(0, 3).map(Number);
const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
const results = [];
async function check(name, fn) { try { await fn(); results.push('ok   ' + name); } catch (e) { results.push('FAIL ' + name + ': ' + e.message.split('\n')[0]); } }
(async () => {
  const b = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    for (const [file, want] of Object.entries(expected)) {
      await check(`palette ${file}: accent ${want}, AA both ways`, async () => {
        await p.goto(pathToFileURL(path.join(dir, file)).href, { waitUntil: 'load' });
        await p.waitForTimeout(500);
        const r = await p.evaluate(() => {
          const btn = document.querySelector('.btn-publish');
          const cs = getComputedStyle(btn);
          return { bg: cs.backgroundColor, fg: cs.color, radius: parseFloat(cs.borderTopLeftRadius), h: btn.getBoundingClientRect().height };
        });
        const bg = parse(r.bg);
        assert.equal(hex(bg), want, 'accent');
        assert.ok(ratio(bg, [255, 255, 255]) >= 4.5, 'accent on white ' + ratio(bg, [255, 255, 255]).toFixed(2));
        assert.ok(ratio(parse(r.fg), bg) >= 4.5, 'label on accent');
        assert.ok(r.radius >= r.h / 2 - 1, 'pill button');
      });
    }
    await check('fields are filled and surfaces soft (mbj login)', async () => {
      await p.goto(pathToFileURL(path.join(dir, 'mbj-login.html')).href, { waitUntil: 'load' });
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => {
        const i = getComputedStyle(document.querySelector('#username'));
        const card = getComputedStyle(document.querySelector('.pkp_structure_main'));
        return { bg: i.backgroundColor, radius: i.borderTopLeftRadius, cardShadow: card.boxShadow, cardBorder: card.borderTopWidth, cardRadius: card.borderTopLeftRadius };
      });
      assert.equal(r.bg, 'rgb(244, 244, 245)'); assert.equal(r.radius, '12px');
      assert.notEqual(r.cardShadow, 'none'); assert.equal(r.cardBorder, '0px'); assert.equal(r.cardRadius, '16px');
    });
    await check('portal card CTA is secondary, header CTA stays primary', async () => {
      await p.goto(pathToFileURL(path.join(dir, 'index.html')).href, { waitUntil: 'load' });
      await p.waitForTimeout(500);
      const r = await p.evaluate(() => ({ card: getComputedStyle(document.querySelector('.pim-btn-submit')).backgroundColor, header: getComputedStyle(document.querySelector('.btn-publish')).backgroundColor }));
      assert.equal(r.card, 'rgb(255, 255, 255)'); assert.equal(r.header, 'rgb(169, 29, 34)');
    });
  } finally { await b.close(); }
  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
  console.log('PASS: per-journal palettes from the logos pass AA; HeroUI-style pill buttons, filled fields, soft surfaces.');
})().catch((e) => { console.error(e); process.exit(1); });
