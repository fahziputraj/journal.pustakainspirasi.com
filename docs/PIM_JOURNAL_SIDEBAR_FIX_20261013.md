# PIM public journal navigation and sidebar repair

Status: locally verified, reviewed, prepared for deployment; not deployed.

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
  links labelled Editorial Team targeting the current journal's obsolete
  `/editorialTeam` or `/about/editorialTeam` routes are corrected to the active
  `/about/editorialMasthead` route. External, other-journal, and custom routes are
  preserved. This fixes the 404 found on the restored MBJ link after deployment.
  The native
  menu also retains its current-journal Editorial Masthead link.
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
actual Smarty regression test and requires a post-deployment live readback.

No local OJS configuration or database was available. Authenticated editorial
workflows, submission/publishing flows, backend settings, production deployment,
physical mobile devices, and a complete site-wide accessibility audit are not
claimed as passing. Existing placeholder ISSN and editorial content completeness
remain journal-data matters, outside this theme fix.

## Deployment after explicit owner approval

1. Use the supplied cPanel account and confirm that the journal document root is
   `/home/pusf3964/public_html/journal.pustakainspirasi.com/`.
2. Inspect the exact four hosted files and preserve their current versions in a
   recoverable backup outside the public document root before replacement.
3. Replace only the four files in the deployment payload, preserving their
   repository-relative paths. Verify PHP syntax if the host exposes a suitable
   shell, and verify asset versions and delivered content after replacement.
4. Verify Journal Menu on the left, sidebar at the expected top position,
   configured Editorial Team under People and its original target, Editorial
   Masthead content, and tablet/phone Menu and Links interactions in the live site.
5. If a required live check fails, restore the four backed-up files and read back
   the restored site. Cache maintenance, if required, must be scoped to the
   established OJS procedure rather than deleting arbitrary runtime directories.

This payload contains no configuration, credentials, database export, migration,
uploaded journal content, vendor files, or backend modifications. No database,
users, roles, submissions, issues, or journal settings were changed. No staging,
commit, push, PR, merge, or deployment was performed during local preparation.
