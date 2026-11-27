# PIM Journal: publish permission, brand assets and UX defects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every PIM request from 18-27 Nov 2026 first (Section Editor publish, logo, favicon). Then fix the backend and middleware bugs found (signed-out dashboard 500, unusable workflow modal on phones, missing cache headers, in-request job runners). Then redesign the public shell into a clean international-journal look, and ship to production with recoverable backups.

**Architecture:** Every change stays inside the existing OJS 3.5.0.4 install: the `pustakaMinang` Smarty theme, `pim-ui.js`, and one surgical patch to the compiled UI bundle `js/build.js`. Plain CSS/JS/PHP only, no build step. Tests are standalone PHP/Node harnesses in `tools/qa/` in the established style (Smarty renders without a DB, a Node `vm` evaluation of bundle code, Playwright fixtures, and the ui-ux-layout-standards auditor against live HTML replayed with local assets). Production is updated through cPanel File Manager from a `git archive` payload, because cPanel Git cannot pull the private remote.

**Tech Stack:** OJS 3.5.0.4 (PHP 8.2 lsphp on prod, PHP 8.5 CLI locally), Smarty, vanilla JS, PowerShell 7 + System.Drawing (asset build), Node 26, Playwright from `D:\SA\aapm-prod-portal\node_modules\playwright` (`PLAYWRIGHT_MODULE`), and the auditor `C:\Users\ptaap\.claude\skills\ui-ux-layout-standards\scripts\run_layout_audit.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-27-pim-journal-requests-design.md` (requests R1-R3, backend note, defects D1-D7, critique table).

## Global Constraints

- Branch `fix/pim-publish-brand-ux-20261127` from `main`. Never commit `config.inc.php`, credentials or the WhatsApp archive (it contains passwords).
- Brand colours stay `#A91D22` (crimson) and `#D2A758` (gold). The design tokens are the `--pim2-*` set in spec §4b. The gold text ink `#8A6418` gives 5.36:1 on #FFF, and crimson with white text gives 7.28:1.
- Asset query versions: `pim-layout.css?v=20261127-1`, `pim-ui.js?v=20261127-1`, theme images `?v=20261127`, backend bundle `js/build.js?v=3.5.0.4-pim.20261127`.
- Theme asset base URL in templates: `{$baseUrl}/plugins/themes/pustakaMinang/images/`.
- New visible copy has no em-dash or en-dash. UI copy stays English, as the theme uses English.
- Stored OJS data (journal settings, custom blocks, users, roles, submissions, issues) is never changed by code. Data recommendations go into the report.
- Production writes happen only after the user confirms in chat. Back up every replaced path to `/home/pusf3964/pim-backup-20261127/` first. Deploy only committed bytes (`git archive`, LF endings).
- `js/build.js` must differ from 3.5.0.4 by exactly the inserted string `,pkp.const.ROLE_ID_SUB_EDITOR` (29 bytes).

## Review Focus

