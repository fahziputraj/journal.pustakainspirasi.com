# PIM release 2026-11-27: publish permission, brand, backend and public shell

Spec: `docs/superpowers/specs/2026-11-27-pim-journal-requests-design.md`
Plan: `docs/superpowers/plans/2026-11-27-pim-journal-publish-brand-ux.md`
Branch: `fix/pim-publish-brand-ux-20261127`

## What changed and why

| Area | Change | Reason (client request or finding) |
|---|---|---|
| Publishing | `js/build.js`: the production-stage `canPublish` role list now includes `ROLE_ID_SUB_EDITOR`; recommend-only assignments stay excluded. The theme serves it as `js/build.js?v=3.5.0.4-pim.20261127`. | R2 (26 Nov) and R3 (27 Nov): Section Editors and Yeni (MBJ Editor in Chief) had no "Schedule For Publication" button. In OJS 3.5.0.4 the UI only allowed managers and site admins, while the API already allows Section Editors. |
| Brand | Transparent corrected logo (`images/pim-logo.png`, 65 KB), root `logo.png` (typo fixed, 448 KB instead of 1 MB), `favicon.ico` (16/32/48), `favicon-32.png`, `apple-touch-icon.png`; footer always shows the PIM logo; uploaded journal favicons are respected. | R1 (18 Nov): "ISNPIRASI" typo; `favicon.png` returned 404; the footer showed the journal logo under "PIM Journal Portal". |
| Router | Signed-out `/{journal}/dashboard` redirects to login with `source` (`PKPDashboardHandler`, `PKPPageRouter::getHomeUrl`). | B1: HTTP 500 with an empty page on all five journals. |
| Backend shell | `styles/pim-backend.css` (backend context only): the submission workflow modal works on phones; tab and dropzone text contrast. | B2/B3: at 390 px the title collapsed to one word per line and Preview, Library and Schedule For Publication were off-screen. |
| Middleware | `.htaccess`: explicit cache lifetimes for static assets, `X-Content-Type-Options: nosniff`, `Referrer-Policy`. | M1: no cache headers, so stale bundles survived deployments. |
| Public shell | `styles/pim-v2.css` design system v2 (one sans family, crimson primary actions, contrast-safe gold ink `#8A6418`, hairline cards, sentence-case navigation, responsive guards). | User request: clean international-journal look; D1-D7 audit defects. |
| Portal | True subjects (Life Sciences; Chemistry & Physics; Mathematics & Computing) with whole-word matching; covers in cards; Active Filters, letter heading and Featured Articles only when meaningful; issue lookups escaped and given 8 s. | The copied GPI subjects put 4 of 5 science journals under "Education & Social Sciences"; cross-page titles were inserted as HTML. |
| Journal home | Past issues rendered by `window.PIM.renderPastIssues` only when the archive has more than the current issue. | An empty "Popular & Past Issues" heading sat over a large blank area. |

Deviation from the plan: the v2 layer lives in its own `pim-v2.css` (loaded after `pim-layout.css`) instead of being appended to the 377 KB file, and the footer serif kicker is hidden by CSS instead of a template edit.

## Re-apply after any OJS upgrade

1. `js/build.js`: insert `,pkp.const.ROLE_ID_SUB_EDITOR` after `pkp.const.ROLE_ID_MANAGER` in the `canPublish` condition. Then run `node tools/qa/workflow-publish-permission.cjs` and bump `PustakaMinangThemePlugin::BACKEND_BUNDLE_VERSION`.
2. `lib/pkp/pages/dashboard/PKPDashboardHandler.php` and `lib/pkp/classes/core/PKPPageRouter.php`: re-apply the two `PIM 20261127` guards if upstream has not fixed the signed-out dashboard.
3. `styles/pim-backend.css` targets 3.5.0.4 ui-library markup; re-check it on a phone after upgrading.
4. `classes/issue/IssueAction.php`: keep the `PIM 20261127` subscription-mode guard in `subscribedDomain()` (reverse DNS stall). Run `php tools/qa/issue-action-dns.php`.

