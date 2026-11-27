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

## Production record

(Appended after deployment.)
