# PIM public journal navigation and sidebar repair

Status: deployed to production through cPanel File Manager with recoverable
backups; source committed and pushed to the repair branch. Live validation is
recorded below. cPanel Git pull remains unavailable because it cannot contact
the private remote.

Repository: `journal.pustakainspirasi.com` in the existing owner checkout.
Branch: `codex/fix-journal-navigation-sidebar`.
Starting HEAD: `b0b4066410374a03d2a6198fd5631cbe000cf5ac`.
The checkout was clean before the task. No additional checkout was created.

## Reported problem and cause

The public journal theme placed Journal Menu above native OJS blocks in the same
right column (`"main tools" / "main sidebar"`). This pushed the configured People,
Policies, and Submission blocks far down the page. The footer also ran a theme
modifier that removed every link labelled Editorial Team from the sidebar hook
output, even when a journal manager had configured that link in Custom Block
Manager. The Editorial Masthead page itself still displayed the configured MBJ
Journal Manager and Editor in chief during the read-only live inspection.

The local and live CSS and JavaScript contents matched after normalizing line
endings. No deployment drift caused these particular defects.

## Resulting behavior

- At widths of 1200 CSS pixels and above, Journal Menu occupies the left rail,
  journal content the center, and configured OJS blocks the right rail. Both rails
  start alongside the content. The journal container has a 1440px maximum width.
- At 993–1199px, the menu and information blocks share the left rail while the
  content retains readable width. An intrinsic first grid row keeps information
  blocks exactly 24px below the menu even on very long journal pages.
- At 992px and below, a consistent Journal Tools drawer exposes Menu and Links.
  Opening, panel switching, Escape, return focus, Tab/Shift+Tab containment,
  ArrowLeft/ArrowRight/Home/End selection, and viewport changes work together.
  The inactive tab is excluded from the Tab cycle. When no OJS sidebar exists,
  Links is hidden and Menu remains usable.
- Configured sidebar HTML passes through the real Smarty footer without link
  deletion. Editorial Team and Editorial History are no longer removed. Only
  links labelled Editorial Team targeting obsolete local `/editorialTeam`,
  `/about/editorialTeam`, or `/editorialMasthead` routes are corrected to the
  current journal's active `/about/editorialMasthead` route. This includes stale
  copied references to another journal. Valid cross-journal, external, history,
  and custom routes remain intact. This fixes the 404 addresses found in MBJ,
  MCJ, and MMJ after restoration. The native menu also retains its current-journal
  Editorial Masthead link.
- Navigation has explicit keyboard focus styles; drawer scroll stays contained;
  bottom controls respect device safe areas; changed navigation motion honors
  reduced-motion preferences. Article abstract paragraphs are left-aligned for easier
  reading. The existing PIM colors, imagery, OJS templates, and CSS stack are kept.
- Both asset URLs use `20261013-1` so browsers request the updated theme files.

## Files

Production payload (four files only):

1. `pim-ui.js`
2. `plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php`
3. `plugins/themes/pustakaMinang/styles/pim-layout.css`
4. `plugins/themes/pustakaMinang/templates/frontend/components/footer.tpl`

Verification sources, excluded from the production payload:

- `tools/qa/journal-sidebar.php`: renders the actual Smarty footer without a
  database and checks exact preservation of configured sidebar HTML and links.
- `tools/qa/journal-layout.cjs`: replays saved public HTML using the local theme
  in headless Chrome and verifies geometry, drawers, keyboard behavior, resize,
  missing sidebar handling, and very long content.
- This report.

The cPanel manifest now copies only the four runtime files. Its previous tasks
also copied unrelated backend, locale, and page files; those tasks were removed
from this repair branch. A whole-repository deployment is not part of this patch.

## Verification and limits

- The sidebar regression failed before the filter was removed and passed after.
- Browser regression tests failed on the original right-column layout and missing
  tablet tools. The keyboard and long-content failures were also reproduced
  before their respective fixes.
- Final browser replay passed for MBJ, MCJ, MCSJ, MMJ, and MPJ at 1440, 1280,
  1200, 1024, 993, 992, 900, 768, 430, 390, and 360px: 55 journal/width
  combinations, no theme JavaScript errors. Resize, absent sidebar, and 4000px
  extra-content checks also passed for each journal; compact rail gap was 24px.
- PHP syntax, JavaScript syntax, actual Smarty footer rendering, and
  `git diff --check` passed. Browser screenshots were inspected.