## Data recommendations for journal managers (not changed by code)

- Replace placeholder E-ISSN `0000-0000` values; remove ":: PEOPLE ::"-style decoration and empty "E-ISSN ONLINE"/"SEARCH" headings from custom blocks.
- Re-upload tight-cropped, optimised journal logos (MBJ is 2.3 MB) under Website → Appearance.
- Consider disabling the right-rail "Make a Submission" block; the journal menu already has the primary action.
- MBJ Vol. 1 No. 1 (2026) is published with no articles. Schedule submission 113 (now possible for Section Editors) so the issue and the portal "Latest Issues" have content.

## Verification

Local (all passing):

| Check | Command |
|---|---|
| Publish permission (8 role cases) | `node tools/qa/workflow-publish-permission.cjs` |
| Bundle cache key and backend stylesheet | `php tools/qa/backend-bundle-version.php` |
| Brand assets | `pwsh -NoProfile -File tools/qa/brand-assets.ps1` |
| Header, footer, favicon templates | `php tools/qa/brand-templates.php` |
| Portal subjects and cards | `node tools/qa/portal-subjects.cjs`, `php tools/qa/portal-cards.php` |
| Past issues (Playwright, installed Chrome) | `PLAYWRIGHT_MODULE=D:/SA/aapm-prod-portal/node_modules/playwright node tools/qa/journal-past-issues.cjs` |
| Existing harnesses | `php tools/qa/journal-sidebar.php`, `journal-announcements.php`, `journal-homepage.php` |
| Layout audit gate on live replays | `node tools/qa/replay-live.cjs <dir> <urls>`, run the ui-ux-layout-standards auditor, then `node tools/qa/audit-gate.cjs <report.json>` |

Layout audit (8 public pages plus register and lost password, 320-1440 px, text and long-word stress, focus): the blocking findings went from 131 to 0. The one remaining item, the missing `#journalFinder` name, is fixed in the template and can only be confirmed after deployment. Signed-in backend checks at 390 px were done in the browser by injecting the new CSS into one tab: 0 px horizontal overflow, and every workflow action button is visible.

Not verified locally: there is no local OJS database, so the dashboard redirect, template rendering in OJS and real Section Editor publishing are verified on production after deployment (record below). Firefox and Safari are not covered by the automated audit.

## Production record (2026-11-27)

- Source commit `9ea5020b` (branch `fix/pim-publish-brand-ux-20261127`). The payload was built with `git -c core.autocrlf=false archive` (LF, committed bytes). The optimised site logo `public/site/pageHeaderTitleImage_en.png` was added (same name, same 1672:941 ratio). Zip: 19 files, 1,708,574 bytes, SHA256 `09B8CEAADD03D780BB470CD5FE10E8598F324656E40A644DE5ED67B98771E29B`.
- Drift check before replacement: 7 of 9 text files were identical to `main`. `header.tpl` and `headerHead.tpl` appeared to differ by an injected `<meta charset="utf-8">`. A later check showed this is how cPanel `Fileman::get_file_content` returns files that contain `<head>`/`<header>`: the files on disk have the committed sizes, and the served HTML has exactly one `<meta charset>` in `<head>`. Never edit `.tpl` files through the cPanel editor or API, because a save would write the injected tag to disk.
- Backup: all 14 replaced paths were copied to `/home/pusf3964/pim-backup-20261127/` (mirrored structure, sizes verified identical, `.htaccess` included). The release zip sits in the same folder.
- Install: the cPanel Fileman extract into `/home/pusf3964/public_html/journal.pustakainspirasi.com/` listed exactly the 19 payload paths. Templates recompiled without a manual cache clear.
- Live checks:
  - Pages: portal, MBJ and login return 200 with `pim-v2.css?v=20261127-1`, `pim-ui.js?v=20261127-1`, the PIM favicon set, `<meta charset>` and `images/pim-logo.png`.
  - Portal markup: the portal shows the three new subjects (1/2/2), covers, the labelled journal finder, and no idle filter card, letter heading or empty Featured section.
  - Assets and headers: assets return 200, and `pim-v2.css` sends `Cache-Control: max-age=2592000`, `nosniff` and `Referrer-Policy`.
  - Bundle: `js/build.js?v=3.5.0.4-pim.20261127` contains the patched publish role list once.
