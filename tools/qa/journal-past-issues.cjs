/**
 * Journal home "Past Issues": render only real past issues, safely.
 * Usage: PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright node tools/qa/journal-past-issues.cjs
 */
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../..');
const archiveUrl = 'https://journal.example.test/mbj/issue/archive';
const summary = (n, title) => `<div class="obj_issue_summary"><a class="cover" href="https://journal.example.test/mbj/issue/view/${n}"><img src="https://journal.example.test/c${n}.png" alt="cover ${n}"></a><h2><a class="title" href="https://journal.example.test/mbj/issue/view/${n}">${title}</a><div class="series">Vol. ${n} No. 1</div></h2></div>`;
const shell = `<!doctype html><html><body><section class="pim-past-issues" id="pim-popular-issues-container" data-pim-past-issues data-archive-url="${archiveUrl}" data-fallback-cover="/default.png" hidden><h2>Past Issues</h2><div class="pim-issues-grid"></div></section></body></html>`;

async function run(page, archiveHtml) {
  await page.unrouteAll();
  await page.route('https://journal.example.test/**', (route) => {
    const url = route.request().url();
    if (url === archiveUrl) return route.fulfill({ status: 200, contentType: 'text/html', body: archiveHtml });
    if (url.endsWith('/mbj/index')) return route.fulfill({ status: 200, contentType: 'text/html', body: shell });
    return route.fulfill({ status: 204, body: '' });
  });
  await page.goto('https://journal.example.test/mbj/index');
  await page.addScriptTag({ path: path.join(root, 'pim-ui.js') });
  await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
  await page.waitForFunction(() => window.__pimPastIssuesDone === true, null, { timeout: 5000 });
  return page.evaluate(() => {
    const section = document.querySelector('[data-pim-past-issues]');
    return {
      hidden: section.hidden,
      cards: [...section.querySelectorAll('.pim-issue-card')].map((card) => ({
        title: card.querySelector('h3').textContent,
        links: [...card.querySelectorAll('a')].map((a) => a.getAttribute('href')),
      })),
      xss: window.__xss,
    };
  });
}

(async () => {
  // Use the installed Chrome unless PLAYWRIGHT_CHANNEL says otherwise (no browser download needed).
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const page = await browser.newPage();
    let result = await run(page, '<ul class="issues_archive"><li>' + summary(1, 'June, 2026') + '</li></ul>');
    assert.equal(result.hidden, true, 'Only the current issue exists: section stays hidden');
    assert.equal(result.cards.length, 0);

    result = await run(page, '<ul>' + [summary(3, 'December, 2026'), summary(2, 'June, 2026'), summary(1, 'December, 2025')].map((s) => '<li>' + s + '</li>').join('') + '</ul>');
    assert.equal(result.hidden, false, 'Past issues exist: section is shown');
    assert.deepEqual(result.cards.map((c) => c.title), ['June, 2026', 'December, 2025']);
    assert.ok(result.cards.every((c) => c.links.length && c.links.every((href) => /issue\/view\/[12]$/.test(href))));

    result = await run(page, '<ul><li>' + summary(2, 'Current') + '</li><li>' + summary(1, '&lt;img src=x onerror="window.__xss=1"&gt;Vol 2') + '</li></ul>');
    assert.equal(result.xss, undefined, 'Issue titles must never be parsed as HTML');
    assert.ok(result.cards[0].title.includes('<img src=x'), 'Title text is shown literally');
  } finally {
    await browser.close();
  }
  console.log('PASS: Past issues render only when the archive has them, as safe text, linking to each issue.');
})().catch((error) => { console.error(error); process.exit(1); });
