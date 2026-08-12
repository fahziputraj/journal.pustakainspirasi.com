# PIM production stabilization — 2026-08-12

## Summary

Two independent production issues were investigated:

1. The custom theme linked Editorial Team to the removed OJS 3.5 operation `about/editorialTeam`. OJS 3.5 exposes `about/editorialMasthead`.
2. User-role invitations use the configured mail transport. The production exception from Symfony `ProcessStream::proc_open()` is consistent with the sendmail transport on hosting where `proc_open()` is disabled. This is a production configuration remediation, not an application-code defect.

## Repository changes

- Changed the Pustaka Minang sidebar route to `about/editorialMasthead`.
- Updated the theme's page-specific CSS selectors to `pkp_op_editorialMasthead`.
- Kept the deployment snapshot aligned with the runtime theme copy.
- Removed unconditional theme initialization logging.

Runtime authorities are:

- `plugins/themes/pustakaMinang/templates/frontend/components/header.tpl`
- `plugins/themes/pustakaMinang/styles/pim-layout.css`, loaded by `PustakaMinangThemePlugin.php`

The root `pim-layout.css`, root `indexSite.tpl`, and `docs/Deploy_Update_1` copies are not the active theme authorities. They were not otherwise refactored in this emergency patch.

## Production SMTP configuration

The mail runtime and production procedure were audited in more detail after this stabilization note was merged. Follow `docs/PIM_SMTP_REMEDIATION_20260813.md` as the authoritative SMTP runbook. In particular, the installed OJS/Laravel/Symfony path requires `default = smtp` but does not require the legacy `smtp = On` flag, and its TLS behavior must not be inferred from the older PHPMailer-oriented template comment.

## Invitation consistency risk

See `docs/PIM_SMTP_REMEDIATION_20260813.md` for the source-traced invitation lifecycle, partial-state risks, pre-retry inspection, QA, and rollback procedure.

## Editorial masthead data contract

The public `editorialMasthead` handler does not print the Editorial History rich-text field. It renders user groups configured for the masthead and users whose membership is active and enabled for masthead display; reviewer display is handled separately by OJS.

If the corrected page loads but is empty, check in Users & Roles that:

- the relevant user group is enabled for masthead display;
- each intended person is assigned to that group;
- the assignment is active for the current date;
- masthead display is enabled on that membership;
- names, affiliations, and ORCID data are populated as desired.

Do not hardcode editorial names into the theme. The Editorial History rich-text content belongs to `about/editorialHistory`, not the current editorial masthead.

## Manual QA after pull

1. Clear OJS template/data caches using the established production procedure.
2. Open `/index.php/mcj/about/editorialMasthead`; confirm HTTP 200 and the Editorial Team sidebar link targets this URL.
3. Repeat for `/index.php/mbj/about/editorialMasthead`.
4. Repeat for at least one additional journal context.
5. Confirm the masthead contains the expected active, masthead-enabled users. If empty, apply the data checks above.
6. Exercise Home / Overview, Search, Announcements, Current Issue, Archives, Author Guidelines, About, and Contact from the sidebar.
7. After manually changing production SMTP configuration, send a controlled user-role invitation and confirm: no `proc_open()` exception, one email delivered, one user record, and the intended role/masthead assignment.
8. Check PHP/OJS logs for new mailer or theme initialization errors.

No deployment or database mutation is part of this patch.