- Read-only live checks returned HTTP 200 for 31 MBJ internal links, including
  the existing Editorial Masthead route. This is reachability evidence, not a
  guarantee about each page's content accuracy or every OJS business workflow.
- An independent code review found two keyboard defects; both were fixed and
  re-reviewed. The final compact grid correction was also reviewed without
  remaining important findings within this scope.
- Audit used the user-requested ui-styling, ui-ux-pro-max,
  high-end-visual-design, design, and web-design-guidelines skills, adapted to the
  existing OJS theme. Guidelines source:
  https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Evidence directory:
`C:\Users\user\.codex\visualizations\2026\10\13\01a13580-ec32-73a1-91b3-77922c8883c5\ojs`.
It contains public HTML snapshots, screenshots, per-journal JSON results, and
public link HTTP results. The archived public HTML already has the old sidebar
filter applied, so browser screenshots do not themselves prove restoration of
the stored Custom Block Editorial Team link. That behavior is verified by the
actual Smarty regression test and post-deployment live readback. The
`live-desktop.jpg` and `live-mobile-*.jpg` files show the actual hosted result.

No local OJS configuration or database was available. Authenticated editorial
workflows, submission/publishing flows, backend settings,
physical mobile devices, and a complete site-wide accessibility audit are not
claimed as passing. Existing placeholder ISSN and editorial content completeness
remain journal-data matters, outside this theme fix.

## Deployment and recovery procedure

1. Use the supplied cPanel account and confirm that the journal document root is
   `/home/pusf3964/public_html/journal.pustakainspirasi.com/`.
2. Inspect the exact four hosted files and preserve their current versions in a
   recoverable backup outside the public document root before replacement.
3. Replace only the four files in the deployment payload, preserving their
   repository-relative paths. Verify PHP syntax if the host exposes a suitable
   shell, and verify asset versions and delivered content after replacement.
4. Verify Journal Menu on the left, sidebar at the expected top position,
   configured Editorial Team under People and its repaired target, Editorial
   Masthead content, and tablet/phone Menu and Links interactions in the live site.
5. If a required live check fails, restore the four backed-up files and read back
   the restored site. Cache maintenance, if required, must be scoped to the
   established OJS procedure rather than deleting arbitrary runtime directories.

This payload contains no configuration, credentials, database export, migration,
uploaded journal content, vendor files, or backend modifications. No database,
users, roles, submissions, issues, or journal settings were changed. The owner
subsequently authorized continuation and Git use. Source commits were pushed to
`codex/fix-journal-navigation-sidebar`; no PR or merge was performed.

## Production deployment record

- Document root verified in File Manager:
  `/home/pusf3964/public_html/journal.pustakainspirasi.com/`.
- Four original files copied outside the public root to
  `/home/pusf3964/pim-sidebar-backup-20261013/`. File Manager showed all four
  files, and `original-files.zip` compression listed exactly those files.
- Runtime release archives contain exactly the four reviewed files and match
  local source hashes. The archives remain in the private backup directory.
- cPanel Git repository `/home/pusf3964/repositories/pim-jurnal` remained on
  `fix/editorial-team-sidebar-operational-v1` at `c6ebeece`. The interface could
  not contact the HTTPS private GitHub remote and disabled Update from Remote.
  Existing repository/remote/access settings were preserved. Deploy HEAD was
  not run against the outdated checkout.
- Production installation used cPanel File Manager extraction into the verified
  document root. The extraction result listed only the four payload files.
- Live readback confirmed `20261013-1` asset versions, source-identical CSS and
  JavaScript after line-ending normalization, the left menu and top-aligned
  right sidebar, and restored Editorial Team. MBJ's restored link opened the
  configured Journal Manager and Editor in chief content with HTTP 200.
- Live Chrome at 1440px and 390px confirmed layout, drawer switching,
  Tab containment, Escape, arrow-key focus, and no theme console errors. Temporary
  viewport overrides are reset after verification.
- The repair branch is the source of the production files; cPanel's Last
  Deployed SHA remains historical because File Manager does not update it.
- No GitHub credential, deploy key, repository visibility, shell access, or
  security setting was created or changed to work around the remote failure.

## Follow-up after the second review