- `tools/qa/live-routes.sh`: exit 0. All five `/{journal}/dashboard` URLs now return 302 to `/login?source=…`, with no 5xx anywhere.
- Live layout audit gate, 8 pages × 320-1440 px × text/long-word stress × focus: PASS with 0 blocking findings on every page.
- Signed-in backend at 390 px: `pim-backend.css` loads, and the bundle URL is versioned. On MBJ submission 113, Preview, Activity Log, Library and Schedule For Publication are all on-screen, with 0 px document overflow.
- Rollback: copy the paths back from `/home/pusf3964/pim-backup-20261127/`, then delete the five new files (`styles/pim-v2.css`, `styles/pim-backend.css`, and `images/pim-logo.png`, `favicon-32.png`, `apple-touch-icon.png`).

Pending: a real Section Editor account (and Yeni's) schedules MBJ 113.

## Scheduler moved to cron (2026-11-27, user-confirmed)

- Backup: `/home/pusf3964/pim-backup-20261127/config.inc.php` (20,905 bytes, identical to live before the edit).
- Cron (there were no crons before): `* * * * * cd /home/pusf3964/public_html/journal.pustakainspirasi.com && /opt/cpanel/ea-php82/root/usr/bin/php lib/pkp/tools/scheduler.php run > /home/pusf3964/pim-cron-scheduler.log 2>&1`. The first run logged `ProcessQueueJobs … DONE` before any config change.
- `config.inc.php` (only these three lines changed):
  - line 549: `job_runner = Off`
  - line 582: `process_jobs_at_task_scheduler = On`
  - line 606: `task_runner = Off`
- Result:
  - Task logs now appear once per minute at :02 from cron only. Before this, `ProcessQueueJobs` ran inside web requests, which left 6,308 log files.
  - All pages return 200.
  - First request after 75 s idle: 0.23 s, 1.12 s and 1.15 s (repeats 0.18-0.25 s). The roughly 1 s first-hit cost is therefore not the OJS runners. It matches a LiteSpeed PHP worker cold start (host-level LSAPI idle settings; ask Rumahweb support if it matters).
  - The 21-23 s outliers have not reappeared yet. Watch them over the next days.
- Rollback: restore `config.inc.php` from the backup and delete the cron line (cPanel → Cron Jobs).
- Optional housekeeping: old files in `ojs_files/scheduledTaskLogs` can be pruned.

## Journal Tools revamp (2026-11-27, user-confirmed)

Spec and plan: `docs/superpowers/specs/2026-11-27-pim-journal-tools-design.md`, `docs/superpowers/plans/2026-11-27-pim-journal-tools-revamp.md`.

What changed:
- Mobile (992 px and below): one four-item dock (Menu, Information, Search, Submit) opens the panels as a bottom sheet with a title and a Close button. Tapping the active item again closes it, Escape closes it, focus returns to the opener, and Tab is kept inside.
- The current page uses a tonal fill (`#FBEFEF`, accent text). The thick left bar was rejected by the user and removed. The dock uses a tonal pill indicator.
- The information rail becomes collapsible sections on every width (first two open). The `::` decoration is removed from display text only.

Release:
- Commit `e1b529f4`, payload of 5 files (LF), SHA256 `4da6c77e…50b79`, 25,810 bytes.
- The previous live copies are in `/home/pusf3964/pim-backup-20261127/tools/`. The extract listed exactly the 5 paths.
- Follow-up `65728a15`: the parent theme's negative `.cmp_announcements` margins overflowed 4 px at 768 on MCJ. This fix was applied in place through the cPanel editor (`pim-v2.css` and `PustakaMinangThemePlugin.php`, now `pim-v2.css?v=20261127-3`). Prior copies are in `…/tools-2/`, and the live SHA-256 matches the commit.

Verification:
- Local: `tools/qa/journal-tools.cjs` passes all 12 cases (open, toggle, switch, close button, focus trap and return, no sidebar, resize, sections, decoration, custom heading, submit fits, active state), alongside the existing harnesses.
- Live: the dock markup is served (4 items, the old toggle is gone), and `live-routes.sh` exits 0.
- Live at 375 px: the sheet opens, switches and closes with Escape, focus returns, 5 sections show (2 open), Font Awesome icons load, and there is no overflow.
- Live at 1440 px: the tonal active state is in place, the dock is hidden, the rail is 1,427 px against 1,358 px of content (was about 2,700 px), and Make a Submission fits.
- Live audit gate: MBJ index/about/archive and MCJ index pass with 0 blocking findings.

## Search UI: page, menu and dock (2026-11-27, user-confirmed)

Plan: `docs/superpowers/plans/2026-11-27-pim-search-ui.md`.

What changed:
- `/search`:
  - The keyword field and the Search button share one row.
  - The filters sit in a collapsible "Refine results", which opens when a filter has a value.
  - The date selects show Year/Month/Day labels, and all labels use sentence case.
  - The notice before a search is a helper line. When nothing matches it reads `No articles match "<q>".`, with the query inserted as text.
  - Field names and the form action are unchanged.
- Journal Menu (desktop): a quick-search field at the top.
- Dock (phones): Search opens a Search sheet with the field focused. Without JS the link still goes to `/search`.

Release:
- Commit `8aee16e2`, payload of 4 files, 26,069 bytes. The previous live copies are in `/home/pusf3964/pim-backup-20261127/search/`.
- The extract listed exactly the 4 paths. Assets are now `pim-v2.css?v=20261127-4` and `pim-ui.js?v=20261127-3`.

Verification:
- `tools/qa/journal-search.cjs` (7 cases) and `tools/qa/journal-tools.cjs` (16 cases) pass, along with every existing harness.
- The live audit gate passes with 0 blocking findings on `mbj/search`, `mbj/search/search?query=betel` and `mbj/index`. A control-overlap between the quick-search button and its input was found on the replays and fixed before release.
- `live-routes.sh` exits 0.
- Live at 375 px: the dock Search sheet opens without navigating, focuses `query`, uses the action `/mbj/search/search`, closes with Escape and returns focus to the dock item. The menu form is present.

## Final drift check (2026-11-27)

All 18 deployed runtime files match branch HEAD `50566344`. That is 12 text files by SHA-256 (the two header templates by byte size plus the served HTML, for the reason above) and 6 binaries by size. Production equals the branch.

## Speed fix and refinement layer v2.1 (2026-11-27, user-confirmed)

Why:
- **First visit took ~25 s.** The first visit to a journal home, issue or article page from an IP without a reverse DNS (PTR) record took about 25 s. OJS called `gethostbyaddr()` (`Request::getRemoteDomain()`) for the institutional subscription check on every such page, and most Indonesian ISP addresses return SERVFAIL. The server resolver then cached the answer, so only first hits were slow. This was the recurring "MBJ 21–24 s" observation. All PIM journals are open access, so the lookup never decided anything.
- **PDF buried below 1440 px.** Below 1440 px the article page's float pair (560 + 300 px inside a 792 px row) wrapped. The PDF button then sat about 5,100 px down at 1280 px and about 6,600 px down on phones.

What changed:
- `classes/issue/IssueAction.php`: `subscribedDomain()` only checks institutional subscriptions (and so only resolves the visitor's domain) for journals in subscription mode.
- `styles/pim-refine.css` (new, after `pim-v2.css`; minimal, subtle, light):
  - **Article page:**
    - The page is a two-track grid on one left edge, and it stacks below a 720 px container.
    - The download buttons sit under the authors at every width.
    - The abstract is flat, and upright when it is fully italic.
    - References are numbered with a hanging indent.
    - The details column uses labels over values with accent links.
  - **Issue table of contents:** the section heading sits on the content edge, cards have a 16 px gap, and the meta has no fill.
  - **Archive:** a list on the content edge with a muted series.
  - **Breadcrumb:** 16 px above the title everywhere.
  - **Account shell (login, register, reset):**
    - Full-width fields and button.
    - Left-aligned title.
    - Legends above a divider.
    - Checkbox rows that keep their links inline.
  - **Smaller fixes:**
    - Neutral notices (outside search).
    - A single checklist marker.
    - No stray divider under the footer heading.
    - Custom-page titles.
    - Sentence-case card titles on the journal home.
- `pim-ui.js`: `PIM.enhanceArticlePage()` moves the galley block under the authors, marks an all-italic abstract and adds the reference number column. It only moves DOM nodes; it does not rewrite content.

Release:
- Commit `ec7e2be9` on `feat/pim-refine-speed-20261127`, payload of 5 files, 25,178 bytes.
- The previous live copies are in `/home/pusf3964/pim-backup-20261127-refine/`. `pim-refine.css` is new, so it has no backup.
- After the extract, all 5 live sizes match HEAD. Assets are now `pim-refine.css?v=20261127-1` and `pim-ui.js?v=20261127-4`.

Verification:
- `tools/qa/public-refine.cjs` (15 cases, on replays of live markup) passes. All 15 fail without the layer.
- `php tools/qa/issue-action-dns.php` passes and fails on the previous `IssueAction.php`.
- All earlier harnesses pass.
- The layout audit finds no blockers on 8 replayed pages. The remaining majors are the fixed phone dock and footer link targets, which are unchanged chrome.
- Live at 1440, 1280 and 390 px:
  - The PDF sits at 408, 408 and 556 px.
  - 33 references are numbered and the abstract is upright.
  - The login fields fill the form, and the issue heading is on the content edge.
  - There are no page errors, and every route returns 200.
- Cold first hit after 40 quiet minutes, from the same IP without PTR that measured 25.7 s on `mbj/index` before the fix (10:56 UTC):
  - `mmj/index` 1.10 s; this is the known LSAPI cold start.
  - `mbj/article/view/113` 0.57 s.
  - `mbj/issue/view/13` 0.25 s.
  - `mcsj/index` 0.19 s.
  - `mbj/index` 0.21 s.

## Static right rail, rail fixes and theme log fix (2026-11-27/28, user-confirmed)

What changed:
- **The right rail is static and never collapsible (GPI layout).**
  - `PIM.buildRailSections()` builds static sections, each with a small uppercase heading.
  - `PIM.markRailGroups()` turns label-only cells, bold-only paragraphs and `<h4 class="pim-sidebar-section-title">` (MCJ) into group headings.
  - It hides empty cells and labels whose next visible item is another label (the empty "SEARCH" on MCSJ and MMJ). It also hides paragraphs with no letters or digits, such as a stray Markdown fence.
  - A block that brings its own groups keeps its title for screen readers only.
  - Links are full-width tinted rows, and the rail's Make a Submission is the primary button.
- **Theme log fix.** `PustakaMinangThemePlugin::registerSmartyModifiers()` registers each modifier only once per request. Before this, a second `display()` threw "Plugin tag 'pim_article_views' already registered", which produced 597 error_log entries since June.

Release:
- **Rail:** commit `e8413cc4`, 4 files. Backup in `/home/pusf3964/pim-backup-20261127-rail/`.
- **MCJ groups and theme fix:** commit `112dafb7`, 3 files. Backup in `/home/pusf3964/pim-backup-20261127-fix/`. Uploaded at 08:24 WIB on 28 Nov.
- **Orphan labels:** commit `5bc1e980`, 2 files. Backup in `/home/pusf3964/pim-backup-20261128-fix2/`. Asset is now `pim-ui.js?v=20261127-7`.

Verification:
- `tools/qa/journal-tools.cjs` (18 cases) passes. The new rail cases fail on the collapsible version.
- `tools/qa/public-refine.cjs` passes, including the rail checks on MBJ, MCJ, MCSJ and MMJ.
- `php tools/qa/theme-modifiers.php` passes and fails on the previous plugin.
- **Live:**
  - All 5 journals show Information, People, Policies and Submission with no `details`, no orphan labels and no page errors.
  - No "already registered" entry appears after the 08:24 upload; the last one is at 07:56.

Bug hunt (28 Nov, read-only):
- **No active blockers.**
  - Review forms in all 5 journals have real Yes/No options; MBJ and MMJ each have 10 completed reviews.
  - Section and Guest editors have stages 1, 3, 4 and 5.
  - Submissions are open, with 3 new ones in the last 2 days.
  - The job queue and failed jobs are empty.
- **Risk:**
  - PHP `upload_max_filesize` and `post_max_size` are 10M, so manuscripts or galleys over 10 MB fail. Raising them to 50M in cPanel MultiPHP INI needs the owner's approval.
  - OJS 3.5.0.6 is available; it carries the invitation-payload warnings, 753 in the log.

## Journal ISSN strip, GPI rail widgets and indexer-safe ISSN meta (2026-11-28, user-confirmed)

What changed:
- **Journal strip** (`header.tpl`, `pim-journal-strip`): sits under the header on journal pages, with the journal title on the left and the ISSN on the right. It shares the 1360 px frame, so its left edge matches the journal menu.
  - Only valid ISSNs are shown, linked to `portal.issn.org`. A valid ISSN has a correct check digit and is not 0000-0000.
  - A placeholder reads "In process".
- **`PustakaMinangThemePlugin::prepareIssn()`**: assigns `pimIssn` and replaces the Google Scholar `citation_issn` and Dublin Core `DC.Source.ISSN` headers with the first valid ISSN, or empties them. All 5 journals still store 0000-0000, which indexers were receiving.
- **Rail widgets as on GPI:**
  - Editorial office rows.
  - A dark "Download Article Template" button. The image stays in the link as its accessible name.
  - Indexed-by and recommended-tool logos stacked one per row as followable links with alt text.
- **`robots.txt`**: adds `Sitemap: https://journal.pustakainspirasi.com/index/sitemap`.

Crawl audit (Googlebot UA):
- 200 on home, article, PDF download, archive, sitemaps and OAI-PMH.
- No `noindex` or `X-Robots-Tag`.
- `citation_pdf_url` points to `/article/download/…`.
- GPI side, reported by the GPI session: no aaPanel WAF, and bots get no 403/444/429.

Release:
- Commit `f147292e`, 6 files. Backup in `/home/pusf3964/pim-backup-20261128-issn/`.
- Commit `2cf253e2`, which adds the template button for heading-style blocks (MCJ, MPJ), 2 files. Backup in `/home/pusf3964/pim-backup-20261128-template/`.
- Assets are now `pim-refine.css?v=20261128-1` and `pim-ui.js?v=20261128-2`.

Verification:
- `php tools/qa/journal-strip.php` passes and fails without the strip.
- `php tools/qa/issn-guard.php` passes.
- `tools/qa/public-refine.cjs` passes, including the template and logo checks on MBJ, MCJ and MPJ.
- **Live:**
  - The strip and template button are present on all 5 journals, with no `details` and no page errors.
  - The ISSN meta is gone from the article page.
  - `robots.txt` serves the Sitemap line.