1. A Section Editor assigned with "recommend only" must still not see Schedule/Publish. Covered by Task 1 case `subEditorRecommendOnly`.
2. A Journal Manager who is assigned to the submission as Section Editor must see the button. Assigned users get assignment roles only, so production roles are `[17]`. Covered by Task 1 case `managerAssignedAsSubEditor`.
3. Browsers holding the old `build.js?v=3.5.0.4` heuristically cached (no Cache-Control header on the host) must load the patched file. Covered by the Task 1 URL-version test.
4. The transparent logo must show no white halo on the grey footer (#F8FAFC) or on dark ink. Covered by the Task 2 composite check.
5. A journal that uploads its own favicon in OJS must keep it, with no theme override. Covered by Task 3 case `contextFavicon`.

---

## Phase A: client requests (18-27 Nov 2026)

### Task 1: Section Editors can schedule/publish

**Files:**
- Modify: `js/build.js` (the single `canPublish` role list inside the workflow-permissions composable)
- Modify: `plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php`
- Create: `tools/qa/workflow-publish-permission.cjs`
- Create: `tools/qa/backend-bundle-version.php`

**Interfaces:**
- Produces: `PustakaMinangThemePlugin::BACKEND_BUNDLE_VERSION = '3.5.0.4-pim.20261127'` and `PustakaMinangThemePlugin::versionBackendBundle(string $hookName, array $args): bool`. It always returns `false` and is registered on `TemplateManager::display` in `init()`.

- [ ] **Step 1: Branch and baseline**

Run: `git switch -c fix/pim-publish-brand-ux-20261127; php tools/qa/journal-sidebar.php; php tools/qa/journal-announcements.php; php tools/qa/journal-homepage.php`
Expected: three `PASS:` lines.

- [ ] **Step 2: Write the failing permission test `tools/qa/workflow-publish-permission.cjs`**

Read `js/build.js` as UTF-8 and locate code by content, not by minified names:
- composable: the `function NAME({submission:e,selectedPublication:t}){` whose body contains `canAccessEditorialHistory:b,canChangeSubmissionLanguage:_`. Slice it to its matching closing brace.
- derive helper names from that body: `const\{getActiveStage:n,getStageById:r\}=(\w+)\(\)` (stage accessor), `permissions:(\w+)\(\(\)=>` (computed), `(\w+)\(T\.currentUserAssignedRoles` (intersection helper; slice `function <helper>(` from the bundle), and the editorial-roles array `(\w+)=\[pkp\.const\.ROLE_ID_SITE_ADMIN,pkp\.const\.ROLE_ID_MANAGER,pkp\.const\.ROLE_ID_SUB_EDITOR,pkp\.const\.ROLE_ID_ASSISTANT\]`.
- evaluate in `node:vm` with `pkp.const = {ROLE_ID_SITE_ADMIN:1, ROLE_ID_MANAGER:16, ROLE_ID_SUB_EDITOR:17, ROLE_ID_AUTHOR:65, ROLE_ID_ASSISTANT:4097, WORKFLOW_STAGE_ID_PRODUCTION:5, STATUS_PUBLISHED:3, STATUS_SCHEDULED:5}`, computed `= fn => ({ get value() { return fn(); } })`, stage accessor returning `{getActiveStage: s => s.stages.find(x => x.isActiveStage), getStageById: (s, id) => s.stages.find(x => x.id === id)}`.
- fixture: submission with stages 1,3,4,5 where stage 5 is active, `publications: [{status: 1}]`, `canCurrentUserChangeMetadata: true`. The case sets stage-5 `currentUserAssignedRoles`/`currentUserCanRecommendOnly`.

```js
const cases = [
  ['subEditor',                  {5: [17]},            false, true ],
  ['subEditorRecommendOnly',     {5: [17]},            true,  false],
  ['managerAssignedAsSubEditor', {5: [17]},            false, true ],
  ['manager',                    {5: [16]},            false, true ],
  ['siteAdmin',                  {5: [1]},             false, true ],
  ['assistant',                  {5: [4097]},          false, false],
  ['author',                     {5: [65]},            false, false],
  ['subEditorNotInProduction',   {3: [17], 5: []},     false, false], // active stage 3 for this case
];
// assert.equal(permissions.canPublish, expected, name) for each case
// assert.equal(subEditor.canAccessProduction, true)
// assert.equal(count(src, '[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER,pkp.const.ROLE_ID_SUB_EDITOR])&&(m=!0)'), 1)
// assert.equal(count(src, '[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER])&&(m=!0)'), 0)
```
Print `PASS: Section editors in production can publish; recommend-only, assistant, author and unassigned-stage users cannot.`

- [ ] **Step 3: Run it and confirm it fails**

Run: `node tools/qa/workflow-publish-permission.cjs`
Expected: FAIL on `subEditor` (canPublish false).

- [ ] **Step 4: Patch `js/build.js`**

Replace exactly one occurrence of `[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER])&&(m=!0)` with `[pkp.const.ROLE_ID_SITE_ADMIN,pkp.const.ROLE_ID_MANAGER,pkp.const.ROLE_ID_SUB_EDITOR])&&(m=!0)`, using a Node one-liner that throws unless the match count is 1. Then check that `git show HEAD:js/build.js` is 29 bytes shorter than `git show :js/build.js` after `git add js/build.js`.

- [ ] **Step 5: Run the permission test**

Run: `node tools/qa/workflow-publish-permission.cjs`
Expected: `PASS: Section editors ...`

- [ ] **Step 6: Write the failing cache-key test `tools/qa/backend-bundle-version.php`**

Stub `PKP\plugins\ThemePlugin` (no-op `setParent`, `addStyle`), `PKP\plugins\Hook::add` (records name and callable), and `PKP\template\PKPTemplateManager` with `const STYLE_SEQUENCE_LATE = 15`. Then require the real plugin. The fake template manager has `getTemplateVars('baseUrl') => 'https://journal.example.test'` and records `addJavaScript($name, $script, $args)`. Assertions:
- `init()` registered `TemplateManager::display` with `[$plugin, 'versionBackendBundle']`.
- `versionBackendBundle('TemplateManager::display', [$fake]) === false`.
- exactly one call: `'pkpApp'`, `'https://journal.example.test/js/build.js?v=3.5.0.4-pim.20261127'`, `['priority' => 15, 'contexts' => ['backend']]`.

- [ ] **Step 7: Run it and confirm it fails**

Run: `php tools/qa/backend-bundle-version.php`
Expected: FAIL (method `versionBackendBundle` missing).

- [ ] **Step 8: Implement in `PustakaMinangThemePlugin.php`**

Add the constant, register the hook in `init()`, and add the method. It re-registers `pkpApp` (same name, priority `\PKP\template\PKPTemplateManager::STYLE_SEQUENCE_LATE`, contexts `['backend']`) so it overwrites the core entry. The `?` in the URL stops OJS from appending `?v=3.5.0.4` (`PKPTemplateManager.php:2314`). Add a doc comment saying the version must change whenever `js/build.js` changes.

- [ ] **Step 9: Run all harnesses**

Run: `php -l plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php; php tools/qa/backend-bundle-version.php; php tools/qa/journal-sidebar.php; php tools/qa/journal-announcements.php; php tools/qa/journal-homepage.php; node tools/qa/workflow-publish-permission.cjs`
Expected: no syntax errors and every harness prints `PASS`.

- [ ] **Step 10: Commit**

```bash
git add js/build.js plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php tools/qa/workflow-publish-permission.cjs tools/qa/backend-bundle-version.php
git commit -m "Let assigned section editors schedule and publish in the OJS 3.5 workflow"
```

---

### Task 2: PIM brand assets (transparent logo, favicon set)

**Files:**
- Create: `docs/Logo_PIM_Journal/Logo PIM Journal HD 20261118.png`. Copy it from `C:\Users\ptaap\AppData\Local\Temp\claude\3981c14056b05d32\1c66c157-6b35-46b7-b9e3-50c56b6b02c6\scratchpad\wa_chat\Logo PIM Journal.png`, or extract `Logo PIM Journal.png` from `C:\Users\ptaap\Downloads\WhatsApp Chat with Bg Handri Maika Getpress.zip`. It is 1254x1254, 24-bit, on a white background.
- Create: `tools/brand/Build-PimBrandAssets.ps1`
- Create: `tools/qa/brand-assets.ps1`
- Create: `plugins/themes/pustakaMinang/images/pim-logo.png`, `favicon-32.png`, `apple-touch-icon.png`
- Replace (binary): `logo.png`, `favicon.ico`
- Create: `tools/brand/out/pageHeaderTitleImage_en.png`, the transparent logo padded to the stored site-logo ratio 1672:941 at 836x470. It is a data file for Task 12 (replaces `public/site/pageHeaderTitleImage_en.png`, 1.2 MB) and is not part of the theme payload.

**Interfaces:**
- Produces: `pim-logo.png` at exactly 240 px high (width W from the crop). Task 3 reads W and H with `[System.Drawing.Image]::FromFile(...)`. `favicon.ico` is served at `{$baseUrl}/favicon.ico`.

- [ ] **Step 1: Write the failing check `tools/qa/brand-assets.ps1`**

Using System.Drawing:
- `pim-logo.png` height 240, `PixelFormat` has alpha, all four corner pixels alpha 0, size ≤ 120 KB.
- `logo.png` width 1600, corner alpha 0, ≤ 600 KB.
- `favicon-32.png` is 32x32 with corner alpha 0.
- `apple-touch-icon.png` is 180x180 with opaque white corners.
- `favicon.ico`: header `00 00 01 00`, image count 3, entry sizes 16/32/48, PNG signature at each entry offset.

On success, print `PASS: PIM brand assets have expected sizes, transparency and icon entries.`

- [ ] **Step 2: Run it and confirm it fails**

Run: `pwsh -NoProfile -File tools/qa/brand-assets.ps1`
Expected: FAIL (files missing or root `logo.png` is 2451 px wide).

- [ ] **Step 3: Implement `tools/brand/Build-PimBrandAssets.ps1 -Source <png> -RepoRoot <dir>`**

Use an `Add-Type` C# helper over `LockBits`. Per-pixel loops in PowerShell are too slow. Algorithm:
- Colour-to-alpha against white: `a = max(255-r, 255-g, 255-b) / 255`. If `a ≤ 0.04` the pixel becomes transparent. Otherwise alpha is `(a - 0.04) / 0.96` and each channel is `clamp(255 - (255 - c) / a)`.
- Crop to the bounding box of alpha > 8, padded by 2% of the larger side.
- Emblem (pen + cap): scan columns of the cropped image left to right. The emblem ends at the first run of fully transparent columns at least 1.5% of the width wide. Centre it in a square with 8% padding.
- Resize with `HighQualityBicubic` + `PixelOffsetMode.HighQuality` and save PNG.
- `favicon.ico`: ICONDIR + 3 ICONDIRENTRY records, with PNG-encoded 16/32/48 emblem images as payloads.

Outputs: the paths in Files. `apple-touch-icon.png` is the emblem on `#FFFFFF` with 12% padding. Print each output path, size and dimensions.

- [ ] **Step 4: Build, then run the check**

Run: `pwsh -NoProfile -File tools/brand/Build-PimBrandAssets.ps1 -Source "docs/Logo_PIM_Journal/Logo PIM Journal HD 20261118.png" -RepoRoot .; pwsh -NoProfile -File tools/qa/brand-assets.ps1`
Expected: `PASS: PIM brand assets ...`

- [ ] **Step 5: Visual check (Review Focus 4)**

Composite `pim-logo.png` and `favicon-32.png` (scaled 4x) onto `#FFFFFF`, `#F8FAFC` and `#1E2022` into the scratchpad, then open them with the Read tool.
Expected: "PUSTAKA INSPIRASI JOURNALS" is spelled correctly. No white fringe on #F8FAFC. The emblem is recognisable at 32 px. On #1E2022 only the expected cut-outs show (the nib slit and the cap button).

- [ ] **Step 6: Commit**

```bash
git add "docs/Logo_PIM_Journal/Logo PIM Journal HD 20261118.png" tools/brand/Build-PimBrandAssets.ps1 tools/qa/brand-assets.ps1 plugins/themes/pustakaMinang/images logo.png favicon.ico
git commit -m "Add corrected transparent PIM logo and favicon set from the client HD file"
```

---

### Task 3: Templates use the PIM brand assets

**Files:**
- Modify: `plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl:42-48` (footer logo)
- Modify: `plugins/themes/pustakaMinang/templates/frontend/components/header.tpl:53-59` (brand link)
- Modify: `plugins/themes/pustakaMinang/templates/frontend/components/headerHead.tpl:23-25` (favicon links)
- Create: `tools/qa/brand-templates.php`

**Interfaces:**
- Consumes: `pim-logo.png` W x 240 (Task 2).
- Produces: favicon markup wrapped in `{* pim-favicon:start *}` … `{* pim-favicon:end *}` for extraction.

- [ ] **Step 1: Write the failing harness `tools/qa/brand-templates.php`**

Follow the style of `tools/qa/journal-announcements.php`: extract each snippet with a regex and render it with Smarty `string:` resources. The snippets are `<div class="footer-logo-mark">…</div>`, `<a class="pim-brand"…</a>` and the favicon markers. Cases and assertions:
- `footerJournalContext`: `displayPageHeaderLogo = ['uploadName' => 'logo.png']`, `publicFilesDir = '/public/journals/1'` → output contains `/plugins/themes/pustakaMinang/images/pim-logo.png?v=20261127`, `alt="Pustaka Inspirasi Minang"`, `width="` and `height="`, and does not contain `/public/journals/1/logo.png`.
- `headerFallback`: no `displayPageHeaderLogo` → contains `images/pim-logo.png?v=20261127` and does not contain `{baseUrl}/logo.png"`.
- `headerUploaded`: `['uploadName' => 'pageHeaderTitleImage_en.png', 'width' => 1672, 'height' => 941]` → `src="/public/site/pageHeaderTitleImage_en.png"`, `width="1672" height="941"`.
- `noContextFavicon`: `currentContext = null` → contains `href="https://journal.example.test/favicon.ico" sizes="any"`, `images/favicon-32.png?v=20261127`, `rel="apple-touch-icon"`.
- `contextFavicon`: `currentContext->getLocalizedFavicon()` returns `['uploadName' => 'favicon_en.png']` → zero `rel="icon"` and zero `apple-touch-icon` in the snippet.

- [ ] **Step 2: Run it and confirm it fails**

Run: `php tools/qa/brand-templates.php`
Expected: FAIL `footerJournalContext`.

- [ ] **Step 3: Implement the template changes**

- Footer: always use `pim-logo.png?v=20261127` with `alt="Pustaka Inspirasi Minang"`, `width` = round(W x 48 / 240), `height="48"`, `loading="lazy" decoding="async"`. Remove the inline `style`, because the CSS at `pim-layout.css:2066` already sizes it.
- Header: the uploaded logo branch adds `width`/`height` from `$displayPageHeaderLogo.width/.height` when present. The fallback branch uses `pim-logo.png?v=20261127`, `width="W" height="240"`, and the same alt expression as the uploaded branch.
- headerHead: replace the two `favicon.png` links with the marked block, guarded by `{if !$currentContext || !$currentContext->getLocalizedFavicon()}`.

- [ ] **Step 4: Run the harnesses**

Run: `php tools/qa/brand-templates.php; php tools/qa/journal-sidebar.php; php tools/qa/journal-announcements.php; php tools/qa/journal-homepage.php`
Expected: all `PASS`.

- [ ] **Step 5: Commit**

```bash
git add plugins/themes/pustakaMinang/templates/frontend/components tools/qa/brand-templates.php
git commit -m "Use the PIM brand logo in the footer and fallbacks and serve a real favicon"
```

---

## Phase B: backend and middleware bugs

### Task 4: Signed-out `/{journal}/dashboard` redirects to login instead of HTTP 500 (B1)

**Files:**
- Modify: `lib/pkp/pages/dashboard/PKPDashboardHandler.php` (`authorize()`, the `!$this->dashboardPage` branch)
- Modify: `lib/pkp/classes/core/PKPPageRouter.php` (`getHomeUrl()` guards a null user)
- Create: `tools/qa/live-routes.sh` (curl status matrix; reused in Task 12)

- [ ] **Step 1: Write `tools/qa/live-routes.sh [base]`.** For each of `mbj mcj mcsj mmj mpj`, request `index about about/editorialMasthead about/submissions issue/archive issue/current search login user/register dashboard`, and also `index/index index/login`. Print `path status redirect`. Exit 1 if any status is 5xx, or if `dashboard` is not a 302 whose Location contains `/login?source=`.
- [ ] **Step 2: Run it on production and record the failure.** Run `bash tools/qa/live-routes.sh https://journal.pustakainspirasi.com/index.php`. Expected: exit 1, with `<j>/dashboard 500` for all five journals.
- [ ] **Step 3: Implement.** In `authorize()`, when `!$this->dashboardPage`, call `\PKP\security\Validation::redirectLogin()` if `!$request->getUser()`, otherwise call `redirectHome($request)` as before. In `getHomeUrl()`, return `$request->url(null, 'index')` when `Auth::user()` is null. Mark both with a `// PIM 20261127:` comment that names the bug.
- [ ] **Step 4: Lint.** Run `php -l` on both files. Expected: no syntax errors. Live proof happens in Task 12 (no local OJS database exists).
- [ ] **Step 5: Commit.** Commit with the message "Redirect signed-out dashboard visits to login instead of failing with HTTP 500".

### Task 5: Backend shell is usable on phones (B2, B3)

**Files:**
- Create: `plugins/themes/pustakaMinang/styles/pim-backend.css`
- Modify: `plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php`, adding `addStyle('pustaka-minang-backend', 'styles/pim-backend.css?v=20261127-1', ['contexts' => 'backend'])` in `init()`
- Create: `tools/qa/backend-mini-audit.js` (the in-page checker used during planning: overflow, clipped, small targets, names, contrast, with screen-reader elements excluded)
- Modify: `tools/qa/backend-bundle-version.php`, to also assert the backend style registration

**Rules (inside `@media (max-width: 56rem)` unless noted):**
- `.DialogContent [data-cy="sidemodal-header"]` and its descendant flex rows: `flex-wrap: wrap; min-width: 0`. The title block takes 100% width, the action buttons wrap below with `gap: 8px`, and no button leaves the viewport.
- `.DialogContent .min-w-fit` → `min-width: 0`. The workflow body row → `flex-direction: column`. The 16rem side-menu wrapper → `width: 100%; max-height: 40dvh`, scrolling internally. The content column → `min-width: 0; width: 100%`.
- Dashboard: the gap between the page title and the toolbar is no more than 16 px.
- All widths: the focused skip link reaches at least 4.5:1 (white text and a white 2 px outline on the header).

- [ ] **Step 1: Record the baseline in the signed-in browser pane, read-only.** Inject `backend-mini-audit.js` at 390x844, 768x1024 and 1440x900 on `mbj/dashboard/editorial`, workflow 113 `publication_issue`, workflow 113 `review`, `management/settings/context` and `management/settings/access`. Expected at 390: an overflow finding on the workflow header actions (105 px).
- [ ] **Step 2: Write `pim-backend.css` and register it.**
- [ ] **Step 3: Verify before deploy.** Inject the CSS into the same tab as a `<style>`, which affects only that tab, and re-run the audit at the three widths. Expected: `hOverflowPx` 0 and no overflow findings, with Preview/Activity Log/Library and Schedule For Publication reachable without horizontal scroll. The menu sits above the content at 390.
- [ ] **Step 4: Run the harness.** Run `php tools/qa/backend-bundle-version.php`. Expected: PASS.
- [ ] **Step 5: Commit.** Commit with the message "Make the editorial workflow modal and dashboard usable on phones".

### Task 6: Asset caching and baseline security headers (M1)

**Files:** Modify `.htaccess`, adding blocks above the cPanel-generated handler comment.

**Rules:**
- `mod_expires`: CSS and JavaScript get 30 days. PNG, JPEG, WebP, SVG, ICO and WOFF2 get 7 days. HTML gets 0.
- `mod_headers`: `X-Content-Type-Options "nosniff"` and `Referrer-Policy "strict-origin-when-cross-origin"`.
- Every asset changed in this release has a versioned URL, so 30 days is safe.

- [ ] **Step 1: Check syntax locally.** Confirm the `<IfModule>` open and close counts are equal. Live proof is in Task 12: `curl -I` shows `max-age` and `nosniff`.
- [ ] **Step 2: Commit.** Commit with the message "Send cache lifetimes for versioned assets and baseline security headers".

## Phase C: public shell redesign (spec §4b), CSS-first on existing markup

Shared verification for Tasks 7-10:
- `REPLAY`: `node tools/qa/replay-live.cjs <scratch>/replay <urls>`. It saves live HTML with the theme `pim-layout.css`, `custom.css` and `pim-ui.js` URLs rewritten to working-tree `file:///` URLs.
- `AUDIT`: `node C:/Users/ptaap/.claude/skills/ui-ux-layout-standards/scripts/run_layout_audit.mjs <files> --viewports 320,360,390,768,1024,1440 --stress text,longword --focus --screenshots --out <dir>`
- URLs: `index.php/index`, `index.php/index/login`, `index.php/mbj/index`, `index.php/mbj/about`, `index.php/mbj/about/editorialMasthead`, `index.php/mbj/about/submissions`, `index.php/mbj/issue/archive`, `index.php/mbj/search`.
- Pass, applied to each task's pages:
  - Default and `+text` passes: zero `page-h-overflow`, `box-spill-x`, `text-collision`, `focus-obscured`, `img-distorted`, `contrast` and `name-missing`.
  - `control-overlap` is allowed only when one side is `.pim-mobile-tools-bar`.
  - `+longword` passes: zero `page-h-overflow` with a culprit inside theme chrome (`.pim-topbar`, `.pim-header`, `.footer`, `#pimJournalMenuPanel`, `#directoryResultsHeader`).
  - Screenshots are inspected at 390 and 1440 against §4b.

### Task 7: Tokens, typography and chrome (topbar, header, buttons, footer, focus): D1, D3, D7

**Files:**
- Create: `tools/qa/replay-live.cjs`
- Modify: `plugins/themes/pustakaMinang/styles/pim-layout.css`. Append `/* === PIM design system v2 (spec 4b) === */` with the `--pim2-*` tokens and the chrome rules, keeping earlier rules.
- Modify: `plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl`, removing the serif kicker so the mission line is plain text

- [ ] **Step 1: Record the baseline.** Run REPLAY + AUDIT and save the red counts.
- [ ] **Step 2: Implement the tokens and chrome per §4b.**
  - At ≤ 480 px the site-level hamburger (`#navToggle`) sits on the brand row at the right inset, with a 44x44 hit area.
  - Primary buttons (`.btn-publish`, `.pim-journal-submit`, `.cmp_button`, `.pkp_button_primary`) use crimson.
  - Every gold text colour becomes `--pim2-gold-ink`.
  - D7 guards: `overflow-wrap: anywhere` on chrome text and `min-width: 0` on chrome flex children.
- [ ] **Step 3: Verify.** Run REPLAY + AUDIT. Expected: the pass conditions hold for chrome selectors on all 8 pages, and the screenshots match §4b.
- [ ] **Step 4: Commit.** Commit with the message "Introduce the PIM v2 design tokens and a clean, accessible public header and footer".

### Task 8: Portal directory (intro band, covers, true subjects, count-aware sections): D2, D4

**Files:**
- Modify: `plugins/themes/pustakaMinang/templates/frontend/pages/indexSite.tpl`
  - intro band above `#journalDirectory`
  - card thumb prefers `homepageImage` and falls back to `journalThumbnail` (`:103-110`)
  - `aria-label="Find a journal"` on `#journalFinder` (`:31`)
  - subjects (`:55-59`, `:452-457`, `:506-520`) wrapped in `/* pim-subjects:start */ … /* pim-subjects:end */`
  - Active Filters card `id="activeFiltersCard" hidden`, toggled where the chips render (`:615-640`)
  - letter headings hidden when only one group exists
  - Featured Articles hidden until at least one article renders
  - issue lookup timeout 8000 ms, with an AbortError message "Issue status is temporarily unavailable."
- Modify: `plugins/themes/pustakaMinang/styles/pim-layout.css` (the portal part of v2)
- Create: `tools/qa/fixtures/portal-journals.json`, `tools/qa/portal-subjects.cjs`, `tools/qa/portal-cards.php`

- [ ] **Step 1: Write the failing tests.**
  - `portal-subjects.cjs` evaluates the marked block in `node:vm`:
  ```js
  assert.deepEqual(Object.keys(subjectKeywords), ['life', 'physical', 'formal']);
  assert.deepEqual(templateButtons, [['life','Life Sciences'], ['physical','Chemistry &amp; Physics'], ['formal','Mathematics &amp; Computing']]);
  expectOnly('Minang Bioscience Journal (MBJ)', 'life');
  expectOnly('Minang Chemistry Journal (MCJ)', 'physical');
  expectOnly('Minang Physics Journal (MPJ)', 'physical');
  expectOnly('Minang Mathematics Journal (MMJ)', 'formal');
  expectOnly('Minang Computer Science Journal (MCSJ)', 'formal');
  assert.equal(matches({subjectSearch: 'journal of biochemistry teaching'}, 'physical'), false);
  ```
  - `portal-cards.php` renders the card-thumb snippet through Smarty. A journal with `homepageImage` gives src `…/1/homepageImage_en.png`. With only `journalThumbnail`, the src is the thumbnail. With neither, the placeholder renders.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement the template changes and the §4b portal styles.**
  - Keywords: `life: ['bioscience','biology','biological','biodiversity','ecology','biotechnology']`, `physical: ['chemistry','chemical','physics']`, `formal: ['mathematics','mathematical','computer science','computing','informatics']`. Every term is matched as a whole word.
  - The toolbar wraps at ≤ 600 px. Sort buttons are `white-space: nowrap; min-width: 2.75rem`. Directory tracks are `minmax(0, 1fr)`.
- [ ] **Step 4: Verify.** Both tests PASS, and REPLAY + AUDIT passes on the portal (CSS). The template behaviour is checked live in Task 12.
- [ ] **Step 5: Commit.** Commit with the message "Redesign the portal directory with covers, true subjects and count-aware sections".

### Task 9: Journal home (hero, facts table, issues, rails): D5, D6

**Files:**
- Modify: `plugins/themes/pustakaMinang/templates/frontend/pages/indexJournal.tpl:200-252`. Replace the inline scraper with `<section class="pim-past-issues" id="pim-popular-issues-container" data-pim-past-issues data-archive-url="{url router=$smarty.const.ROUTE_PAGE page="issue" op="archive"}" data-fallback-cover="{$baseUrl}/default_journal_issue_cover.png" hidden><h2>Past Issues</h2><div class="pim-issues-grid"></div></section>`.
- Modify: `pim-ui.js`, adding `window.PIM.renderPastIssues(container, archiveHtml, {limit = 4} = {}): number` and auto-init for `[data-pim-past-issues]`.
- Modify: `plugins/themes/pustakaMinang/styles/pim-layout.css` (the journal part of v2, plus the widget image rule at `:3544`)
- Create: `tools/qa/journal-past-issues.cjs` (Playwright via `PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright`)

**Interfaces:** `renderPastIssues` skips the first `.obj_issue_summary`, appends at most `limit` `.pim-issue-card` elements built with `createElement`/`textContent`, sets `container.hidden = count === 0` and returns the count.

- [ ] **Step 1: Write the failing test.**
  - 1 summary → `hidden === true` and 0 cards.
  - 3 summaries → `hidden === false`, and 2 cards with titles 2 and 3 each linking to their href.
  - A title of `<img src=x onerror="window.__xss=1">Vol 2` leaves `window.__xss` undefined and shows the text literally.
- [ ] **Step 2: Run it and confirm it fails** (`window.PIM` undefined).
- [ ] **Step 3: Implement the JS, the template and the §4b journal styles.**
  - D5: at ≤ 992 px, `html:has(body.pim_public_journal) { scroll-padding-bottom: calc(54px + env(safe-area-inset-bottom, 0px) + 16px) }`.
  - D6: widget images get `width: auto; height: auto; max-width: 100%; object-fit: contain`.
  - The issue card hover is `translateY(-2px)` with the §4b motion, and does not move under reduced motion.
- [ ] **Step 4: Verify.** `journal-past-issues.cjs` and `journal-homepage.php` PASS, and REPLAY + AUDIT passes on the `mbj/*` pages.
- [ ] **Step 5: Commit.** Commit with the message "Redesign the journal home and render past issues only when they exist".

### Task 10: Content and account pages (prose, tables, forms, login and register)

**Files:** Modify `plugins/themes/pustakaMinang/styles/pim-layout.css`, adding a v2 prose and forms section scoped to `.pkp_structure_main` and `body.pim_account_page`.

- [ ] **Step 1: Record the baseline.** Run REPLAY + AUDIT on about, masthead, submissions, archive, search and login, plus `mbj/user/register` and `index/login/lostPassword`.
- [ ] **Step 2: Implement the §4b prose and forms.**
  - Labels above inputs. Inputs, selects and buttons are 44 px high.
  - Submit buttons are crimson primary.
  - The account card is max 440 px and centred.
  - Tables use hairline rows. Long URLs and e-mail addresses wrap.
- [ ] **Step 3: Verify.** The shared pass conditions hold, and the login, register and lost-password screenshots match §4b.
- [ ] **Step 4: Commit.** Commit with the message "Apply the v2 typography and form system to content and account pages".

## Phase D: release

### Task 11: Packaging, full QA, documentation

**Files:**
- Modify: `PustakaMinangThemePlugin.php` (`pim-layout.css?v=20261127-1`), `footer.tpl` (`pim-ui.js?v=20261127-1`), `.cpanel.yml` (every runtime path below)
- Create: `docs/PIM_PUBLISH_BRAND_UX_20261127.md`. Cover the changes and reasons, the re-apply notes for the core patches after OJS upgrades, the data recommendations for managers, the verification record, and a client summary in Indonesian.

- [ ] **Step 1: Run every check.** Run all `tools/qa` checks, then REPLAY + AUDIT on all 8 pages. Expected: all PASS.
- [ ] **Step 2: Build the payload.** Run `git archive --format=zip -o <scratch>/PIM-release-20261127.zip HEAD -- .htaccess js/build.js logo.png favicon.ico pim-ui.js lib/pkp/pages/dashboard/PKPDashboardHandler.php lib/pkp/classes/core/PKPPageRouter.php plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php plugins/themes/pustakaMinang/styles plugins/themes/pustakaMinang/images plugins/themes/pustakaMinang/templates` and record the SHA256. Expected: only those paths, and `js/build.js` at 3049775 + 29 bytes with LF line endings.
- [ ] **Step 3: Commit.** Commit the version bump, manifest and docs.

### Task 12: Production deployment and live verification (user confirmation required)

- [ ] **Step 1: Confirm and check for drift.** Get the user's confirmation and check that cPanel is signed in. Do not enter credentials. Compare the live `.htaccess`, `PKPPageRouter.php` and `PKPDashboardHandler.php` with the repository base, and stop on unexpected drift.
- [ ] **Step 2: Back up.** Copy every payload path to `/home/pusf3964/pim-backup-20261127/`.
- [ ] **Step 3: Install.** Extract the payload into the document root. Expected: the report lists only payload paths. Back up `public/site/pageHeaderTitleImage_en.png`, then overwrite it with `tools/brand/out/pageHeaderTitleImage_en.png` (same name, same aspect ratio).
- [ ] **Step 4: Clear the template cache.**
- [ ] **Step 5: Check the public site.**
  - `live-routes.sh` exits 0.
  - The patched `build.js` is served at the new URL.
  - The favicon and logo return 200.
  - The cache and security headers are present.
  - The live AUDIT meets the Phase C conditions.
  - The portal shows covers, three subjects and hidden idle filters. The MBJ footer shows the PIM logo.
- [ ] **Step 6: Check the signed-in backend (read-only).** `backend-mini-audit.js` shows no overflow at 390/768/1440.
- [ ] **Step 7: Check publishing with the client.** A Section Editor sees "Schedule For Publication" on MBJ 113. A recommend-only assignment does not. Yeni sees it. After scheduling, the article appears in `issue/view/13` and in the portal Latest Issues.
- [ ] **Step 8: Recover if anything fails.** Restore the backup, clear the cache and re-read.

### Task 13: Run the OJS scheduler from cron (user confirmation required): M2

**Files:** production `config.inc.php` only. Back it up to `/home/pusf3964/pim-backup-20261127/config.inc.php` first.

- [ ] **Step 1: Measure the baseline.** Run three cycles of request, repeat, then 75 s idle. Expected: first ≈ 1.1 s, repeat ≈ 0.2 s.
- [ ] **Step 2: Inspect, read-only.** Check the runner settings, `error_log`, the scheduled-task logs and Administration → Jobs.
- [ ] **Step 3: Switch to cron after confirmation.** Add the cPanel cron `* * * * * /usr/local/bin/ea-php82 /home/pusf3964/public_html/journal.pustakainspirasi.com/lib/pkp/tools/scheduler.php run >/dev/null 2>&1`, at the shortest interval allowed. Then set `job_runner = Off`, `process_jobs_at_task_scheduler = On` and `task_runner = Off`.
- [ ] **Step 4: Verify.** The first request after 75 s idle is under 0.5 s, task timestamps keep advancing, Jobs drains, and a test e-mail is delivered.
- [ ] **Step 5: Recover if needed.** Restore `config.inc.php` and remove the cron.
