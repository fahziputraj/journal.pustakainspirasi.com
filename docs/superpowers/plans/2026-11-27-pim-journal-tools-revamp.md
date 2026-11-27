# PIM Journal Tools Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mobile "Journal Tools" bar and floating drawer with a single four-item dock and a bottom sheet. Turn the long information rail into collapsible sections on mobile and desktop.

**Architecture:** Progressive enhancement on the existing markup and state machine in `pim-ui.js`. The body classes `pim-tools-open` and `pim-tools-tab-menu|links` stay, as do the focus trap and Escape handling. The template changes are limited to the bar markup in `header.tpl`. The rail sections are built in JS from the OJS blocks, so no stored content changes. Styles go in the v2 layer.

**Tech Stack:** Smarty (OJS 3.5.0.4 theme), vanilla JS, CSS (`pim-v2.css`), Playwright via `PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright` with the installed Chrome, and the ui-ux-layout-standards auditor plus `tools/qa/audit-gate.cjs`.

**Spec:** `docs/superpowers/specs/2026-11-27-pim-journal-tools-design.md`

## Global Constraints

- Work continues on branch `fix/pim-publish-brand-ux-20261127`.
- Asset versions: `pim-v2.css?v=20261127-2` and `pim-ui.js?v=20261127-2`.
- Use only the `--pim2-*` tokens. Dock items are at least 44x44 px. The motion is `transform` only, 200 ms `cubic-bezier(0.16, 1, 0.3, 1)`, and none under `prefers-reduced-motion`.
- OJS block HTML, links and their order stay the same. The only display change is stripping a leading and trailing `::` from section titles.
- Desktop rule from 13 Oct stays: the left Journal Menu has no nested scrollbar.
- Copy (English): "Menu", "Information", "Search", "Submit", "Journal menu", "Journal information", "Close". No em-dashes.
- Deploy only after the user confirms, with backups in `/home/pusf3964/pim-backup-20261127/tools/`.

## Review Focus

1. Keyboard users: Tab stays inside the open sheet, Escape closes it, and focus returns to the dock item that opened it. Covered by Task 2 test `focusReturn`.
2. A journal with no sidebar blocks: the Information item stays hidden and the dock lays out three items without gaps. Covered by Task 2 test `noSidebar`.
3. A block whose only heading is inside its content, such as custom block HTML: it must not lose its heading or get two. Covered by Task 3 test `customHeading`.
4. Rotating or resizing from mobile to desktop while the sheet is open: the sheet closes, the body scroll lock is released, and the rail shows normally. Covered by Task 2 test `resizeClose`.
5. Very long block titles or link text: no horizontal overflow in the dock, the sheet or the summaries. Covered by Task 4 AUDIT with `+longword`.

---

### Task 1: Dock markup in `header.tpl`

**Files:**
- Modify: `plugins/themes/pustakaMinang/templates/frontend/components/header.tpl` (the `.pim-mobile-tools-bar` block)
- Create: `tools/qa/journal-dock-markup.php` (Smarty render of the bar snippet)

**Interfaces:**
- Produces: `nav.pim-mobile-tools-bar[aria-label="Journal tools"]` containing four children in this order:
  - `button[data-pim-tools-tab="menu"][aria-controls="pimJournalMenuPanel"][aria-expanded="false"]`
  - `button[data-pim-tools-tab="links"][aria-controls="pimJournalLinksPanel"][aria-expanded="false"]`
  - `a.pim-dock-search[href=search]`
  - `a.pim-dock-submit[href=about/submissions]`

  Each child is a `.pim-dock-item` holding `<i aria-hidden="true">` and `<span>`. `#pimMobileToolsToggle` and `role="tablist"`/`role="tab"` are removed.

- [ ] **Step 1: Write the failing test.** Extract the bar snippet and render it with stub `url` (`/mbj/<page>/<op>`). Assert:
  - there are exactly 4 `.pim-dock-item`, with labels Menu, Information, Search, Submit
  - the Search href is `/mbj/search` and the Submit href is `/mbj/about/submissions`
  - there is no `pimMobileToolsToggle` and no `role="tab"`
- [ ] **Step 2: Run and confirm it fails.** Run `php tools/qa/journal-dock-markup.php`. Expected: FAIL.
- [ ] **Step 3: Replace the bar markup.**
- [ ] **Step 4: Run and confirm it passes.** Run `php tools/qa/journal-dock-markup.php`, `php tools/qa/journal-announcements.php` and the compile check. Expected: PASS.
- [ ] **Step 5: Commit.** "Replace the mobile Journal Tools bar with a four-item dock".

### Task 2: Dock and sheet behaviour in `pim-ui.js`

**Files:**
- Modify: `pim-ui.js` (the tools section, `setMobileToolsTab`, `openMobileTools`, `closeMobileTools` and the handlers at `:145-330`)
- Create: `tools/qa/journal-tools.cjs` (Playwright; fixture page = rendered dock + a menu panel + a links panel with 3 blocks, plus local `pim-layout.css`, `pim-v2.css` and `pim-ui.js`)

**Interfaces:**
- Produces:
  - Tapping a dock button with the sheet closed opens it on that panel. Tapping the same button again closes it. Tapping the other button switches panels.
  - `aria-expanded` mirrors the state on both buttons.
  - Each panel gets one injected `.pim-sheet-head` holding an `h2` (title) and `button.pim-sheet-close[aria-label="Close"]`.
  - `closeMobileTools()` returns focus to the dock button that opened the sheet.

