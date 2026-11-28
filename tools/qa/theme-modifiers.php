<?php
/**
 * Registering the theme's Smarty modifiers twice in one request must not throw
 * (PIM 20261127: "Plugin tag 'pim_article_views' already registered", 597 log entries).
 * Usage: php tools/qa/theme-modifiers.php
 */
require __DIR__ . '/../../lib/pkp/lib/vendor/smarty/smarty/libs/Smarty.class.php';
$src = file_get_contents(__DIR__ . '/../../plugins/themes/pustakaMinang/PustakaMinangThemePlugin.php');
if (!preg_match('/function registerSmartyModifiers\(.*?\r?\n    \}\r?\n/s', $src, $m)) { fwrite(STDERR, "FAIL method not found\n"); exit(1); }
// Run the method body against a real Smarty instance with stub callbacks.
$body = preg_replace('/^.*?\{/s', '', $m[0], 1);
$body = preg_replace('/\}\s*$/', '', $body);
$body = str_replace('$args[0]', '$smarty', $body);
$body = preg_replace('/\[\$this, \'(\w+)\'\]/', "fn() => '$1'", $body);
$smarty = new Smarty();
$run = function ($smarty) use ($body) { return eval($body); };
try {
    $run($smarty);
    $run($smarty);
} catch (Throwable $e) {
    fwrite(STDERR, 'FAIL second registration threw: ' . $e->getMessage() . "\n");
    exit(1);
}
foreach (['pim_article_views', 'pim_article_downloads', 'pim_normalize_editorial_team_urls'] as $name) {
    if (empty($smarty->registered_plugins['modifier'][$name])) { fwrite(STDERR, "FAIL $name not registered\n"); exit(1); }
}
echo "PASS: theme modifiers register once and survive a second display() in the same request.\n";
