# Public journal composition refinement

Repository: D:\Fahzi\Bg Handri Maika\journal.pustakainspirasi.com
Branch: codex/fix-journal-navigation-sidebar
Starting HEAD: 09aef991fcb3ece05eccf5e9f8c901dcd6265daa
Starting checkout: clean; existing checkout/history preserved.

The owner requested continued improvements to composition, spacing, whitespace,
layout and padding using web-design-guidelines, ui-styling, ui-ux-pro-max and
design-taste-frontend-v1. The existing OJS/Smarty theme remains the implementation
context. No React/Tailwind migration or dependency installation was needed.

## Behavior and design decisions

- Header, top bar, footer and public journal content share a 1360px maximum width
  and 16-24px responsive insets. Columns use 212px navigation, flexible reading
  content and 240px information; the existing tablet/drawer breakpoints remain.
- Desktop header height drops from 113px to 89px. A visible, escaped journal h1
  establishes page identity and remains available when cover/description is absent.
- Cover frame is 132x188px, 96x136px on phones. Under 360px, the introduction keeps
  the full reading width and the cover follows it. Header controls retain usable
  sizing without making the 320px header excessively tall.
- Public journal typography uses Geist with system fallbacks, 15px prose and
  a 1.7 line height. Paragraphs use natural start alignment and a 75ch reading limit;
  tables wrap long addresses and identifiers inside their cells.
- Panel padding, section spacing, borders and headings follow a consistent
  rhythm. The legacy information menu is left aligned and has clear hover/focus.
  Resource-table fixed heights no longer manufacture blank space.
- Only empty paragraph/table-row editor spacers in sidebarrye and flagcounterrye
  are classified and hidden. Meaningful text, links, anchors, images, media,
  interactive widgets and accessible labels remain in the DOM. Stored OJS HTML,
  journal settings, people, submissions and publishing workflows are unchanged.
- Desktop navigation keeps natural page scrolling. Mobile drawers retain their
  internal scrolling, keyboard controls, safe areas and reduced-motion handling.

The skill searches informed readability, spacing and responsive checks; brand
colors remain crimson/gold. Fresh Web Interface Guidelines were reviewed at
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.
The review is bounded to this public journal composition change.

## Verification and release scope

The actual Smarty introduction is exercised for empty, description-only,
image-only, combined and header-image cases. The rendered browser harness uses
that source introduction with five saved public journal responses at 14 widths:
1440,1280,1200,1024,993,992,900,768,600,430,390,375,360,and320px.
It checks layout, overflow, visible title, leading whitespace, short desktop
navigation, authored content/links/control preservation, keyboard focus, resize,
long-content and empty-sidebar behavior. Smarty sidebar/announcements, syntax and
diff checks accompany it. Fixture tests use fallback fonts; the interactive
preview separately confirms loaded Geist 400-800 and layout at1440/1024/390/320px.

Independent read-only review reported no critical/important regressions. Optional
320px reading-width polish was incorporated. The font-proof caveat was resolved
by observing loaded FontFace states in Chrome and inspecting the rendered preview.

Runtime payload contains exactly five changed files: pim-ui.js,
PustakaMinangThemePlugin.php, styles/pim-layout.css, components/footer.tpl and
pages/indexJournal.tpl. CSS/JavaScript asset versions are20261014-3. The complete
bounded .cpanel.yml manifest now includes six theme files, including unchanged
header.tpl. The existing cPanel private Git pull limitation still applies.

The active indexJournal.tpl was copied before replacement to
/home/pusf3964/pim-sidebar-backup-20261013/indexJournal.tpl; previous runtime
archives in that directory preserve the other four active versions. The intended
document root remains /home/pusf3964/public_html/journal.pustakainspirasi.com/.
Evidence is under the existing ojs/composition-20261014 directory.

No worktree, clone, stash, reset, clean, PR, merge or main-branch modification.
Production readback and final Git synchronization are recorded after installation.
