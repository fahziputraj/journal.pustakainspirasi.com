/**
 * Apply the Phase C pass conditions (plan 2026-11-27) to a run_layout_audit.mjs report.json.
 * Usage: node tools/qa/audit-gate.cjs <report.json> [--verbose]
 * Exit 1 when any page has a blocking finding.
 */
const fs = require('node:fs');

const [reportPath, flag] = process.argv.slice(2);
if (!reportPath) {
  console.error('Usage: node tools/qa/audit-gate.cjs <report.json> [--verbose]');
  process.exit(2);
}
const pages = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const strictChecks = new Set(['page-h-overflow', 'box-spill-x', 'text-collision', 'focus-obscured', 'img-distorted', 'contrast', 'name-missing']);
const chrome = /\.pim-topbar|\.pim-header|#mainHeader|footer|#pimJournalMenuPanel|#directoryResultsHeader/;
let failed = 0;

for (const page of pages) {
  const problems = [];
  for (const finding of page.findings || []) {
    const passes = finding.passes || [];
    const normal = passes.filter((p) => !p.includes('+longword'));
    const longword = passes.filter((p) => p.includes('+longword'));
    const where = [finding.selector, finding.message, ...(finding.culprits || [])].join(' ');
    // Documented exception: the portal filter drawer is off-canvas (translateX(-100%), overflow clipped)
    // below 1025px; collisions reported against its clipped links are not visible to users.
    if (finding.check === 'text-collision' && /pim-sidebar-journal-scroller/.test(where)) continue;
    if (normal.length && strictChecks.has(finding.check)) problems.push([finding.check, finding.selector, normal.join(', '), finding.message]);
    if (normal.length && finding.check === 'control-overlap' && !/pim-mobile-tools-bar|pimMobileToolsToggle|pim-mobile-tools-tabs/.test(where)) problems.push([finding.check, finding.selector, normal.join(', '), finding.message]);
    if (longword.length && finding.check === 'page-h-overflow' && chrome.test(where)) problems.push(['longword:' + finding.check, finding.selector, longword.join(', '), finding.message]);
  }
  const title = (page.url || '').replace(/^file:\/\/\/.*\//, '');
  console.log((problems.length ? 'FAIL ' : 'PASS ') + problems.length + '  ' + title);
  if (problems.length) failed++;
  if (problems.length && flag === '--verbose') {
    for (const [check, selector, where, message] of problems.slice(0, 12)) console.log('   - ' + check + ' | ' + selector + ' | ' + where + ' | ' + message);
  }
}
process.exit(failed ? 1 : 0);
