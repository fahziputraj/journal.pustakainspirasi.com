# PIM Journal: client requests 18-27 Nov 2026, audit and design critique

Scope: journal.pustakainspirasi.com (OJS 3.5.0.4, theme `pustakaMinang`).
GPI Journal / RASO reviewer upload (19 Nov) is a separate site and is handled in its own session.

Evidence (not committed): WhatsApp archive `WhatsApp Chat with Bg Handri Maika Getpress.zip`
(contains credentials, never copy it into the repository), live audit and screenshots taken 27 Nov 2026.

## 1. Client requests

| ID | Date | Request (client words, paraphrased) | Finding |
|---|---|---|---|
| R1 | 18 Nov | Replace the PIM logo with the HD file. The current one is misspelled "ISNPIRASI". | The portal header (`public/site/pageHeaderTitleImage_en.png`) already shows the corrected logo, but as a 1.2 MB, 1672x941 image on a white box. Still wrong: the root `logo.png` fallback still says "ISNPIRASI". The footer shows the *journal* logo on journal pages under the heading "PIM Journal Portal", with a white box on a grey footer. `favicon.png`, which `headerHead.tpl` references, returns 404. |
| R2 | 26 Nov | A Section Editor account in MBJ has no "Schedule For Publication" button. Super Admin does. Role settings are correct (all four stages, not recommend-only). | Root cause is in the OJS 3.5 UI bundle. `useWorkflowPermissions` (ui-library `stable-3_5_0` and `main`) sets `canPublish` only for `ROLE_ID_SITE_ADMIN`/`ROLE_ID_MANAGER` in the production stage. The server already authorizes Section Editors (`PKPSubmissionController::$productionStageAccessRoles`, `PublishHandler`, `AssignToIssueHandler` include `ROLE_ID_SUB_EDITOR`). A Journal Manager who is *assigned* to the submission as Section Editor also loses the button, because global roles are only used when the user is unassigned (`submission/maps/Schema.php`). |
| R3 | 27 Nov | Yeni (MBJ Editor in Chief) wants to publish an article but the publish button is missing. Someone else is waiting to submit too. | Same cause as R2. MBJ issue Vol. 1 No. 1 (2026) is published with 0 articles, which is why the portal shows "No active issue links found". It resolves once the article is scheduled. |

Decision for R2/R3: patch the compiled bundle (`js/build.js`) so the production-stage publish permission also
includes `ROLE_ID_SUB_EDITOR`, keeping the recommend-only exclusion. This restores pre-3.5 behaviour and matches
what the server already authorizes. It must be re-applied after any OJS upgrade. The rejected alternative is
configuration only: give publishers a Manager-level role without "Permit changes to Settings". That is broader access,
and it does not help a manager who is assigned as Section Editor.

## 2. Backend observation

The first request after the site has been idle is slow: about 1.1 s after 75 s idle (0.19 s on repeat), and
about 21 s after roughly 25 minutes idle (seen twice). This is consistent with the OJS 3.5 defaults `[schedule] task_runner = On`
and `[queues] job_runner = On`, which run inside web requests. The host uses LiteSpeed `lsphp`,
where `fastcgi_finish_request()` does not exist, so the response is held until the runners finish. The fix is
operational (a cron-driven scheduler), not code. The portal's client-side issue lookup (1800 ms timeout) fails during
these stalls.

## 3. Live layout audit (ui-ux-layout-standards, 27 Nov, Chrome, 320-1440 px)

Confirmed on screenshots. Default content unless marked.

| ID | Where | Defect | Std |
|---|---|---|---|
| D1 | Site-level header (portal, login, register) at 320 px | Login, Submit Manuscript and the hamburger row is 21 px wider than the viewport. The hamburger is clipped. | #94 #98 |
| D2 | Portal toolbar at 320-390 px | The Filters/Sort row overflows by 21 px. The "A-Z"/"Z-A" labels break onto two lines. The directory grid spills 8 px. | #94 #99 |
| D3 | All pages | Gold used as text: white on gold "Submit Manuscript" 2.23:1, "Peer Reviewed" badge 2.19:1, "Explore Portal" 2.23:1, MBJ issue series 2.23:1. Subject count chips 3.86:1. | #47 #285 |
| D4 | Portal desktop | `#journalFinder` search input has no accessible name. | #289 |
| D5 | MBJ at 320-768 px | Focused links are hidden behind the fixed "Journal Tools" bar (no `scroll-padding-bottom`). | #106 #287 |
| D6 | MBJ desktop | Indexing/tool logos are stretched (rendered ratio 2.17 vs 2.49, and 2.31 vs 2.70). | #53 |
| D7 | Theme text containers, under the long-word stress test | Footer, journal menu, topbar and sidebar headings have no `overflow-wrap` or `min-width: 0` guards. | #41 #98 |

## 4. Design critique (design-critique, design-taste-frontend, top-design, high-end-visual-design)