Starting HEAD for the follow-up: 32592ddbd698b9bc68543bac7d08bef99e582a9f.
The two keyboard regressions were reproduced before correction: disabled widget
controls trapped Tab, and focused desktop menu links lost focus at the tablet
breakpoint. Navigation now excludes disabled (including fieldset descendants),
negative-tabindex, inert, and visibility-hidden controls. When a focused rail is
hidden on resize, focus transfers to the visible Journal Tools control.
The browser QA includes both behaviors; the new assertions failed before fixing.

The Journal Menu now displays Announcements only when enableAnnouncements is
active. The real Smarty menu test failed for disabled announcements before the
condition and passed for enabled/disabled settings afterward. The deployment
payload now includes header.tpl as a fifth runtime file. The JavaScript URL uses
20261013-2; CSS remains 20261013-1 because it was not changed in this follow-up.

The following stored OJS content was corrected through the authenticated editor,
with original HTML saved outside the repository before each edit:
- MPJ sidebarrye: Author Guidelines -> /mpj/about/submissions.
- MMJ sidebarrye: Contact -> /mmj/about/contact.
- MMJ and MCSJ additionalHomeContent: OAI href -> each current journal's /oai.
- MMJ and MCSJ flagcounterrye: replace malformed BBCode href with
  https://info.flagcounter.com/z45a, retaining the image and other block content.

These are stored content changes, distinct from the five-file source payload.
Original HTML and browser results are in the evidence directory review-fix/.
No user, role, submission, issue, publishing workflow, or announcement feature
setting was changed. Disabled Announcements remains disabled.

All five journal replay runs passed eleven widths and the new keyboard checks.
PHP/JavaScript syntax, real Smarty sidebar and announcement tests, and diff checks
passed. An additional independent reviewer started checking the changes but could
not complete its review due to the agent usage limit; that review is not claimed
as passed. Source review and focused runtime proof were performed by the primary
agent. Full authenticated editorial workflows and physical devices remain untested.

Follow-up production readback:
- Runtime commit: 12e9ad2674ab6d78e263bee7b0b016732435da4d.
- Installed only the three changed runtime files: pim-ui.js, header.tpl, footer.tpl.
  The five-file .cpanel.yml remains the complete bounded theme release manifest.
- Archive PIM-review-fix-20261013.zip SHA256:
  3767858eafa2c03ad4161f51cfad644fc25dc6b715c954dab75b95db0bdf8f9d.
- Header copied to /home/pusf3964/pim-sidebar-backup-20261013/header.tpl before
  replacement; the previous release archive preserves the other active files.
- cPanel extraction listed exactly those three paths and the runtime commit.
- All five home pages returned200;139unique internal links returned200 with no
  failures. MMJ/MPJ omit disabled Announcements; enabled journals retain it.
- Hosted pim-ui.js matches the source after line-ending normalization. Live
  desktop-to900px focus transfers to pimMobileToolsToggle; Tab wraps within Links
  and Escape closes the drawer. Temporary viewport override was reset.
- MPJ sidebar Author Guidelines was clicked live and opened /mpj/about/submissions.
- Evidence: review-fix/live-final-audit.json, live-mpj-after.jpg, original HTML
  backups, and per-journal layout-results.json. Existing cPanel Git pull limitation
  remains; no repository access/security settings were changed.

## Independent review completed on 2026-10-14

Starting HEAD: 3fd1433621dc6f3317f0abb063539e9d83dd1af3; existing checkout and
repair branch preserved. The previously interrupted independent review completed
without blocking findings. It identified one P3 focus continuity refinement:
a pointer click outside a rail could leave remembered rail focus stale before a
resize. A new browser assertion reproduced the failure. An outside pointerdown
now clears only that memory; direct focused left/right rails still transfer to
the tools toggle and focus elsewhere remains intact. The independent reviewer
retested the correction and reported no remaining important findings in scope.

The JavaScript cache version is 20261014-1. This refinement changes pim-ui.js and
footer.tpl only; the source test is tools/qa/journal-layout.cjs. Fresh Smarty,
syntax, layout, keyboard, and live public link checks were run. Before deployment,
all139internal public links returned200 and hosted CSS/JavaScript matched their
then-current source. Evidence is under verification-20261014/.

Final production verification for the 2026-10-14 refinement:
- Runtime commit43f8a685148f5492e2bd25905e2de03ba4349f15 installed via cPanel
  File Manager. Extraction listed exactly pim-ui.js and footer.tpl.
