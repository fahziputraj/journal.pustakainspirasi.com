# PIM Search UI (menu, dock and search page) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Searching a journal should take one step from the menu and the dock, and the `/search` page should read as a designed search experience, not as the default OJS form.

**Architecture:** Progressive enhancement in `pim-ui.js` plus v2 CSS, with no template changes.
- The OJS search markup (`form.cmp_form`, `.search_input`, `fieldset.search_advanced`, `.submit`, `ul.search_results`, `.cmp_notification`) stays the submission contract.
- The dock Search link keeps its `href` as the no-JS fallback.

**Tech Stack:** vanilla JS, `pim-v2.css` (`--pim2-*` tokens), Playwright with the installed Chrome, and the layout auditor plus `audit-gate.cjs`.

## Design critique (live `/mbj/search`, 27 Nov)

| Finding | Severity | Recommendation |
|---|---|---|
| The keyword field and the Search button are separated by the whole filter block. The primary action sits at the bottom right, under the filters. | 🔴 | Put the field and the button on one row: a 48 px field with a magnifier glyph and the button attached. |
| The date selects look empty because their Year/Month/Day labels are visually hidden, and they sit in the right half with nothing on the left. | 🔴 | Show small labels above each select in an even three-column grid, From and To side by side on desktop and stacked on phones. |
| Filters are always expanded, although most visitors only type a keyword. | 🟡 | Move the filters into "Refine results" (`<details>`), open automatically when any filter has a value. |
| The labels "ADVANCED FILTERS", "PUBLISHED AFTER" and "SEARCH" are all caps. | 🟢 | Use sentence case and the v2 label style. |
| "No Results" shows before anything has been searched, as a grey bar with a blue rule. | 🟡 | Before a query, show a helper line. With a query and no hits, say "No articles match "x"" plus one hint. Use a neutral bordered surface. |
| Search is a page away from the menu and the dock. | 🟡 | Desktop: a compact "Search this journal" field at the top of the Journal Menu. Phones: the dock Search item opens a Search sheet with the field focused. |

Design read: preserve mode, trust-first; dials 3/3/5. Active and current states stay tonal, with no side bars.

## Global Constraints

- Branch `fix/pim-publish-brand-ux-20261127`. Versions: `pim-v2.css?v=20261127-4` and `pim-ui.js?v=20261127-3`.
- Form field names (`query`, `authors`, `dateFrom*`, `dateTo*`) and the form action are never changed.
- The quick-search form submits GET to `<journal>/search/search` with `query`, derived from the menu Search link `href` + `/search`.
- Copy: "Search this journal", "Search", "Refine results", "Published after", "Published before", "Author", "Search titles, abstracts and authors in this journal.", `No articles match "<q>".`, "Try fewer or different words.".
- Deploy only with backup and user confirmation.

## Review Focus

1. A query containing `<`, `"` or `&` is shown as text in the empty-state message (`escapedQuery`).
2. A filter value that is already set (for example `dateFromYear=2026`) opens "Refine results" on load (`filtersOpen`).
3. The Search sheet traps focus and Escape returns focus to the dock item (`searchSheetFocus`).
4. Without JS, the dock link still navigates to `/search` (the link `href` is unchanged, checked in `dockSearchFallback`).
5. Long queries or author names do not overflow at 320 px (AUDIT `+longword`).

### Task 1: Search page enhancement and styles

**Files:** `pim-ui.js` (add `window.PIM.enhanceSearchPage(root): void`, run on `body.pkp_page_search`), `pim-v2.css`, and `tools/qa/journal-search.cjs` (new Playwright fixture built from the live search markup).

- [ ] **Step 1: Write the failing tests.**
  - `layout`: the `.search_input` and `.submit` rows share the same top ±4 px at 1280.
  - `labels`: the date labels are visible (width > 0, not clipped) and read Year/Month/Day.
  - `filtersClosed`: with no filters set, `details.pim-search-filters` is closed.
  - `filtersOpen`: with `dateFromYear` preselected, it opens.
  - `emptyBefore`: with an empty query, the notice reads the helper copy.
  - `emptyAfter`: with query `betel` and no hits, the notice reads `No articles match "betel".`
  - `escapedQuery`: a query of `<b>x</b>` renders literally, with no `<b>` element created.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement `enhanceSearchPage` and the CSS.** Use a form grid with areas `input button` / `filters filters`, the `details` wrapper, visible date labels, the results card style for `.obj_article_summary`, and the neutral notice.
- [ ] **Step 4: Run and confirm they pass.** Then commit.

### Task 2: Quick search in the menu and the dock

**Files:** `pim-ui.js` (a `buildQuickSearch()` menu field, a Search sheet panel `#pimJournalSearchPanel`, and the `search` tab added to the tools state) and `tools/qa/journal-tools.cjs` (new cases).

- [ ] **Step 1: Write the failing tests.**
  - `menuSearch`: at 1280, the Journal Menu contains `form.pim-menu-search[action$="/mbj/search/search"]` with `input[name=query]` and an accessible label.
  - `dockSearchSheet`: at 390, clicking the dock Search opens a sheet titled "Search", the input is focused and `aria-expanded="true"`.
  - `searchSheetFocus`: Tab stays inside the sheet and Escape returns focus to the dock Search item.
  - `dockSearchFallback`: the dock Search item still has `href` ending `/mbj/search`.
- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** The dock Search keeps being an `<a>`; JS intercepts the click below 993 px only.
- [ ] **Step 4: Run all `journal-tools.cjs` cases and confirm they pass.** Then commit.

### Task 3: Verify, release, record

- [ ] **Step 1: Verify on replays.** Run REPLAY + AUDIT on `mbj/search`, `mbj/search/search?query=betel`, `mbj/index` and `mcj/index`, then `audit-gate.cjs`. Expected: PASS. Inspect screenshots at 390 and 1440.
- [ ] **Step 2: Run the full `tools/qa` suite.** Expected: PASS.
- [ ] **Step 3: Release.** Bump the versions, back up the 4 live files to `…/pim-backup-20261127/search/`, and deploy `pim-ui.js`, `pim-v2.css`, `PustakaMinangThemePlugin.php` and `footer.tpl`.
- [ ] **Step 4: Verify live and record.** Run the live checks, append the result to `docs/PIM_PUBLISH_BRAND_UX_20261127.md`, commit and push to PR #3.