Design read: a preserve-mode redesign of an academic journal portal for authors, reviewers and editors. The language
should be trust-first and scholarly, built on the existing OJS Smarty theme with native CSS tokens. Dials:
VARIANCE 3, MOTION 2, DENSITY 5 (trust-first preset).

The Awwwards-tier techniques from top-design and high-end-visual-design are deliberately not adopted: smooth-scroll libraries,
scroll hijack, glass, custom cursors, double-bezel cards and staggered reveals. They would undermine trust and accessibility
for a scholarly audience. Their shared fundamentals are adopted: contrast, one CTA label per intent, designed empty states,
LCP/CLS discipline and visible focus. top-design score today is about 4.5/10 (Type 5, Composition 5, Motion 3, Color 5,
Details 4). The realistic target for this scope is about 6.5/10.

**Overall impression:** a clear three-rail structure with a recognisable crimson and gold brand. The biggest
problems are trust leaks: wrong subject facets, an empty section heading, a misspelled fallback logo, low-contrast gold
text and a 404 favicon.

| Finding | Severity | Recommendation |
|---|---|---|
| Portal "Browse by subject" puts 4 of 5 science journals under "Education & Social Sciences" and 1 under "Medicine & Life Sciences". The keyword list was copied from GPI and uses substring matching. | 🔴 | Replace it with PIM's real disciplines (Life Sciences; Chemistry & Physics; Mathematics & Computing) and use whole-word matching. |
| MBJ home shows the "Popular & Past Issues" heading over a large empty area. The scraper shows the container when the archive has 1 issue, then skips that issue. | 🔴 | Render it only when at least one past issue exists, and build the cards with DOM text, not HTML strings. |
| The "Active Filters" card and the dashed "Reset all filters" button are visible when no filter is active. | 🟡 | Show them only while a filter, search or non-default sort is active. |
| The footer brand block reads "PIM Journal Portal" but shows the current journal's logo. | 🟡 | Always use the PIM portal logo (transparent, with explicit dimensions). |
| The header CTA is gold with white text and fails contrast. | 🟡 | Keep the gold surface and use dark ink `#1E2022` (7.32:1). Gold text on light surfaces uses `#8A6418` (5.36:1 on white). |
| Logos are heavy: portal header 1.2 MB, MBJ header logo 2.3 MB. Both are LCP elements. | 🟡 | Ship optimised transparent PIM assets. Recommend optimised journal logos to the managers (data, see section 5). |

