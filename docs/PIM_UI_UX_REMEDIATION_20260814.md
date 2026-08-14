# PIM UI/UX remediation — 2026-08-14

## Scope

This remediation addresses shared public-theme and backend-shell defects found during a read-only production audit. It does not modify production data, credentials, `config.inc.php`, journal settings, users, submissions, issues, or publications.

## Code remediations

- Public pages now expose a keyboard skip link, a stable main-content target, document direction, non-empty titles, and one page-level heading on portal and journal home pages.
- The portal no longer presents journal homepages as fallback “Featured Articles” or “Latest Issues” when OJS reports no published current issue.
- Placeholder ISSNs (`0000-0000` and `xxxx-xxxx`) are suppressed from portal cards.
- Unverified accreditation/indexing filters have been removed until structured, verified journal metadata is available.
- The portal filter drawer and journal mobile tools now maintain `aria-expanded`, `aria-selected`, `aria-hidden`, focus return, keyboard Escape, focus containment, and inert hidden panels.
- Journal mobile tools use a single drawer contract instead of a static sidebar plus a non-functional toolbar.
- The public footer reads the journal's OJS license URL. It no longer claims CC BY 4.0 when the OJS Distribution setting is empty or configured as an unspecified custom license.
- The backend shell now has a responsive navigation drawer below 56rem and no longer forces a fixed 336px navigation beside a 500px content minimum.
- The duplicate backend announcer component was removed.
- Missing English and Indonesian labels for Help and user-access options were added.
- Backend date components receive PHP's already-resolved timezone when legacy production configuration omits `general.time_zone`.
- The cPanel manifest now deploys every runtime file changed by this remediation.

## Post-deployment smoke-test follow-up

- The public mobile hamburger now opens a responsive menu, moves focus to the first link, closes on link selection/outside click/Escape, restores focus, and keeps the closed menu inert.
- The public CSS and JavaScript URLs now use an explicit remediation version so cPanel deployments do not continue serving the previous assets from browser or proxy caches.
- The backend mobile header is constrained to the viewport, its navigation trigger is icon-sized, and wide editorial tables scroll inside their own container instead of widening the document.
- Legacy Custom Block Manager identifiers ending in `rye` are normalized to useful accessible labels and kept visually hidden when the block already contains its own section headings.
- Known placeholder editorial emails such as `editor@mcj.com` are presented with the canonical PIM support address, and empty sidebar sections such as an E-ISSN heading without a value are removed from the rendered page.
- These display fallbacks do not manufacture journal records. Publishing a current issue and selecting a legal license remain journal-manager decisions in OJS.

## Required journal-admin data remediation

These items live in OJS data/configuration and must be corrected by an authorized journal manager. They must not be hardcoded in the theme.

### All journals

1. In **Settings → Distribution**, select the actual license, enter any required custom license URL/terms, and choose the Copyright Holder. Confirm the public article metadata matches the policy.
2. Replace placeholder e-ISSN/p-ISSN values with assigned identifiers or leave them empty until assigned.
3. Publish a real current issue before promoting “Current Issue”, article, DOI, or archive claims.
4. Verify indexing/accreditation claims against authoritative profiles before adding them to About or Additional Content.
5. Standardize the official editorial/contact email in Journal, Contact, sidebar blocks, and Additional Content.
6. Populate Editorial Masthead from Users & Roles. Enable masthead display only for active, intended memberships.

### Content corrections observed in production

- **MCJ:** replace the MBJ text on the About page; verify every displayed editorial member; replace placeholder ISSN/DOI values; remove legacy `/index.php/mcj/...` links from rich text.
- **MCSJ:** replace the MBJ template reference in Additional Home Content.
- **MBJ, MCSJ, MMJ, MPJ:** populate and verify Editorial Masthead.
- **MMJ and MPJ:** populate the empty About content.

## Configuration remediation

Set a real IANA timezone in production `config.inc.php`, for example the hosting-approved value for the journal office. The code fallback prevents UI failure, but explicit configuration remains the operational source of truth.

Do not commit production credentials or the production `config.inc.php`.

## Post-deployment QA

1. Pull the reviewed branch through the cPanel Git workflow.
2. Clear OJS template/data caches using the established safe procedure.
3. Test portal and representative journal pages at 1440, 1024, 768, 430, 390, and 360 CSS pixels.
4. Verify no horizontal overflow; mobile filters/tools open, switch panel, close with Escape, and restore focus.
5. Verify portal Featured Articles and Latest Issues remain truthful when no current issue exists.
6. Test Dashboard, Active Submissions, Issues, Announcements, DOIs, all Settings sections, Users & Roles, and Tools at desktop and mobile widths.
7. Confirm raw locale keys and `pkp.context.timeZone is not configured` no longer appear.
8. Confirm the footer shows the configured OJS license rather than a hardcoded license.
9. Re-test article, galley, download, DOI, and submission flows after real issues/articles exist.