- Archive PIM-focus-final-20261014.zip SHA256:
  468bd4dd8c83603809743745971e0c345f99d4da758810e957bcf1851b32d348.
- Prior PIM-review-fix-20261013.zip remains in the private recovery directory;
  it preserves the previous JavaScript/footer runtime versions.
- All55journal/width combinations and the three focus regressions passed.
  Smarty sidebar/announcements, PHP/JavaScript syntax and diff checks passed.
- All5home pages deliver JavaScript version20261014-1;139internal links return200.
  Delivered JavaScript matches local source after line-ending normalization.
- Live1280-to900 viewport checks confirm intentional outside pointer blur stays
  on BODY while active rail focus moves to pimMobileToolsToggle. Links Tab wraps
  to the toggle, Escape closes, and desktop layout remains left-menu/top-sidebar.
  Temporary viewport overrides were cleared. Browser console had no errors.
- Fresh evidence: verification-20261014/live-post-deployment.json and
  live-desktop-final.jpg, plus five journal layout-results.json files.
- Independent follow-up review completed and the sole P3 finding was corrected
  and re-reviewed; no remaining important findings were reported within scope.

## Desktop left-panel scrollbar correction

Starting HEAD429ebb69439eeb80e51705debb25c13af7980db4. The owner reported the
visible nested scrollbar in Journal Menu. Live855px viewport evidence showed
clientHeight711px versus scrollHeight743px because max-height was100dvh-144px
and overflow-y:auto. The desktop rail now follows normal page scrolling with
natural height and no internal scrollbar. It no longer uses desktop sticky
positioning. Mobile/tablet fixed drawers retain their bounded overflow:auto.
CSS asset version is20261014-2; JavaScript remains20261014-1.

A new rendered regression failed on the previous CSS and passed after correction.
It checks no nested menu overflow at855px and600px viewport heights and reaches
the final menu link via focus without scrolling the rail. All55journal/width
combinations and keyboard/resize/empty-sidebar/long-content checks passed again.
Smarty sidebar and announcement rendering and PHP syntax also passed. Runtime
payload is limited to PustakaMinangThemePlugin.php and styles/pim-layout.css.

The owner's requested ui-ux-pro-max, design-taste-frontend-v1, and
web-design-guidelines skills were applied to this bounded navigation review.
The UI/UX search and fresh Vercel Web Interface Guidelines informed the checks
for unintended overflow, keyboard reachability, visible focus, and responsive
drawer behavior. Existing OJS/Smarty architecture and scholarly brand styling
remain the implementation context. Independent rendered review confirmed the
old711/743px overflow and corrected743/743px dimensions at1280x855, reachable
last action on600px-high desktop screens, and functioning mobile drawers at
992,900,and390px. No important findings remained in this scrollbar correction.

Production installation and readback completed on2026-10-14:
- Runtime commit05ad354a8992bb2d94f69a07e02d1afa63d8c5c0, pushed on the existing
  codex/fix-journal-navigation-sidebar branch. Extraction results listed exactly
  the PHP theme plugin and styles/pim-layout.css at the verified document root.
- PIM-scrollbar-fix-20261014.zip SHA256:
  e79cb55978e47ed29d2d567c00c5acd17aa83952caebc241a686af8cc4484ca4.
  Previous release archives remain in the private recovery directory.
- All5journal home pages return200 and reference CSS version20261014-2.
  Hosted CSS and unchanged JavaScript match source after line-ending normalization.
- Live1280x855: rail743px/client743px, static position, no max-height, visible
  overflow and scrollTop0. No horizontal overflow; main/right-sidebar tops align.
- Live1280x600: the final Make a Submission link is focused and inside the
  viewport through page scrolling; the menu's scrollTop remains0.
- Live375x812 and812x375: fixed mobile drawer keeps overflow:auto and contains
  the last focused action. Escape closes it; neither viewport overflows sideways.
  Reduced-motion mode gives0s menu/toggle transitions. Console error readback is
  empty. Temporary viewport/media overrides were cleared after verification.
- Evidence: verification-20261014/scrollbar/live-readback.json,
  live-browser-results.json, live-desktop-scrollbar-fixed.jpg, and five journal
  layout-results.json files. UI review covers this navigation change; it does
  not certify every unrelated theme component or authenticated editorial flow.
- Starting checkout was clean. Existing source/history and backup archives were
  preserved; no worktree, clone, stash, reset, clean, PR, merge, or main change.