Visual hierarchy: the eye goes first to the gold header CTA, which is correct. The reading flow is the left menu, then content, then the right rail.
Section headings are inconsistent on the journal home ("Current Issue" vs the inline 1.6 rem / 800 "Popular & Past
Issues").

What works: the consistent three-rail journal shell, a readable 15 px Geist body at 1.7 line height, the brand palette, the
keyboard-accessible drawers, and truthful empty states for missing issues.

Design-system audit (token_lint on the theme): 77 hard-coded colors, 12 magic z-indexes, 131 px font sizes,
26 `transition: all`, 2147 `!important`, 10 breakpoint widths, and `overflow-x: hidden` on the root. Tokens exist in
`:root` (`--pim-crimson`, `--pim-gold`, `--pim-dark`, `--pim-text`, `--pim-muted`, `--pim-border`, `--pim-bg-*`).
This plan adds `--pim-gold-ink` and `--pim-on-gold` and fixes only the selectors it touches. Migrating everything
else is out of scope because it risks regressions in OJS pages that cannot be tested here.

## 4a. Additional findings (27 Nov, all shells)

| ID | Shell | Finding |
|---|---|---|
| B1 | Router/backend | `/{journal}/dashboard` returns HTTP 500 with an empty body for signed-out visitors on all five journals. `PKPDashboardHandler::authorize()` calls `redirectHome()` and then `PKPPageRouter::getHomeUrl()` calls `Auth::user()->getId()` on null. It should send the visitor to login with `source`. |
| B2 | Backend shell, ≤ 56rem | The workflow side modal (`.DialogContent`) cannot be used on phones. The header row does not wrap, so the title collapses to one word per line and Preview/Activity Log/Library run 105 px off-screen. `div.min-w-fit.p-4` forces the body to 879 px inside a 363 px modal, the 16rem side menu stays beside the content, and Publication is cut off. |
| B3 | Backend shell, mobile | Dashboard: about 70 px of dead space between the page title and Filters. The skip link focus colour is #006798 on #002C40 (2.37:1). |
| M1 | Middleware | Static assets have no `Cache-Control`/`Expires`. Browsers cache heuristically (weeks for `build.js`), so stale bundles survive deploys unless the URL changes. There is no `X-Content-Type-Options` or `Referrer-Policy`. |
| M2 | Middleware | Built-in job and task runners run inside web requests on LiteSpeed (spec §2). |
| H1 | History | Checked as resolved before 18 Nov: Editorial Team links and masthead (data from Editorial History), sidebar placement, invitation e-mail (`proc_open`, fixed by SMTP; Sep 10 test reached the inbox), SPF/DKIM/DMARC present for pustakainspirasi.com. |

## 4b. Public shell design system v2 ("clean international journal")

Direction: an evolutionary redesign in preserve mode. URLs, navigation labels, link targets, form fields and OJS data
stay as they are. The reference family is the restraint of MDPI, Frontiers and PLOS: white surfaces, hairline
dividers, one sans family, a single crimson accent for actions, and gold reserved for brand rules and badges. No hero
imagery, glass, parallax or scroll effects.

Tokens (added in `pim-layout.css` as `--pim2-*`; existing `--pim-*` names keep working):

| Token | Value |
|---|---|
| Font | `Geist` 400/500/600/700 for everything. Playfair is dropped from the footer kicker. |
| Type scale (rem) | display 2.25/1.15/-0.02em · h1 1.875/1.2 · h2 1.375/1.3 · h3 1.125/1.35 · body 1/1.65 · small 0.875/1.5 · caption 0.8125/1.45 |
| Ink | `--pim2-ink #1E2022` (headings) · `--pim2-text #334155` · `--pim2-muted #5B6575` (5.9:1 on #FFF) |
| Surface | `--pim2-bg #FFFFFF` · `--pim2-bg-alt #F7F8FA` · `--pim2-line #E3E7ED` |
| Accent | `--pim2-accent #A91D22` (links, primary buttons, focus) · `--pim2-accent-hover #8B181C` · `--pim2-gold #D2A758` (rules, badge borders) · `--pim2-gold-ink #8A6418` (gold text) |
| Space | 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 px (`--pim2-s1` … `--pim2-s9`) |
| Radius | 8 px for cards, inputs and buttons; 999 px for badges only |
| Elevation | None at rest; cards use a 1 px line. Hover: `--pim2-line` → `#C9D0DA`. |
| Motion | 160 ms `cubic-bezier(0.16, 1, 0.3, 1)` on color, border-color and transform only; none under reduced motion |
| Focus | `outline: 2px solid var(--pim2-accent); outline-offset: 2px` on every interactive element |
| Layout | container max 1240 px, gutter `clamp(16px, 3vw, 32px)` |

Component rules:
- **Topbar.** 32 px high, caption size, muted ink, wraps safely.
- **Header.** 72 px desktop and 60 px mobile, white, 1 px bottom line, logo 44 px high. Navigation is sentence case at 15 px/500 with a crimson underline for the active item. "Login" is a text link. "Submit Manuscript" is the one primary button (crimson, white text, 7.28:1).
- **Primary/secondary buttons.** Primary is crimson solid. Secondary is a white surface with a 1 px line and ink text. One primary per region. Card-level submit actions become secondary.
- **Section headings.** Sentence case at h2/h3. Uppercase-tracked micro-labels are limited to one per rail.
- **Portal.** An intro band holds H1 "Pustaka Inspirasi Minang Journals", a 16-word subline and the journal count. Directory cards show the cover (homepage image, 3:4, 88 px wide; fallback is the journal thumbnail), the title as the main link, a 3-line description clamp, a meta row of badges (gold-ink text), and actions "Explore Portal" (text link) plus "Submit manuscript" (secondary). These sections are count-aware: the letter heading is hidden when there is only one group, Featured Articles is hidden when empty, and Active Filters is hidden at rest.
- **Journal home.** The hero holds the title (display), lead description (body, 65ch) and the cover (132x188, 1 px line). The facts table (journal-supplied HTML) has a label column in muted small text, hairline rows and no zebra. Current Issue and Past Issues share the h2 style and the issue-card component.
- **Rails.** The journal menu and information blocks drop the boxed card look and use the alt surface, hairline group dividers, 40 px link rows and a crimson active indicator.
- **Content and account pages.** Prose (headings, lists, tables, blockquote) follows the scale. Forms put labels above inputs, inputs are 44 px high, and the login/register card is 440 px max with a crimson primary button.
- **Footer.** Alt surface with a 1 px top line, the PIM logo, a one-line mission, quick links and contact. No serif kicker.

## 5. Out of scope (journal-manager data; reported, not hard-coded)

- E-ISSN `0000-0000` placeholders, ":: PEOPLE ::"-style labels, empty "E-ISSN ONLINE" / "SEARCH" headings in custom blocks.
- Journal logos (2.3 MB MBJ, about 1.2-1.4 MB others) should be re-uploaded tight-cropped and optimised via Website → Appearance.
- The right-rail "Make a Submission" block duplicates the left menu CTA (Website → Appearance → Sidebar).
- Root `overflow-x: hidden`, the `!important` volume and the breakpoint consolidation (systemic; a separate effort).
