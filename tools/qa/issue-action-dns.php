<?php
/**
 * Guard for the reverse DNS stall (PIM 20261127): IssueAction::subscribedDomain() must only call
 * Request::getRemoteDomain() (gethostbyaddr, ~25 s for IPs without PTR) for subscription journals.
 * Usage: php tools/qa/issue-action-dns.php [path/to/IssueAction.php]
 */
$file = $argv[1] ?? __DIR__ . '/../../classes/issue/IssueAction.php';
$src = file_get_contents($file);
if (!preg_match('/function subscribedDomain\(.*?\r?\n    \}\r?\n/s', $src, $m)) {
    fwrite(STDERR, "FAIL subscribedDomain() not found\n");
    exit(1);
}
$body = $m[0];
$guard = strpos($body, "getData('publishingMode') == Journal::PUBLISHING_MODE_SUBSCRIPTION");
$lookup = strpos($body, '$request->getRemoteDomain()');
if ($guard === false || $lookup === false || $guard > $lookup) {
    fwrite(STDERR, "FAIL reverse DNS lookup is not limited to subscription journals\n");
    exit(1);
}
echo "PASS: subscribedDomain() skips the reverse DNS lookup for open-access journals.\n";
