/**
 * Refinement layer v2.1 (pim-refine.css + PIM.enhanceArticlePage) against live markup.
 * Usage:
 *   node tools/qa/replay-live.cjs <dir> <live urls...>     (article 109, issue 13, archive, login,
 *        register, about/submissions, Reviewer, index)
 *   PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright node tools/qa/public-refine.cjs <dir>
 * Each check names the defect it guards against (see docs/PIM_PUBLISH_BRAND_UX_20261127.md).
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const dir = process.argv[2];
if (!dir) { console.error('Usage: node tools/qa/public-refine.cjs <replayDir>'); process.exit(2); }
const file = (part) => {
  const hit = fs.readdirSync(dir).find((f) => f.endsWith('.html') && f.includes(part));
  if (!hit) throw new Error('replay file missing: ' + part);
  return pathToFileURL(path.join(dir, hit)).href;
};

const results = [];
async function check(name, fn) {
  try { await fn(); results.push('ok   ' + name); } catch (error) { results.push('FAIL ' + name + ': ' + error.message.split('\n')[0]); }
}

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', args: ['--allow-file-access-from-files'] });
  const p = await browser.newPage();
  const open = async (part, width) => {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(file(part), { waitUntil: 'load' });
    await p.waitForTimeout(500);
  };
  const noOverflow = () => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  try {
    for (const width of [1440, 1280, 390]) {
      await check(`article@${width}: PDF sits right under the authors`, async () => {
        await open('article-view', width);
        const r = await p.evaluate(() => {
          const authors = document.querySelector('.main_entry .item.authors');
          const actions = document.querySelector('.main_entry .pim-article-actions');
          const pdf = actions && actions.querySelector('a.obj_galley_link');
          return {
            next: authors && authors.nextElementSibling === actions,
            pdfTop: pdf ? Math.round(pdf.getBoundingClientRect().top + scrollY) : null,
            leftInDetails: document.querySelectorAll('.entry_details .item.galleys').length,
          };
        });
        assert.equal(r.next, true, 'actions follow authors');
        assert.ok(r.pdfTop !== null && r.pdfTop < 800, 'PDF within the first screen, got ' + r.pdfTop);
        assert.equal(r.leftInDetails, 0, 'no duplicate download block');
        assert.equal(await noOverflow(), true, 'no sideways scroll');
      });
    }
    await check('article@1280: details column stays beside the text', async () => {
      await open('article-view', 1280);
      const r = await p.evaluate(() => {
        const m = document.querySelector('.main_entry').getBoundingClientRect();
        const d = document.querySelector('.entry_details').getBoundingClientRect();
        const main = document.querySelector('.pkp_structure_main').getBoundingClientRect();
        return { side: d.left > m.right, top: Math.abs(d.top - m.top), mainLeft: Math.round(m.left), contentLeft: Math.round(main.left) };
      });
      assert.ok(r.side && r.top < 2, 'two columns: ' + JSON.stringify(r));
      assert.equal(r.mainLeft, r.contentLeft, 'one left edge');
    });
    await check('article: abstract is flat and upright when fully italic', async () => {
      await open('article-view', 1440);
      const r = await p.evaluate(() => {
        const a = document.querySelector('.item.abstract');
        const em = a.querySelector('em');
        const c = getComputedStyle(a);
        return { upright: a.classList.contains('pim-abstract-upright'), emStyle: getComputedStyle(em).fontStyle, border: c.borderTopWidth, shadow: c.boxShadow };
      });
      assert.equal(r.upright, true);
      assert.equal(r.emStyle, 'normal');
      assert.equal(r.border, '0px');
      assert.equal(r.shadow, 'none');
    });
    await check('article: references have a number column and hanging text', async () => {
      const r = await p.evaluate(() => {
        const ps = [...document.querySelectorAll('.item.references .value p')];
        const withNum = ps.filter((x) => x.querySelector(':scope > .pim-ref-num'));
        const first = withNum[0];
        const num = first.querySelector('.pim-ref-num').getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(first);
        const rects = [...range.getClientRects()].filter((rr) => rr.left > num.right);
        return { total: ps.length, numbered: withNum.length, textStarts: Math.round(Math.min(...rects.map((rr) => rr.left))), numRight: Math.round(num.right), align: getComputedStyle(first).textAlign };
      });
      assert.ok(r.total > 10 && r.numbered === r.total, 'all references numbered: ' + JSON.stringify(r));
      assert.ok(r.textStarts > r.numRight, 'text clears the number column');
      assert.equal(r.align, 'left');
    });
    await check('issue: section heading and cards share the content edge; quiet meta', async () => {
      await open('issue-view', 1440);
      const r = await p.evaluate(() => {
        const main = document.querySelector('.pkp_structure_main').getBoundingClientRect().left;
        const h = document.querySelector('.obj_issue_toc .section > h2').getBoundingClientRect().left;
        const card = document.querySelector('.pim-article-card').getBoundingClientRect().left;
        const tag = getComputedStyle(document.querySelector('.pim-article-tag'));
        const cards = [...document.querySelectorAll('.pim-article-card')].map((c) => c.getBoundingClientRect());
        return { main: Math.round(main), h: Math.round(h), card: Math.round(card), tagBg: tag.backgroundColor, gap: cards.length > 1 ? Math.round(cards[1].top - cards[0].bottom) : 16 };
      });
      assert.equal(r.h, r.main, 'heading edge');
      assert.equal(r.card, r.main, 'card edge');
      assert.equal(r.tagBg, 'rgba(0, 0, 0, 0)', 'meta tags have no fill');
      assert.equal(r.gap, 16, 'card gap');
    });
    await check('issue: breadcrumb sits 16px above the title', async () => {
      const gap = await p.evaluate(() => Math.round(document.querySelector('.pkp_structure_main h1').getBoundingClientRect().top - document.querySelector('.cmp_breadcrumbs').getBoundingClientRect().bottom));
      assert.ok(Math.abs(gap - 16) <= 2, 'gap ' + gap);
    });
    await check('archive: issue title on the content edge, muted series', async () => {
      await open('issue-archive', 1440);
      const r = await p.evaluate(() => ({
        main: Math.round(document.querySelector('.pkp_structure_main').getBoundingClientRect().left),
        title: Math.round(document.querySelector('.obj_issue_summary a.title').getBoundingClientRect().left),
        series: getComputedStyle(document.querySelector('.obj_issue_summary .series')).color,
      }));
      assert.equal(r.title, r.main);
      assert.equal(r.series, 'rgb(91, 101, 117)');
    });
    for (const width of [1440, 390]) {
      await check(`login@${width}: full-width fields and button, left-aligned title`, async () => {
        await open('mbj-login.html', width);
        const r = await p.evaluate(() => {
          const form = document.querySelector('form.login').getBoundingClientRect().width;
          const input = document.querySelector('#username').getBoundingClientRect().width;
          const button = document.querySelector('form.login button.submit').getBoundingClientRect().width;
          return { form: Math.round(form), input: Math.round(input), button: Math.round(button), align: getComputedStyle(document.querySelector('.page_login h1')).textAlign };
        });
        assert.equal(r.input, r.form, 'input width');
        assert.equal(r.button, r.form, 'button width');
        assert.equal(r.align, 'left');
        assert.equal(await noOverflow(), true);
      });
    }
    await check('register@390: consent link stays inline with its sentence', async () => {
      await open('register', 390);
      const r = await p.evaluate(() => {
        const link = document.querySelector('form.register a[href*="privacy"], form.register label a');
        const label = link.closest('label');
        const box = label.querySelector('input[type="checkbox"]').getBoundingClientRect();
        return { lines: link.getClientRects().length, left: Math.round(link.getBoundingClientRect().left), boxRight: Math.round(box.right) };
      });
      assert.ok(r.lines <= 2 && r.left > r.boxRight, JSON.stringify(r));
    });
    await check('custom page: first h2 takes the page-title role', async () => {
      await open('Reviewer', 1440);
      const size = await p.evaluate(() => getComputedStyle(document.querySelector('.pkp_structure_main > .page > h2')).fontSize);
      assert.equal(size, '30px');
    });
    await check('submissions: neutral notice, single checklist marker, clean footer heading', async () => {
      await open('submissions', 1440);
      const r = await p.evaluate(() => {
        const n = getComputedStyle(document.querySelector('.cmp_notification'));
        const ul = getComputedStyle(document.querySelector('.submission_checklist ul'));
        const fh = [...document.querySelectorAll('.pkp_structure_footer_wrapper :is(h2,h3,h4)')].map((h) => getComputedStyle(h).borderBottomWidth);
        return { left: n.borderLeftWidth, list: ul.listStyleType, fh };
      });
      assert.equal(r.left, '1px');
      assert.equal(r.list, 'none');
      assert.ok(r.fh.every((w) => w === '0px'), 'footer heading borders ' + r.fh);
    });
    await check('journal home: latest-article titles in sentence case', async () => {
      await open('mbj-index', 1440);
      const tt = await p.evaluate(() => getComputedStyle(document.querySelector('.pim-article-card .pim-article-title')).textTransform);
      assert.equal(tt, 'none');
    });
  } finally {
    await browser.close();
  }
  console.log(results.join('\n'));
  if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
  console.log('PASS: refinement layer holds on article, issue, archive, account, custom and submission pages.');
})().catch((error) => { console.error(error); process.exit(1); });
