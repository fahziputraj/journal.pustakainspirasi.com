/**
 * Verify the portal subject facets classify the five PIM journals by their real discipline.
 * Usage: node tools/qa/portal-subjects.cjs
 * Evaluates the marked block of indexSite.tpl in a vm sandbox against the live card data fixture.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const template = fs.readFileSync(path.join(root, 'plugins/themes/pustakaMinang/templates/frontend/pages/indexSite.tpl'), 'utf8');
const block = /\/\* pim-subjects:start \*\/([\s\S]*?)\/\* pim-subjects:end \*\//.exec(template);
assert.ok(block, 'Subject logic must be wrapped in /* pim-subjects:start */ ... /* pim-subjects:end */');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(block[1] + '\nthis.subjectKeywords = subjectKeywords; this.matchesSubjectKeyword = matchesSubjectKeyword;', sandbox);
const { subjectKeywords, matchesSubjectKeyword } = sandbox;

const templateButtons = [...template.matchAll(/data-subject="([^"]+)">([^<]+?)\s*<span class="count">/g)].map((m) => [m[1], m[2].trim()]);
assert.deepEqual(Object.keys(subjectKeywords), ['life', 'physical', 'formal']);
assert.deepEqual(templateButtons, [['life', 'Life Sciences'], ['physical', 'Chemistry &amp; Physics'], ['formal', 'Mathematics &amp; Computing']]);

const journals = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/portal-journals.json'), 'utf8'));
const matches = (item, key) => matchesSubjectKeyword(item, subjectKeywords, key);
function expectOnly(name, key) {
  const journal = journals.find((j) => j.name === name);
  assert.ok(journal, 'Fixture is missing ' + name);
  const item = { subjectSearch: (journal.name + ' ' + journal.shortDesc).toLowerCase() };
  const hits = Object.keys(subjectKeywords).filter((k) => matches(item, k));
  assert.deepEqual(hits, [key], name + ' should belong only to ' + key + ', got ' + hits.join(','));
}
expectOnly('Minang Bioscience Journal (MBJ)', 'life');
expectOnly('Minang Chemistry Journal (MCJ)', 'physical');
expectOnly('Minang Physics Journal (MPJ)', 'physical');
expectOnly('Minang Mathematics Journal (MMJ)', 'formal');
expectOnly('Minang Computer Science Journal (MCSJ)', 'formal');
assert.equal(matches({ subjectSearch: 'journal of biochemistry teaching' }, 'physical'), false, 'Whole words only');

console.log('PASS: Portal subjects classify the five PIM journals by discipline with whole-word matching.');