- [ ] **Step 1: Write the failing test** at 390x844 with these cases:
  - `openMenu`: click Menu, then `body.pim-tools-open`, `aria-expanded="true"`, the menu panel is visible, and `.pim-sheet-head h2` reads "Journal menu".
  - `toggleClose`: click Menu again, then the sheet is closed.
  - `switch`: open Menu, click Information, then the links panel is visible and the Menu button has `aria-expanded="false"`.
  - `closeButton`: with the sheet open, click `.pim-sheet-close`. The sheet closes and focus is on the opener.
  - `focusReturn`: open with the keyboard (Enter), Tab 30 times and confirm focus never leaves the panel, then press Escape and confirm focus is on the opener.
  - `noSidebar`: a fixture without the links panel hides the Information item, and the remaining 3 items fill the dock width.
  - `resizeClose`: with the sheet open at 390, resize to 1280. Then `pim-tools-open` is removed and body overflow is reset.
- [ ] **Step 2: Run and confirm it fails.** Run `node tools/qa/journal-tools.cjs`. Expected: FAIL `openMenu`.
- [ ] **Step 3: Adapt the state machine.** Remove the toggle-specific code and keep the existing focus trap. Insert the sheet head once per panel.
- [ ] **Step 4: Run and confirm it passes.** Run `node tools/qa/journal-tools.cjs`. Expected: PASS.
- [ ] **Step 5: Commit.** "Open journal panels from the dock as a closable bottom sheet".

### Task 3: Collapsible rail sections (mobile and desktop)

**Files:**
- Modify: `pim-ui.js`, adding `window.PIM.buildRailSections(panel, {open = 2} = {}): number`, which runs on load for `#pimJournalLinksPanel`
- Modify: `tools/qa/journal-tools.cjs`, adding the cases below

**Interfaces:**
- Produces: each `.pkp_block` that has a title (`.title`, or the first `h2`/`h3`/`h4` that is a direct heading) is wrapped as `details.pim-rail-section > summary.pim-rail-summary + div.pim-rail-body`. The first `open` sections get `open`. The function returns the number of sections. A title whose text matches `/^\s*::\s*(.*?)\s*::\s*$/` shows the inner text.

- [ ] **Step 1: Write the failing tests.**
  - `sections`: 3 blocks give 3 `details` elements, the first 2 open, with all original links still present in order.
  - `decoration`: the title ":: PEOPLE ::" is shown as "PEOPLE", and the `<a>` inside is untouched.
  - `customHeading`: a block whose heading sits inside its content has exactly one heading, which becomes the summary.
- [ ] **Step 2: Run and confirm they fail.**
- [ ] **Step 3: Implement `buildRailSections`.** It is idempotent: a second call returns the same count and creates no nested `details`.
- [ ] **Step 4: Run and confirm they pass.** Run `node tools/qa/journal-tools.cjs`. Expected: PASS.
- [ ] **Step 5: Commit.** "Group the journal information rail into collapsible sections".

### Task 4: Visual system for dock, sheet and rails

**Files:**
- Modify: `plugins/themes/pustakaMinang/styles/pim-v2.css`, adding a section `/* journal tools v2 (spec 2026-11-27-pim-journal-tools-design) */`
- Modify: `PustakaMinangThemePlugin.php` (v2 to `20261127-2`) and `footer.tpl` (`pim-ui.js?v=20261127-2`)

- [ ] **Step 0: Write the failing active-state assertion.** Add a `journal-tools.cjs` case `activeState`. On the menu item for the current page at 390 and at 1440, the computed `box-shadow` is `none`, `border-left-width` is `0px` and `background-color` equals `rgb(251, 239, 239)`. On the active dock item, the `.pim-dock-item i` indicator background is the same colour and there is no top border. The header template marks the current item with `aria-current="page"` alongside `is-active`.
- [ ] **Step 1: Implement the spec component rules.** Remove the v2 rule `.pim-journal-tools-panel a.is-active { box-shadow: inset 3px 0 0 … }` and any inherited left border from `pim-layout.css`. Cover the dock grid, active bar, sheet radius, handle, header, backdrop at ink 45%, the slide-in, the summary chevron and focus ring, the desktop rail heading style and the icon column.
- [ ] **Step 2: Verify.** Render the fixture pages from Task 2, plus REPLAY of `mbj/index`, `mbj/about` and `mbj/issue/archive` (CSS only), then AUDIT at 320, 360, 390, 768, 1024 and 1440 with `--stress text,longword --focus`, then `node tools/qa/audit-gate.cjs`. Expected: PASS. Inspect screenshots at 390, sheet open and closed, and at 1440.
- [ ] **Step 3: Run the full QA.** Run all `tools/qa` harnesses (Tasks 1-3 plus the existing ones). Expected: all PASS.
- [ ] **Step 4: Commit.** "Style the journal dock, bottom sheet and rail sections with v2 tokens".

### Task 5: Release (user confirmation required)

- [ ] **Step 1: Build the payload.** Run `git -c core.autocrlf=false archive` of `header.tpl`, `footer.tpl`, `pim-ui.js`, `pim-v2.css` and `PustakaMinangThemePlugin.php`, and record the SHA256.
- [ ] **Step 2: Back up.** Copy the 5 live paths to `/home/pusf3964/pim-backup-20261127/tools/`.
- [ ] **Step 3: Install.** The user uploads the zip, then extract it. Expected: exactly 5 paths.
- [ ] **Step 4: Verify live.** Run the live AUDIT gate on the 8 pages, check the dock and sheet in the browser pane at 375 (open, switch, close, Escape) and at 1440 (rail sections), and run `live-routes.sh`.
- [ ] **Step 5: Record and commit.** Add the result to `docs/PIM_PUBLISH_BRAND_UX_20261127.md` and commit.
