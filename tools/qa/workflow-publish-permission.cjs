/**
 * Verify the OJS 3.5 workflow permission composable inside the compiled bundle js/build.js.
 * Usage: node tools/qa/workflow-publish-permission.cjs
 *
 * The bundle is minified, so code is located by content (stable strings), never by the
 * minifier's generated names. The composable is evaluated in a vm sandbox with stubs.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const src = fs.readFileSync(path.join(root, 'js/build.js'), 'utf8');

/** Return the source of the function whose `function` keyword starts at `start`. */
function sliceFunction(text, start) {
  let i = text.indexOf('{', text.indexOf(')', start));
  let depth = 0;
  let quote = null;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  throw new Error('Unbalanced function source');
}

const count = (haystack, needle) => haystack.split(needle).length - 1;

const marker = 'canAccessEditorialHistory:b,canChangeSubmissionLanguage:_';
const markerAt = src.indexOf(marker);
assert.notEqual(markerAt, -1, 'Workflow permissions composable not found in js/build.js');
const headerRe = /function (\w+)\(\{submission:e,selectedPublication:t\}\)\{const\{getActiveStage:n,getStageById:r\}=(\w+)\(\)/g;
let header;
let match;
while ((match = headerRe.exec(src)) && match.index < markerAt) header = match;
assert.ok(header, 'Composable header not found before the permission marker');
const composable = sliceFunction(src, header.index);
assert.ok(composable.includes(marker), 'Sliced composable does not contain the permission marker');

const [, composableName, stageAccessorName] = header;
const computedName = /permissions:(\w+)\(\(\)=>/.exec(composable)[1];
const intersectName = /(\w+)\(T\.currentUserAssignedRoles/.exec(composable)[1];
const intersectStart = src.indexOf('function ' + intersectName + '(');
assert.notEqual(intersectStart, -1, 'Role intersection helper not found');
const intersect = sliceFunction(src, intersectStart);
const rolesMatch = /(\w+)=\[pkp\.const\.ROLE_ID_SITE_ADMIN,pkp\.const\.ROLE_ID_MANAGER,pkp\.const\.ROLE_ID_SUB_EDITOR,pkp\.const\.ROLE_ID_ASSISTANT\]/.exec(src);
assert.ok(rolesMatch, 'Editorial roles array not found');

const sandbox = {
  pkp: {
    const: {
      ROLE_ID_SITE_ADMIN: 1,
      ROLE_ID_MANAGER: 16,
      ROLE_ID_SUB_EDITOR: 17,
      ROLE_ID_AUTHOR: 65,
      ROLE_ID_ASSISTANT: 4097,
      WORKFLOW_STAGE_ID_PRODUCTION: 5,
      STATUS_PUBLISHED: 3,
      STATUS_SCHEDULED: 5,
    },
  },
  [computedName]: (fn) => ({ get value() { return fn(); } }),
  [stageAccessorName]: () => ({
    getActiveStage: (submission) => submission.stages.find((stage) => stage.isActiveStage),
    getStageById: (submission, id) => submission.stages.find((stage) => stage.id === id),
  }),
  [rolesMatch[1]]: [1, 16, 17, 4097],
};
vm.createContext(sandbox);
vm.runInContext(intersect, sandbox);
const permissionsFor = vm.runInContext('(' + composable + ')', sandbox);

function evaluate(rolesByStage, recommendOnly, activeStageId = 5) {
  const submission = {
    canCurrentUserChangeMetadata: true,
    publications: [{ status: 1 }],
    stages: [1, 3, 4, 5].map((id) => ({
      id,
      isActiveStage: id === activeStageId,
      currentUserAssignedRoles: rolesByStage[id] || [],
      currentUserCanRecommendOnly: id === 5 ? recommendOnly : false,
    })),
  };
  return permissionsFor({ submission: { value: submission }, selectedPublication: { value: submission.publications[0] } }).permissions.value;
}

const cases = [
  ['subEditor', { 5: [17] }, false, true],
  ['subEditorRecommendOnly', { 5: [17] }, true, false],
  ['managerAssignedAsSubEditor', { 5: [17] }, false, true],
  ['manager', { 5: [16] }, false, true],
  ['siteAdmin', { 5: [1] }, false, true],
  ['assistant', { 5: [4097] }, false, false],
  ['author', { 5: [65] }, false, false],
];
for (const [name, roles, recommendOnly, expected] of cases) {
  assert.equal(evaluate(roles, recommendOnly).canPublish, expected, name + ': canPublish');
}
assert.equal(evaluate({ 3: [17], 5: [] }, false, 3).canPublish, false, 'subEditorNotInProduction: canPublish');
assert.equal(evaluate({ 5: [17] }, false).canAccessProduction, true, 'subEditor: canAccessProduction');

assert.equal(count(src, '[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER,pkp.const.ROLE_ID_SUB_EDITOR])&&(m=!0)'), 1, 'Patched publish role list must appear exactly once');
assert.equal(count(src, '[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER])&&(m=!0)'), 0, 'Unpatched publish role list must be gone');

console.log('PASS: Section editors in production can publish; recommend-only, assistant, author and unassigned-stage users cannot.');
