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
- Drift check before replacement: 7 of 9 text files were identical to `main`. Live `header.tpl` and `headerHead.tpl` differed only by an editor-injected `<meta charset="utf-8">`, inside `<header>` and inside a comment, while `<head>` had no charset. The release restores `<meta charset>` in `<head>`.
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
