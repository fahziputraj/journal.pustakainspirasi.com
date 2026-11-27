# PIM Journal Tools revamp (desktop and mobile)

User request (27 Nov 2026): revamp the Journal Tools component and its UX on mobile and desktop
(ui-ux-layout-standards, high-end-visual-design, top-design, design-system, design-taste, design-critique).
Scope: the public journal shell only. That is the Journal Menu (`#pimJournalMenuPanel`, header.tpl), the information rail
(`#pimJournalLinksPanel`, footer.tpl, OJS sidebar blocks) and the mobile bar (`.pim-mobile-tools-bar`). The OJS block
content stays the same. Live markup was inspected on MBJ at 375x812 and 1440x900, signed in.

## Design critique

**Overall:** the navigation content is right, but the mobile wrapper has two controls for one job, it has no visible exit,
and the information panel is a 2,226 px wall of 30 links. On desktop, the right rail is longer than the content and still
carries legacy decoration.

| Finding | Severity | Recommendation |
|---|---|---|
| Mobile bar: a crimson "Journal Tools" button sits next to a separate Menu/Links segmented control. Users must work out that both open the same sheet. | 🔴 | Use one dock: Menu, Information, Search and Submit, each with an icon and label at 44 px or more. Tapping the active item again closes the sheet. |
| The open sheet has no close button. Escape, the backdrop or the bar are the only exits, and the backdrop barely dims. | 🔴 | Add a 44 px close button in the sheet header with a visible title. The backdrop is ink at 45% opacity. |
| The Information panel scrolls 2,226 px inside 722 px. Every block is fully expanded. | 🔴 | Group blocks into disclosure sections (`<details>`): the first section is open and the rest collapsed, keeping their titles and links. |
| Legacy labels such as ":: PEOPLE ::" and ":: POLICIES ::" in custom blocks. | 🟡 | Strip the surrounding `::` when displayed, in JS on the visible text only. The stored HTML is unchanged. |
| The sheet is a floating card with no anchor to the bar, so it is unclear where it comes from. | 🟡 | Make it a bottom sheet: anchored above the dock, 16 px top radius, drag-handle affordance, `max-height: min(80dvh, 640px)`. |
| Desktop right rail (about 2,700 px) dwarfs the content, which leaves a large blank area under the main column. | 🟡 | Use the same disclosure sections on desktop. The first two are open (Information, then Journal Information/People), the rest collapsed. |
| Rail headings mix uppercase-tracked, `::` decorated and sentence case. Icons are solid Font Awesome at full ink weight. | 🟢 | Use one rail heading style (13 px/600, muted, uppercase only for the menu group labels). Icons are 14 px, muted, aligned in a 20 px column. |

**What works:** the menu groups (Content, Issues, Guidelines, About), the focus trap and Escape handling, the safe-area padding,
and reduced-motion support. The current-page state also already exists.

## Design read and system

Design read: a preserve-mode redesign of a scholarly journal shell. Navigation is trust-first, so it stays predictable,
quiet and thumb-friendly. Dials: VARIANCE 3, MOTION 3, DENSITY 5. Tokens come only from the v2 set (`--pim2-*`, spec
`2026-11-27-pim-journal-requests-design.md` §4b). No new colours or fonts.

Component: **Journal dock and sheet**
- Dock (≤ 992 px): fixed at the bottom, `--pim2-bg` with a top hairline, 4 equal items in a grid, each 56 px tall plus the
  safe area, icon 18 px above a 12 px/600 label.
  - Menu and Information are `button`s with `aria-controls` and `aria-expanded`.
  - Search and Submit are links (Submit goes to `about/submissions`).
  - The active item shows a tonal indicator: a 56x30 px pill in `--pim2-accent-soft` (#FBEFEF) behind the icon, with the icon and
    label in accent and the label at 600. There is no bar or border. The pill scales in from 0.8 with the standard motion.
- Sheet: the existing panels presented as a bottom sheet. A header row holds the title ("Journal menu" or "Journal information")
  and a close button (`aria-label="Close"`). The body scrolls with `overscroll-behavior: contain`. It slides in with
  `transform` over 200 ms `cubic-bezier(0.16, 1, 0.3, 1)`, instantly under reduced motion.
- Sections: each OJS block in the information panel becomes `<details class="pim-rail-section">` with its title as the
  `<summary>` (an existing heading is moved, not copied). Blocks without a title stay as plain content.
- Desktop (≥ 993 px): no dock. The left menu keeps natural scrolling, as decided earlier: no nested scrollbar. The right rail
  uses the same sections, first two open.
- Menu item states (desktop rail and mobile sheet) replace the thick left border, which the user rejected as a generic
  "AI component" look:
  - Rest: ink text, muted 14 px icon in a 20 px column, 40 px row, 8 px radius.
  - Hover: `--pim2-bg` surface on the alt rail, with ink text.
  - Current page (`aria-current="page"`): a tonal fill in `--pim2-accent-soft` with accent text and icon at weight 600.
    There is no border, inset shadow or bar.
  - Focus-visible: the 2 px accent outline, offset 2 px.
  - Pressed: `transform: scale(0.98)`.
- States:
  - Sheet: closed, opening, open (menu), open (information) and closing.
  - Section: open and closed, with a focus-visible ring on the summary.
  - Empty sidebar: the Information dock item is hidden, as today.
