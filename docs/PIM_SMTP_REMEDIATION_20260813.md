# PIM Journal production SMTP remediation — 2026-08-13

## Scope and diagnosis

This runbook addresses the MBJ user-role invitation failure:

```text
Call to undefined function Symfony\Component\Mailer\Transport\Smtp\Stream\proc_open()
```

The repository evidence supports a configuration fix, not a vendor patch:

- `config.TEMPLATE.inc.php` selects `sendmail` by default and supplies `/usr/sbin/sendmail -bs`.
- `lib/pkp/classes/core/PKPContainer.php` maps `[email] default` directly to Laravel's default mailer. Its `sendmail` transport uses `sendmail_path`; its `smtp` transport uses `smtp_server`, `smtp_port`, `smtp_username`, `smtp_password`, and `smtp_suppress_cert_check`.
- Symfony's sendmail/process stream invokes `proc_open()`. A host that disables that PHP function cannot use this transport.
- Selecting the SMTP transport opens a network SMTP connection and avoids the sendmail process path.

Do not patch `lib/pkp/lib/vendor`, enable insecure certificate handling, or commit production `config.inc.php` to solve this incident.

## OJS 3.5 configuration contract

For this repository, `default = smtp` is sufficient to select SMTP. The legacy/template flag `smtp = On` is not read by `PKPContainer` or another PHP mail configuration path, so it is unnecessary and should be omitted from the remediation.

The template describes `smtp_auth` as `ssl` or `tls`, but the installed runtime is Laravel Framework 11.44.1 with Symfony Mailer 7.2.3, not PHPMailer for the `smtp` driver. In this runtime:

- Laravel selects the `smtps` scheme when `smtp_port` is `465`.
- For other SMTP ports, Laravel selects `smtp`; Symfony Mailer negotiates STARTTLS automatically when the server advertises it.
- `smtp_auth` is copied into Laravel's `encryption` configuration key, but this Laravel/Symfony construction path does not use that key to select the scheme.

Therefore, copy the exact outgoing server and port from cPanel. Do not invent a transport mode. Port 465 normally means implicit TLS/SMTPS; port 587 normally means SMTP upgraded with STARTTLS, but the cPanel values are authoritative. `smtp_auth` may be omitted for this installed runtime. If a future OJS upgrade changes the mail adapter, re-audit the template and source before carrying this conclusion forward.

## Values to collect in cPanel

Open **cPanel → Email Accounts → the sender account → Connect Devices / Set Up Mail Client → Secure SSL/TLS Settings** and record:

- Outgoing server / SMTP host
- SMTP port
- Authentication requirement (normally required for a mailbox account)
- Username, usually the complete email address

Enter the password manually during the production edit. Do not paste it into Git, tickets, chat, screenshots, shell history, application logs, or this runbook. If sharing a cPanel screenshot, redact the password and any unrelated secrets.

## Production change

Production root:

```text
/home/pusf3964/public_html/journal.pustakainspirasi.com
```

The Git staging checkout at `/home/pusf3964/repositories/pim-jurnal` and its `.cpanel.yml` do not deploy `config.inc.php`. Make this change directly in cPanel File Manager; do not add the file to the deployment manifest.

1. In cPanel File Manager, open the production root.
2. Copy `config.inc.php` to `config.inc.php.bak-pre-smtp-20260813`. Confirm the copy exists before editing.
3. Edit only the `[email]` section of production `config.inc.php`:

```ini
[email]
default = smtp
smtp_server = "<OUTGOING_SERVER_FROM_CPANEL>"
smtp_port = <SMTP_PORT_FROM_CPANEL>
smtp_username = "<FULL_SMTP_USERNAME_FROM_CPANEL>"
smtp_password = "<ENTER_MANUALLY_IN_CPANEL>"
```

4. Preserve any unrelated production settings. Do not add `smtp = On`. Omit `smtp_auth` for the currently installed Laravel/Symfony SMTP path; transport security is selected from the provider's port as described above.
5. Keep `smtp_suppress_cert_check` absent or `Off`. Never turn it on merely to bypass a certificate error.
6. Save the file. Clear OJS caches through the administrative UI if available. If a manual cache clear is required, remove only generated cache contents using the established cPanel procedure—never application or uploaded files.

If the provider supplies a nonstandard SMTP/TLS configuration that cannot be represented by the fields above, stop and obtain provider-specific guidance rather than guessing.

## Partial-state risk and pre-retry inspection

`Invitation::initialize()` saves an `INITIALIZED` invitation before the final invite action. `Invitation::invite()` then updates its payload, prepares the key/expiry, sends the email, and only after a successful send changes the invitation to `PENDING` and saves it. There is no explicit database transaction around these operations.

Consequences of a mail exception:

- An `INITIALIZED` invitation row can remain, including updated payload data.
- The failed send does not reach the `PENDING` status save.
- The role assignment is not applied by the send step. For this invitation type, user-group changes are applied later when the recipient accepts the invitation.
- A user may nevertheless already exist from an earlier attempt or another workflow. Repeated retries without inspection can create confusion even when validation prevents some duplicate states.

Before retrying, search Users & Roles by the exact email address. Record whether the user already exists, which MBJ roles are currently assigned, and whether the invitation UI shows an existing pending/unfinished invitation. Do not repeatedly click Invite while an error response is unresolved.

## QA after the change

Use a controlled test address that can receive mail and is safe to assign in MBJ.

1. Search the exact address in MBJ Users & Roles and record the starting user and role state.
2. Invite it to one intended MBJ role once.
3. Confirm the UI completes without the `proc_open()` exception.
4. Confirm exactly one invitation email is received, with a usable link and the expected MBJ context/role.
5. Before acceptance, confirm there is no duplicate user and no unintended role assignment.
6. Accept the invitation, then confirm exactly one user record and exactly one intended active role assignment.
7. As an administrator, edit the role of an existing ordinary admin/user and save once. Confirm the change persists and no mail transport error appears.
8. Reopen Users & Roles and verify there are no duplicate users, duplicate assignments, or stale pending invitations for either test address.
9. Review OJS/PHP logs for new mailer exceptions, authentication failures, TLS/certificate errors, or repeated sends. Do not copy credentials into a diagnostic log or support message.

Authentication failure means the host/port/username/password must be checked against cPanel. A certificate error must be corrected at the server/provider level; do not set `smtp_suppress_cert_check = On` as a routine workaround.

## Rollback

If the SMTP change causes a regression:

1. In cPanel File Manager, preserve the failed edited file as `config.inc.php.failed-smtp-20260813` only if it can remain access-controlled and outside Git. Do not download or share it casually because it contains a password.
2. Replace production `config.inc.php` with the verified `config.inc.php.bak-pre-smtp-20260813` copy.
3. Clear OJS caches using the same safe procedure.
4. Confirm the site and administration pages load.
5. Do not retry invitations while the restored sendmail configuration still triggers `proc_open()`; escalate the provider SMTP settings instead.

The backup and failed configuration remain production secrets and must never be added to the repository.

## Separate issue note

Editorial Masthead routing and empty masthead data are separate from this mail fix. The earlier route patch is already deployed; do not mix sidebar/custom-block or masthead data changes into this remediation.
